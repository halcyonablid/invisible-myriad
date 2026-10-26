# Plugin: ontology-meta-hub

status: runtime_synced_static_verified_ui_smoke_pending
created: 2026-08-06

## 2026-09-24 Concave boundary feasibility correction — Published

A current 28-node / 40-visual-path / 11-group replay reproduced the user's corner-touch failure. The CP model previously omitted two renderer constraints: no opposite-diagonal tile contacts at a grid vertex, and at most 20 polygon corners. The deployed solver now encodes both including zero-valued exterior quadrants, while the existing hole, membership, node, route and port validators remain independent and unchanged. Stronger feasibility constraints required 4 search workers and a maximum 5-second solve allocation; the 17-second coordinator and 20-second parent cap remain. Results may vary between runs and this is not a global feasibility or optimality guarantee.

Candidate: `state/staging/ontology-concave-rescue-20260923/`. Current replay/repeat/narrow plus two historical full-engine cases pass original parent gates; actual-bundle browser simulation passes Preview/Cancel/Apply/Undo. Slot, main/UI and other algorithm files are unchanged. After explicit user confirmation, concave-placement.py and concave.cjs were synchronized across Runtime/Dev/Mirror (6 targets). Installed hashes and the 52 direct-file allowlist check pass; the isolated actual-runtime helper replay passes original parent guards in about 8.4 seconds, with zero hard conflicts and ordinary crossings still present. The UI starts a new helper process on each calculation, so the next calculation reads these files; no automatic graph application or Obsidian restart was performed. Publication trace: `change-records/2026/2026-09/20260923-171700-concave-rescue-publication.md`. Evidence: confirmed_by_user + confirmed_by_code; correction/refinement within the existing owner-derived layout boundary. Trace: `change-records/2026/2026-09/20260923-170925-concave-boundary-rescue.md`.

## 2026-09-23 Inline Dialogue Layout — Published; Native Reload Pending

The user confirmed deployment of the original-canvas correction. The saved drawing now renders inside the existing graph viewport, with stable-ID node/edge/group selection using the native right-side details and explicit owner actions. Snapshot labels/membership/geometry stay frozen; current details remain live. Returning to the real-time layout restores the previous viewport and selection. Archived or missing objects show an unavailable message, including edges with archived endpoints.

Runtime/Dev/Mirror main SHA-256 `dec37d7dce216d610d27fe0c79c2f456f912f94b6a7b3e902176d266f5c473f8`; styles `85f4cdd6798d167d25c3f16c83791612c10d80f9c38137ad950f0c998845ba39`. Seven files were published: main/styles across three roles and global SKILL.md. The saved slot, business data, Registry and enabled-plugin configuration are unchanged. Candidate model/browser and independent review PASS; deployment hashes and direct plugin-file inventory PASS. Native loaded-host acceptance awaits reload. Source: `state/staging/ontology-dialogue-inline-20260923/`; trace: `change-records/2026/2026-09/20260923-153400-dialogue-inline-publication.md`. Source status: confirmed_by_user + confirmed_by_code. No macro model or ownership change.

## 2026-09-23 Earlier Modal Publication — Historical

The following describes the superseded modal release, not the current original-canvas interaction.

The user requested a single saved drawing maintained through conversation. A repository candidate adds `对话布局` immediately beside Auto Layout. Hub owns the separate authored `dialogue-layout.json` slot; its reader consumes fixed labels, memberships, directional identities and coordinates without reading or merging the live graph. Live additions, renames, archives and current-state changes do not revise the drawing. Each opening rereads the slot, so a later reviewed conversation update replaces this one version. This is an authored projection, distinct from live graph content and automatic-layout metadata.

The first four-column drawing was rejected by the user and is superseded: editorial columns do not express the user's original groups. The replacement candidate strictly retains revision1596's28active states,44directed relations and11original groups (40visual paths including4reciprocal pairs), including spatial membership and multiple group membership. One archived member is excluded only from the active projection and recorded in provenance. Routing corridors are widened by occupancy and short approaches are evaluated separately. The owner-document native dialog offers zoom, local highlighting and return without persistence or state transition. JSON Asset Registry has a matching staged exact-path read-only classification. No provider/BUS/capsule or macro ownership changes.

Source status: confirmed_by_user for the intended frozen/conversation-update and strict original-group semantics; confirmed_by_code for repository candidate behavior only. After explicit user confirmation, the reviewed Hub main/styles/slot and Registry main/README were published to Runtime/Dev/Mirror on 2026-09-23. All17 installation targets (including two global Skill files) match reviewed source hashes; all six plugin inventories show only the intended changes, with business data and enabled-plugin configuration unchanged. No automatic plugin reload was performed. Browser simulation and static geometry checks do not establish native loaded-host acceptance or globally optimal routing. Published source: `state/staging/ontology-dialogue-groups-20260923/`; publication trace: `change-records/2026/2026-09/20260923-145734-dialogue-layout-publication.md`; engineering trace: `change-records/2026/2026-09/20260923-dialogue-groups-spacing-skill.md`. The prior `ontology-dialogue-layout-20260923` artifact is rejected historical evidence only. Update label: corrects/refines Hub-local authored projection; see [对话绘图](../workflows/dialogue-graph-drawing.md). Framework navigation adds this workflow under existing FW-009; macro model is unchanged.

## 2026-09-22 Node/Edge Hover Linkage — Deployed

User-authorized main/styles release synchronized actual runtime/dev/mirror at18:56+08:00 (main8B291397,styles176D7A50). Hovering a node highlights all active incoming/outgoing visual routes and connected endpoints; hovering an edge highlights that route, arrowheads and its two endpoints. Pointer target takes precedence over retained keyboard focus, which becomes the fallback on leave. Temporary endpoint dashes exclude selected nodes, preserving selected solid outlines and current-state green markers. Trace belongs to the rendered canvas only and does not write, rerender, select, relayout or change directional weights. Reciprocal directions retain their shared visual path; no self-loop capability was added.

Node child/focus transitions, pointer cancellation, unexpected capture loss and ordinary drag termination are handled locally. Capture loss cancels temporary displacement and clears handlers; normal drag still commits through the existing transaction. Actual-bundle browser and previous group/weighted regressions passed independent staging review. All three complete installed inventories and owner-data protection checked after publication; plugin remained disabled, with no automatic activation/reload. Native loaded-host use remains pending. Source confirmed_by_user + confirmed_by_code; narrow UI contract refinement only, no provider/BUS/bridge, graph schema or macro model change. Record `20260922-ontology-hover-linkage-deploy.md`; rollback `state/backups/ontology-hover-deploy-20260922T105619Z/`.

## 2026-09-22 Weighted Constraint Grid — Deployed

User-authorized five-file release synchronized actual runtime/dev/mirror at 18:14 +08:00, main SHA256 A59B1E3D17E3803DF02829583AACF3ED9609A8F566D882BAACDDFA72D3E90273. Hub owns optional directed `edge.weightScore` integer0..99; missing means50 without backfill,0 retains the connection. Strength `1+3*sqrt(score/99)` is normalized by visual-path mean; reciprocal directions retain separate scores while their shared visual route uses maximum strength. Scores are layout preferences, not transition probabilities.

New `cpsat-weighted` / 加权约束网格 · 重点连线 compares fully validated baseline, original-position rerouting and bounded grid swaps/empty-cell moves. Weighted crossings/touches and excess route length dominate a smaller proximity preference. Existing six algorithms, overlapping group semantics, nonmember exclusion, independent-route protections and occupied grid-span difference<=3 remain. Score edits save only the authored score; layout still requires explicit Preview/Apply and supports revision-bound Undo. Derived normalized weights/diagnostics are not saved as owner content. Bounded search is not a global optimum or a guarantee that every high-score edge improves.

Source confirmed_by_user + confirmed_by_code. Five release files and all three inventories were checked; business data unchanged. Plugin was externally disabled immediately before publication, so deployment preserved disabled state and performed no reload. Native loaded-host acceptance remains pending. Engineering record: `20260922-ontology-weighted-grid-deploy.md`; role-specific rollback and inventories: `state/backups/ontology-weighted-deploy-20260922T101452Z/`. This refines the Hub-local authored/derived contract; provider/BUS/bridge ownership and the macro framework model are unchanged.

## 2026-09-22 State Membership Highlighting — Deployed

User-authorized main-only release synchronized runtime/dev/mirror at 2026-09-22 12:07 +08:00, SHA256 C31D950586513D7DBECF55C12D2D5007438978F36A53AF490B4B75B8D8583F78. Selecting a state (including initial/default selection) derives all active containing groups and highlights their valid rectangle/concave contours with existing solid selected styling. Explicit group title/token/list selection takes singleton precedence, including empty groups; returning to state details restores membership highlights. Valid selected edges suppress inference, while stale/archived group and edge IDs cannot leave obsolete membership highlights. Only the explicit group marks its member cards; inferred groups retain state details and one selected node.

This refines the Hub-local UI selection contract, not membership/schema, providers, layout algorithms, saved geometry, routing or persistence. Existing invalid/conflicting contours remain hidden with warnings; overlap/label occlusion limits remain. Actual-bundle rectangle/concave, zero-write, geometry, scroll/zoom, isolation and Preview/Apply/Undo regressions passed independent review. No automatic Obsidian reload; native loaded-host acceptance remains pending. Source confirmed_by_user + confirmed_by_code; macro model/registry/Question Map unchanged. Release record `20260922-120701-ontology-node-group-highlight-deploy.md`; rollback/three-role manifests `state/backups/ontology-node-group-deploy-20260922-120430/`.

## 2026-09-21 Free Rectangular Grid Spans and Solid Group Selection — Deployed

User-authorized five-file release synchronized runtime/dev/mirror at 2026-09-21 21:13 +08:00. Rectangular `cpsat-avoid` now chooses both occupied spans directly, with absolute columns-minus-rows <=3 including internal empty bands. Fixed 4/3-column caps and transpose are removed. Physical viewport extent/aspect/area preference dominates bounded edge-length cost; CP-SAT moving repair is bypassed and final routes must preserve the solved grid. Five-second solve still distinguishes OPTIMAL within the discrete model from FEASIBLE; neither guarantees globally optimal routed appearance. Concave solver retains its independent previous width/height constraints.

Selected rectangle/concave group contours are visibly solid; deselection restores their pattern. Main bundle changes only the rectangular tooltip, with existing Apply/Undo and all ownership/provider/schema behavior preserved. Candidate tests include 24-node landscape6x4/portrait4x7, 60-node9x7, overlapping groups, impossible rejection, unchanged ELK/Cola routes, actual bundle preview/cancel/Apply/Undo and12theme/zoom contour cases. Anonymous current graph replay21nodes/26edges/8groups gives6x4 FEASIBLE fit.886, all hard route conflicts0, four ordinary crossings.

Three-role SHA256: main `028F8B99E6BF7D8606803D24C120AC4908C9BBDAF4A3569AD10FAA60E62881F8`; styles `75975B6F14F7BC03F42B9D23699675A1D1CB59E60FC7746E412F74C8515A972C`; engine `69070000152F533844F240A6994012F256C433F7B026F02C203833D05F0B8A8F`; placement `FF425C62EFBF42790C7082CEE923C7642FDA5F4798557BBFD070A68A7568CB3A`; README `602E43DD8E223485DB85F75571962607F593848E27A475F813777EB3976DED8E`. Backup and before/after evidence: `state/backups/ontology-grid-span-deploy-20260921-210904`; implementation record `20260921-ontology-grid-span-selection.md`; release record `20260921-211345-ontology-grid-span-deploy.md`. All15code copies and34protected existence/hash sentinels pass. No business data/dependency/junction copies and no automatic reload. Native loaded-host UI acceptance remains pending; explicit Auto Layout/Apply is needed to update saved coordinates. Framework macro model/Question Map unchanged. Evidence confirmed_by_user+confirmed_by_code, update refines local UI contract.

## 2026-09-14 Independent Route Separation — Deployed

User-confirmed contract: A→B/A→C and fan-in must use independent paths, not a shared trunk; A↔B stays one path/two arrows. Candidate `state/staging/ontology-route-separation-20260914` hard-gates positive shared lengths, same-node port crowding and source/arrow approach interference at both explicit layout acceptance and Apply. Nearby parallel lanes/corners and group-boundary hugging are soft penalties. Crossings remain possible; complete scoring and bounded search are required, not an optimality claim.

Legacy saved paths and exact Undo remain compatible and are only warned on, not rewritten. New/repaired paths reserve fixed routes and use deterministic creation priority plus occupancy-checked cache reuse. Normal state/rename/notes preserve unrelated routes. Hover/keyboard focus traces the full path and endpoints within the current host, without redraw, save or navigation. No provider/BUS/schema or macro ownership changes; no new command.

Sixteen built-artifact test suites PASS; final independent route_separation_verifier PASS with five independently rerun suites and byte/hash checks. Synthetic13node actual Worker/SVG fixture overlap359→0px, ports2→0, approaches21→0, fit1→1, but crossings3→5. SourceF430F7C4; engineering record `20260914-ontology-route-separation.md`, experience card `2026-09-14-independent-routes-need-clearance.md`. Evidence confirmed_by_user + confirmed_by_code; update refines local UI contract.

User-authorized deployment at2026-09-14T13:34:42+08:00: runtime/dev/mirror main709BC39F4A1989A6DC2177B8FD863F62CEA2952C832A64FC5C54413310675A11/styles125917115D23D2605C75AD067E3FABCEF1FA0CD5CCA1D94AEC2518F74CA664E1 now match. Only six main/styles files copied after independent preflight PASS and drift checks; immediate18afterchecks PASS, runtime data630D9653 unchanged. Backup `state/backups/ontology-route-separation-deploy-20260914-133137`; release record `20260914-133442-ontology-meta-hub-route-separation-deploy.md`. No business data writes or native reload/smoke. New routing requires explicit Auto Layout/Apply after reload; the saved old graph is not automatically rearranged. This deployment fact is no_model_change; macro registry/Question Map unchanged.

## 2026-09-14 Readable Routing and Compact Groups — Deployed

User observation: a dedicated group row wastes canvas height and shared/T-crossing line segments obscure traversal. Confirmed by code: group-position ranking previously omitted routed interactions and its replacement routes avoided nodes only. This refines the local projection contract, not Hub/provider ownership or schema.

Staging `state/staging/ontology-readable-routing-20260914` moves the active-group selector into the existing toolbar (includes empty/conflicting groups, read-only selection, scoped focus and preview lock). Explicit automatic layout retains valid ELK and legacy-fit candidates plus a small shortlist; complete real-route crossing/contact/overlap scores guide choice. Optional congestion-aware local A* uses offset lanes/ports; partial scores cannot defeat fully scored choices. Ordinary editing continues to reuse saved routes, with no automatic global rerouting. Fit and group hard boundaries remain gates; bounded failure retains complete candidates or rejects without applying.

Apply compares canonical zoom1 measurements to saved canonical sizes and separately validates group exclusion against actual zoomed sizes. Temporary measurement restores zoom/scroll synchronously. Tests retain genuine size-drift rejection, group conflict rejection and exact Undo. Independent code review PASS; actual13node Worker/SVG fixture crossings7→3, contacts23→5, overlap1432→359px, fit1→1. This is fixture evidence, not native user-graph acceptance or optimal/zero-crossing guarantee.

User-authorized deployment: mainC4719BF95D25A6732F9EEACCF29D4918EEA37841826BAA87822172510223845D/styles8BCD62455D9162D058A6280C28F9CE90CA8BCF4435E72C59B4FDB38FA7E52F06 copied to runtime/dev/mirror, six files only. Independent preflight PASS; immediate eighteen existence/hash checks PASS at 2026-09-14T12:27:28+08:00. No business data writes or native reload/smoke. Implementation record `20260914-ontology-readable-routing.md`; release record `20260914-ontology-readable-routing-deploy.md`; deployment backup `state/backups/ontology-readable-routing-deploy-20260914`. Existing graphs are not automatically rearranged; optimization requires explicit Auto Layout and Apply. Evidence confirmed_by_user + confirmed_by_code; update refines; macro registry/Question Map unchanged.

## 2026-09-14 Overlapping State Groups — Deployed

User-confirmed extension: named/commented state groups with multiple membership, created by explicit full-card rectangle selection. Hub-private optional `stateGraph.groups` owns membership/name/notes; no provider or capsule ownership change, no new business file and no startup migration. Current-state navigation and saved route signatures remain group-independent. Group-only edits preserve unrelated routes. Empty/all-archived groups retain identities/content and remain accessible from the group list; archive does not delete states.

Candidate implementation derives one padded rectangle per group (14px side/bottom,42px top); shared geometry governs drawing, canvas bounds, candidate validation and Apply. Any nonmember card intersection rejects auto-Apply. Conflicting manual frames are suppressed with named warnings, never presented as accurate groups. Labels stay inside their frames, avoid other titles and defer to the persistent list if no header slot fits. Group comments use separate durable drafts and target-field CAS. Structural controls require editing mode.

Grouping layout follows offline ELK with at most96 search rounds /145 position candidates and a2s candidate-search deadline, then separately bounded local routing (500000 collision checks,20000 visits). These are bounded heuristics, not an infeasibility proof; failure preserves the original graph. Group validity outranks previous fit/zoom score. New Apply is hard-gated while explicit revision-bound Undo restores exact history (including former conflicts), and warns after restoration. Real-size Apply checks tolerate1px rounding but group intersection checks still use actual sizes.

Source confirmed_by_user + confirmed_by_code; update label refines. Staging `state/staging/ontology-state-groups-20260914`, implementation record `20260914-ontology-state-groups.md`. User-authorized deployment copied only main.js/styles.css to runtime/dev/mirror (six files); eighteen post-copy checks PASS. Main SHA256 BE458E5EE33240B586EDEFC0F32ABD562A785C9F8EE5425B5C0CFD92B1848270; styles SHA256 9AF563FC4255DBFDF0C29A7E793D1E4DBFEB1029CADA6FF678522E0B6273E3F8. Backup `state/backups/ontology-groups-deploy-20260914`; release record `20260914-ontology-groups-deploy.md`. No live data writes/reload/native smoke. Macro registry/Question Map unchanged: Hub-local grouping projection extension.

## 2026-09-14 Local Editing Route Stability — Deployed

Supersedes whole-graph geometry invalidation below. A bounded validated saved-layout baseline now supports per-pair route reuse: same-size renames and unrelated connection edits preserve existing paths; endpoint resizing/movement or new intersecting obstacles trigger local repair only. Reciprocal edges remain one path/two arrowheads, including deletion of the original representative. Full node rearrangement remains an explicit automatic-layout action. No schema/provider/BUS contract changes and no render-time business writes.

Runtime/dev/mirror main SHA256: 0B3B3C55B5ADB67B248257467BEF35BA8DC49C3AA05D70CCDC3D43BBF4CEB8B4. Only three main.js files copied; eighteen post-copy checks PASS, protecting data/styles/manifests/license/module absence. Backup: state/backups/ontology-local-route-deploy-20260914. Release record: memory/obsidian-plugin-system/change-records/2026/2026-09/20260914-ontology-local-route-deploy.md. Independent implementation and release preflight PASS; actual bundled Worker/SVG regressions PASS. No restart/native runtime smoke performed.

Valid previously applied layout is reused; graphs without one require an explicit Apply once. Overlap or exhausted bounded local-search budgets can produce individually marked dashed fallback lines, not global invalidation. Synthetic 200-node/1000-edge pressure testing proves bounded cost, not perfect dense routing. Framework registry/Question Map unchanged (local geometry projection refinement).

## 2026-09-13 Durable Layout Routes — Deployed

This supersedes the surface-only routed-bends limitation in earlier release sections. Explicit Apply now persists coordinates and optional Hub-private `stateGraph.layout` version1 metadata (geometry signature, measured sizes and routed points) in one existing persistence transaction. Graph v1/v2 remain readable without startup migration. Signature includes visible active node identity/title/position and directed topology; current state/backPath/comments/attachments do not invalidate routes. Rendering also checks real dimensions and bounded complete geometry; unknown/damaged/stale metadata falls back without writes. Geometry changes require fresh layout; no background recomputation.

Undo remains one revision-bound surface action, restoring prior coordinates and optional field existence/value; committed routes survive navigation, comments and plugin/surface reload. Current-state green paint is geometry-neutral. Previous bends were not saved, so after loading this version the user needs one explicit automatic-layout Apply to create durable routing. Ontology providers, BUS, references and business ownership are unchanged; no dependency match for stateGraph in Mandala/Workspace fixture code.

Runtime/dev/mirror mainFFF4118A06362B785D0448A0885F73166A653256F3B4F1A409823137A17124AB; stylesB235BD06967D72A57C0A5560347F7933D519930541477805F317B733F6D79C3D. Six code/style copies only, eighteen post-copy checks PASS; data/manifests/license untouched, separate module absent. Independent code and preflight PASS. Backup state/backups/ontology-route-deploy-20260913; record20260913-ontology-route-deploy.md. Real bundle/Worker/SVG regression PASS including reload and mandatory Undo, not native runtime smoke; no automatic restart. Framework registry/Question Map unchanged (local geometry projection, no macro-layer redesign). Evidence confirmed_by_code; update label corrects/refines.

## 2026-09-13 Viewport-aware Balanced Layout — Deployed

status: runtime_synced_static_verified_ui_smoke_pending

Automatic layout now captures the actual canvas viewport and compares4 deterministic offline ELK variants (RIGHT/DOWN, normal/compact spacing). It scores fit/readability, occupied geometry and bounded crossing/spread heuristics, retaining baseline readability. Safe empty-band expansion moves nodes and routed points without stretching node dimensions or text. One total15s deadline returns validated best-so-far preview when available; cancel always rejects, changed viewport sizes reject stale preview. No automatic resize relayout or background worker. Existing explicit preview/apply/coordinate Undo and provider ownership remain unchanged; routed bends remain surface memory.

Source confirmed_by_user + confirmed_by_code; update label refines. Synthetic10node landscape fixture improved physical occupied height616→880 and fit92%→100%; not a guarantee of perfect uniformity or native user-data performance. Runtime/dev/mirror main216FC2D6A64AD9F68466F24727C007CBB0C2D85F8D783570C945718B2C51CA22. Only3 main.js copied;15 other protected entries unchanged including data, styles, license, manifest and module absence. Backup state/backups/ontology-balanced-deploy-20260913, engineering record20260913-ontology-balanced-deploy.md. Native reload/aesthetic acceptance pending; no automatic restart. Framework/Question Map unchanged: local UI refinement, no schema/owner/bridge change.

## 2026-09-13 Focus and Offline Automatic Layout — Deployed

status: runtime_synced_static_verified_ui_smoke_pending

Graph editing now offers Focus, fit/zoom, collapsible details and explicit offline ELK0.12.0 layered layout. Focus uses the surface owner-document portal with original placeholder and cleanup, not global hotkey interception. Layout runs only on request in a temporary Worker with15s timeout, complete ID/geometry validation and stale-result rejection. Preview does not write; Apply updates active node coordinates through the existing queue/drift/readback path. Saving cannot be cancelled once started; a confirmed save permits one revision-bound coordinate Undo. Current state, backPath, notes, attachment identities and directed edges are unaffected.

Coordinates persist; ELK routed bends and Undo are surface memory, invalidated by other graph revisions/reload. Existing edge rendering then reconnects saved positions. Reciprocal display remains one line/two arrowheads. Graph schema is unchanged; oversized results beyond20000 coordinates are rejected without clamping. No owner/provider contract or bridge change.

Source status confirmed_by_user + confirmed_by_code; update label refines. Candidate and independent final/predeploy checks pass. Runtime/dev/mirror mainCB8E943B72380CD5E38C428FF836C92608AC03612C8345CC0A32C16CC2BD3EF4, stylesD33947C74CAD12235F1C491BBA21889B885241D2656A09319B3B608AF45D621D, license637E81F4A1B6B4079535C499FCA05E238CF7605C1FF5B76D60D7DA7CE96700C9. Backup/18protection checks: state/backups/ontology-focus-deploy-20260913. Trace: memory/obsidian-plugin-system/change-records/2026/2026-09/20260913-ontology-focus-deploy.md. Only main/styles/license copied; no data or manifest changes and no restart. Native Obsidian theme/modal/window acceptance remains pending. Framework/Question Map unchanged: UI refinement, no macro ownership change.

## 2026-09-12 Bounded Return Path and Destination Tables — Deployed

status: runtime_synced_static_verified_ui_smoke_pending

Graph v2 adds backPath: at most 60 previous node IDs, with currentNodeId stored separately. Forward transition appends the old current ID, evicting the oldest beyond 60; Back atomically pops the last ID and makes it current, without requiring a reverse edge or logging the return again. Thus A→B→C becomes A→B after returning. Repeated IDs/cycles are valid. An archived last state blocks return without deleting/skipping history. Explicit entering a different state starts a fresh path (UI explains); exiting clears the path. Same-state enter, empty exit and empty back are no-ops. All writes share the existing graph persistence transaction.

v1 remains readable without migration and any unknown v1 backPath field is ignored for navigation; only actual navigation writes v2. Old v1-only code refuses v2, so code rollback alone does not restore edit compatibility. Never downgrade or overwrite user data to roll back; prepare a v2-compatible fix instead. Rendering never upgrades or prunes history.

Outgoing cards have stronger boundaries and a separated title area. Destination preview lists its Ontology attachments; opening one does not enter the destination. The action verifies daily family/use mode, current node, directed edge, target node, attachment/ref and captured graph revision before/after owner lookup; late results after navigation are rejected. Provider documents remain owner-controlled.

Evidence: confirmed_by_user + confirmed_by_code; update label refines. Candidate state/staging/ontology-return-path-20260912, independent model/browser/loader PASS, old Hub regressions PASS. Runtime/Dev/Mirror main164AEAF12757A0685EA725406878D0176491FBE4C302ABB203C784E39A60B986, styles6F9DDE2FD19177698CEADAB11DBD6E5F5B04A2ABAF5A85CF54DFEE1DF03B53E9. Backup/15 protection checks: state/backups/ontology-return-deploy-20260912. Trace: memory/obsidian-plugin-system/change-records/2026/2026-09/20260912-ontology-return-deploy.md. No data.json deployment or automatic restart; native reload acceptance pending. Older sections retain prior schema/release facts.

## 2026-09-12 Current Effective Keys — Content-independent Display Deployed

status: runtime_synced_static_verified_ui_smoke_pending

Current effective project and goal families expose All Keys and History, not Populated/Empty filters. Both empty and populated Ontology entries remain eligible for display; search, source selection and pagination still apply. History uses the separate historical owner family, not a merged current set. Restored/inherited content filters are cleared locally with their filtered entry cache/cursor. A full first-page read is required; failed or stale reads retain the retry marker until a matching successful commit. Other families retain their existing filters. No owner eligibility rule, provider API, graph data or document schema changed.

Evidence: user-confirmed requirement, confirmed_by_code in state/staging/ontology-effective-all-20260912; independent candidate and release tests PASS. Runtime/Dev/Mirror main60A2CA7E18B53036401DADC79F1729C47CA45F4F6E7BA2F7A331AA17638C3FAF; styles unchanged3A7BDFD84531B7BCB0C205CFCD0E7FE9CDA156BE37EDB7BD028FDBD050F4E077. Three main files copied; 15 protected items verified. Backup: state/backups/ontology-effective-all-deploy-20260912. Trace: memory/obsidian-plugin-system/change-records/2026/2026-09/20260912-ontology-effective-all-deploy.md. Update label: refines existing content-independent eligibility. Framework/Question Map/Skill unchanged; no restart, native loaded-host acceptance pending. Older sections are historical release records.

## 2026-09-12 State Graph Entry Scope — Corrected and Deployed

status: runtime_synced_static_verified_ui_smoke_pending

The State Graph is a third display mode exclusively under Daily Items (mandala-daily-item), alongside List and Cognition Tree. Other categories do not expose this mode and cannot render it through a stale surface flag. Leaving Daily Items clears local graph-mode/connection selection and returns the next Daily Items visit to List if graph mode was active; an independent cognition-tree preference is not otherwise erased. This is an entry/display restriction, not a data migration: the existing shared graph, currentNodeId, comments and all prior Ontology attachments remain intact. Switching one surface does not exit the shared current state or change another daily surface.

Observation: user clarified that the graph belongs to Daily Items after seeing it under Paradigm. Claim source: confirmed_by_user + confirmed_by_code; update label: corrects. Previous all-category entry was an implementation scope error, not intended per-category graphs. Ownership/provider contracts and long-term Question Map remain unchanged.

Evidence: state/staging/ontology-graph-daily-only-20260912; independent candidate/loader/browser PASS. Runtime/Dev/Mirror main1CACAF3EEF3169C859F6BD93FD0FD978F1FD54055CAFF5D73DC996F4200448C2, styles unchanged3A7BDFD84531B7BCB0C205CFCD0E7FE9CDA156BE37EDB7BD028FDBD050F4E077. Only three main.js files copied; 15 protection checks pass. Backup: state/backups/ontology-graph-daily-deploy-20260912. Trace: memory/obsidian-plugin-system/change-records/2026/2026-09/20260912-ontology-graph-daily-entry.md. No restart; native loaded-host acceptance pending. Earlier entries retain historical release hashes.

## 2026-09-11 State Comment Previews — Deployed

status: runtime_synced_static_verified_ui_smoke_pending

Use mode now shows current-state comments by default beside current Ontology attachments. Each outgoing active-state card previews its directed edge comments and destination-state comments separately. Only the explicit enter button transitions; reading/editing notes does not enter the destination. Previews use plain text, preserve line breaks, and show up to 600 characters with a full-editor link, never rewriting the original. Narrow containers stack sections; full names wrap. Use mode no longer constructs a hidden graph canvas. Existing owner APIs, graph schema, CAS and recovery editor remain unchanged.

Evidence: confirmed_by_code, user-requested UI, independent candidate PASS and release browser/loader tests in state/staging/ontology-graph-preview-20260911. Runtime/Dev/Mirror main SHA-256 F5D6765ED10E55DF7DA01DABCEB4760A87B518D888744FB2BBB88660D541423F; styles 3A7BDFD84531B7BCB0C205CFCD0E7FE9CDA156BE37EDB7BD028FDBD050F4E077. Only main/styles copied; 15-item before/after protection passes. Backup: state/backups/ontology-graph-preview-deploy-20260911. Trace: memory/obsidian-plugin-system/change-records/2026/2026-09/20260911-ontology-graph-preview-deploy.md. Update label: refines; no ownership or long-term Question Map change. No automatic restart; loaded native UI acceptance pending. Following sections retain historical release hashes.

## 2026-09-11 State Graph Interaction Update — Deployed

status: runtime_synced_static_verified_ui_smoke_pending

Reciprocal edges now render one path with arrowheads at both ends, while keeping separate directed identities, comments and archive lifecycles. A single direction can be removed independently; removing both validates and archives the exact pair atomically. Missing edge.notes is read as empty without migration. Node and edge note editors preserve separate recovery identities and text CAS.

Entering successfully switches the initiating surface to a compact use mode: current Ontology attachments and outgoing state choices. Editing controls and graph canvas are behind an explicit edit toggle; other surfaces retain their local editing choices while sharing currentNodeId. Attachment search filters the currently loaded candidates by display name/address/original name, not a whole-source search. Full node names wrap; per-render measured height determines edge endpoints, without background observers.

Evidence: user-confirmed UI requirements; source/model/browser and independent release PASS in state/staging/ontology-graph-edge-ui-20260911. Runtime/Dev/Mirror deployed main SHA-256 31ACEE9330E046A7D30397CC99103CFEAAE21E372C0BE347DEE01A28FDDA12AE and styles C5E0E8170D7803ABDA9276E3CA10348D33BAC2C2B0C690C4CF17FFD8A263080F. Only the self-contained two-file release was copied. Backup and 15-item before/after verification: state/backups/ontology-graph-edge-deploy-20260911/. data.json and manifests unchanged; separate state-graph.js remains absent. No restart performed; native loaded-host smoke still pending.

Update label: refines. Experience: memory/obsidian-plugin-system/cards/2026-09-11-state-graph-use-mode-and-directional-edges.md. The following initial-deployment section retains historical packaging/ownership evidence, not the latest hashes.

## 2026-09-11 State Graph — Deployed, Native UI Smoke Pending

status: runtime_synced_static_verified_ui_smoke_pending

This candidate adds a third `状态图` view beside the existing list and daily cognition tree. Hub owns its `stateGraph` nodes, directed edges, stable Ontology attachments, shared current node and state notes/recovery drafts. These are Hub-local authored data, not provider Ontology documents or provider recovery drafts. Existing role statements below about not owning documents/drafts refer to provider content.

State-graph cycles and opposite directed edges are allowed; this does not relax the unrelated cell-reference graph's cycle refusal. Entering a state changes only the Hub graph position, never State Capsules, tracking eligibility, Workspace mounts or owner data. Preview selection is separate from the shared current state.

Attachment buttons preserve full provider/scope/family/version/stableRef identity, reacquire a live descriptor through bounded lookup and delegate `openOntology`. Titles are display snapshots; missing targets remain attached. No new provider API, broadcast bridge or inline body mount is introduced.

All Hub-local data writers share queue, whole-data baseline comparison and readback. This detects external drift but is not a cross-process atomic transaction. Unknown save outcomes block further local writes. Notes use text compare-and-swap plus versioned vault/plugin/node-specific local recovery; a hard process exit cannot guarantee recovery if both stores fail.

Evidence: `state/staging/ontology-state-graph-20260911/`, model/browser/legacy regression tests. User confirmed deployment; Runtime/Dev/Mirror now share self-contained `main.js` (`D838B0E2...48DF`) and `styles.css` (`747714F2...1B18`). Original three-file packaging was blocked by the installed Obsidian loader's global require behavior; the deterministic builder in `tests/build-release.js` inlines the exact graph source while retaining injected `obsidian`. No separate `state-graph.js` was installed. Build provenance is in `release/build-manifest.json`; the modular source remains in staging, while Dev/Mirror contain release artifacts. Rebuild from those sources, not from an already bundled main. Native loader-shaped smoke and runtime-targeted regression pass; application reload, native Modal and embedded UI smoke remain pending. Backup: `state/backups/ontology-state-graph-deploy-20260911/`. No business JSON or manifest changed.

Bayesian update: `refines` Hub-local authorship while preserving provider content ownership. Long-term Question Map unchanged; runtime acceptance questions stay in the active project. Experience: `memory/obsidian-plugin-system/cards/2026-09-11-hub-state-graph-owner-and-shared-storage.md`.

## Role

status: runtime_synced_static_verified_ui_smoke_pending

Ontology Meta Hub is the discovery, grouping, navigation and transient cross-owner reference-coordination layer for Ontology owners across the Obsidian system. It answers which Ontologies exist, which source group they belong to, whether they contain effective content, and how to return to the exact owner surface. Its reference coordinator authorizes owner-native writes but does not become a content owner.

It is intentionally a standalone plugin rather than a Project Overview tab. Ontology spans reusable paradigms, daily records, daily lesson items and long-lived goal/project cognition; Project Overview remains an execution aggregator.

## Owns

status: confirmed_by_code

- Hub view state: selected family, selected stable source group, search text, state filter, current page and transient provider diagnostics.
- Provider registration leases and query/action cancellation controllers.
- Deterministic grouping and reduction of owner-supplied descriptors.
- Transient Meta capture state, provider-bound editor leases, complete reference-graph proofs and the serialized reference mutation queue.
- Hub-local symbolic projection in its own `data.json`: immutable automatic source codes, optional manual source-code overrides and per-owner aliases used only for local display, search and ordering.

The Hub owns no formal Ontology document, recovery draft, provider business JSON or lifecycle state. Its local symbolic projection is not an Ontology index of truth and cannot prove that a source owner exists or has been deleted.

## Provides

status: confirmed_by_code

- `ontology-meta-hub-view`, ribbon action and `open-ontology-meta-hub` command.
- `window.__ontologyMetaHubPluginApi` with provider registration, lease-aware unregistration, view opening, refresh and diagnostics.
- Group-summary-first UI with a five-family rail, owner-provided source capsules, bounded pages, name/source search, state filters, populated/empty/historical/orphan indicators and structure summaries.
- Per-source prior editors and per-owner Hub alias editors. A complete source catalog receives persistent three-letter automatic codes (`AAA ... ZZZ`) in stable `sourceGroupId` order; users manually enter the following object number/name, and Hub renders the compact composition `BAA011- 朱建明`. Prefix and body remain separate DOM spans, while the provider title stays visible as source identity.
- Sticky title/search bar; on desktop the source-capsule rail and table header stack beneath it with explicit offsets. The repeated purpose/usage column is intentionally omitted while descriptor compatibility is retained.
- Owner-delegated `openOntology` and `revealSource` actions.
- Provider-before-Hub and Hub-before-provider load-order discovery.
- `Mod+Shift+M` two-step cell capture (`A` source then `B` target), live source/backlink resolution and exact cell jumps.
- Generation/lease-bound editor adapters with `getWriteState()` and `subscribeWriteState()`; provider replacement, downgrade, unload or incomplete proof participation immediately freezes reference-bearing editors.
- Adapter calls never trust generation/lease fields emitted by a shared host editor. Capture injects the frozen owner lease and refuses a different owner; live resolution and exact opening route by the referenced address's provider. Owner validity remains mandatory for all operations, while global proof-participant availability gates writes rather than degraded reads.
- Complete paginated graph reduction, cycle refusal, source-address deletion refusal and owner-CAS `coordinateFormalCommit()`.

## Consumes

status: confirmed_by_code

- Workspace Mount `ontologyIndexProvider` for `workspace-paradigm` owners.
- Mandala `ontologyIndexProvider` for `mandala-daily-record`, `mandala-daily-item`, `mandala-goal-primary` and `mandala-project-primary` owners.
- Future providers that implement contract v1 and register explicit families/scopes.

## Contract Model

`owner map -> bounded descriptor -> Hub reduce/group/filter -> owner-controlled open/reveal`

- Providers list explicit canonical scopes; v1 does not imply whole-Vault coverage.
- Summary and cursor responses bind provider generation, owner revision, scope, family, sort version and filters.
- Descriptors expose identity, source, purpose, usage, lifecycle/content state and bounded structure counts, never Ontology bodies or recovery drafts.
- `combined-family-summary-v1` lets a multi-family owner reduce one authoritative snapshot; legacy providers are called once per declared family.
- Additive `source-group-facets-v1` supplies complete per-family source catalogs and filtered counts. Workspace capsules use stable paradigm identity and paradigm name, not individual paradigm items.
- Provider generation plus Hub lease token prevents an old unload event or late response from invalidating a replacement instance.
- Hub deadlines and view-close cancellation propagate `AbortSignal`; first-party owners recheck it before modal/focus side effects.

## Current Families

| Family | Owner | Owner union |
| --- | --- | --- |
| `workspace-paradigm` | Workspace Mount | Declared-scope canonical paradigm items, including valid empty owners. |
| `mandala-daily-record` | Mandala | `daysByDate union instancesByDate`; no fabricated dates. |
| `mandala-daily-item` | Mandala | Canonical side owners only; cross-state references deduplicate to the canonical item. |
| `mandala-goal-primary` | Mandala | Current goal plan rows union retained longitudinal documents. |
| `mandala-project-primary` | Mandala | Current project plan rows union retained longitudinal documents, using Workspace identity aliases. |

## Source Navigation

status: confirmed_by_code

- Workspace paradigms open the standard Ontology editor or reveal the exact paradigm item through Workspace-owned APIs.
- Daily records open the persisted date and focus the completion section.
- Daily items return to the canonical owner row, not a copied reference row.
- Goal/project owners open the corresponding vertical-plan tab and apply a one-shot exact owner focus through Mandala's existing row registry.
- Retained longitudinal owners absent from the current plan remain visible as `historical-orphan`; they can open read-only but cannot claim a live source row.

## Guardrails

status: confirmed_by_code

- Never read Workspace or Mandala owner JSON directly from the Hub.
- Never persist a second index as truth and never infer owner existence from Project Overview visibility or order.
- Missing/corrupt owner JSON, malformed/stale cursor, source switch, provider reload and duplicate stable identities fail closed.
- Historical orphan opening receives no commit or recovery writer.
- Search/pagination hydrate structure only for returned rows; providers remain bounded and Hub concurrency is capped.
- The active family uses one complete bounded descriptor snapshot cached by provider generation/lease and state/history filters. Search, source selection and local-name sorting are in-memory reductions; manual/global refresh, provider lifecycle changes and provider-issued title dirty signals invalidate the snapshot, while cursor loops or bounds fail closed. An invalidated in-flight load must not repopulate the old snapshot.
- Project display names remain provider-owned projections. Hub must use the Mandala descriptor's current title/revision and must not copy Workspace names into Hub-local aliases or formal Ontology data.
- Source priors use the full stable `providerId + canonical scopeId + familyId + sourceGroupId` identity and are unique only inside that provider/scope/family namespace. Source priors and owner aliases never write Workspace, Mandala, Keyword or formal Ontology data. One stable local owner has one editor; implicit close and plugin unload save before teardown, and a failed save keeps the editor open.
- Automatic source allocation runs only after a user opens one concrete family and Hub proves both a complete local descriptor snapshot and a complete unfiltered source catalog. The queued commit revalidates provider generation, lease, canonical scope and catalog fingerprint; startup, provider registration, restore, diagnostics and the all-family summary never allocate.
- Automatic codes are persistent reservations and are never moved or reused when a source disappears. A manual source-code override does not erase the reserved automatic code; `恢复自动分配` removes only the override. Legacy v1 `prefix` values read as manual overrides under projection schema v2, while future projection schemas stay readable and write-fail-closed.
- Family counts follow query/state/history filters but not the active source capsule; capsule counts follow those same filters but not their own selection. Entry pages apply the selected source only after those reductions.
- Source catalogs are never inferred from one page. Zero-match search preserves stable source identities with count `0`; incomplete top-level or family summaries disable capsules and reload entries without a stale source filter.
- Runtime deployment is separately gated. Repository-dev verification does not prove actual Obsidian rendering until manual smoke is completed.

## Cell Reference Coordination

status: confirmed_by_code

- Stable identities are canonical `celladdr:v1` and `schemaaddr:v2`; v1 Schema aliases are canonicalized before graph operations. Labels, row order and displayed text are never identity.
- `cell.reference` is a live content reference. During the binding, A is the sole formal Schema owner and B holds a mapped projection for B-owned instances; source row/table instances are never copied.
- The Hub persists neither relation edges nor an Ontology body. Every formal change is committed by the target/source owner through its own CAS writer after complete graph proof.
- The Hub exposes canonical Schema resolution/opening and formal detach coordination but never edits a Schema itself. B's shared-structure action opens A's exact native Schema-only editor.
- Final unlink removes the direct reference and active binding together. B becomes `forked-local` when it has use/dependency or proof is incomplete, and `blank-pruned` only after complete zero-use proof; no active `sourceLineage` remains.
- Incomplete proof may admit only one preservation-only unlink with zero Schema/cell address deletion. Blank prune, redirects, additions and address deletion require complete proof.
- Embedded Ontology references are not EVA generic relations and never write EVA storage.
- A stale adapter cannot become writable merely because a replacement provider registers. Reference-free Ontologies remain editable when reference coordination is unavailable.
- If capability changes while a destructive confirmation is open, mutation permission is rechecked after confirmation resolves and before any draft mutation.

Bayesian update: `corrects` the former retained-lineage-after-unlink claim and `refines` Hub's coordinator role. Evidence is repository-dev code/tests plus verifier `019fda36-df0e-78e1-92de-8cb4d44db112` final `PASS`; runtime remains separately gated.

## Evidence

- Repository dev: `workspaces/26- supermemoconcept的改进/插件/ontology-meta-hub/`.
- Focused regression: `workspaces/26- supermemoconcept的改进/插件/tests/ontology-meta-hub.test.js`.
- Backup/staging: `state/backups/ontology-meta-hub-20260806-122118` and `state/staging/ontology-meta-hub-20260806-122118`.
- Source-capsule backup/staging: `state/backups/ontology-source-capsules-20260806-175552` and `state/staging/ontology-source-capsules-20260806-175552`.
- Independent verifier `019fd566-bb60-74c1-bbcb-437ef733fe6e`: final `PASS` after source-focus remediation.
- Cell-reference verifier `019fd5f4-e192-7721-98db-00393bc2340b`: final `PASS` after dynamic downgrade and confirmation-race remediation.
- Source-capsule verifier `019fd699-3cd8-7cc1-8855-42f8b27a2756`: final `PASS` after incomplete-facet fallback and combined-summary completeness propagation.
- Local projection preflight verifier Galileo `01a01e52-e9e0-7141-89a2-35da8121918a`: `PASS_WITH_CHANGES`; stable keys, complete cached snapshots, non-nested capsule actions, spreadsheet ordering and implicit-close protection were incorporated.
- Local projection final verifier Lagrange `01a01e6e-1763-7b03-8a5d-091627db555d`: initial `BLOCK` identified scope-aware lookup, future-field retention during edits and unload-failure teardown; all three received focused regressions and the final verdict is `PASS`, with no P0/P1/P2.
- Local projection backup: `state/backups/ontology-meta-hub-local-projection-20260820-164807`; focused regression: `workspaces/26- supermemoconcept的改进/插件/tests/ontology-meta-hub-local-projection.test.js`.
- Local projection deployment backup: `state/backups/ontology-meta-hub-local-projection-deploy-20260820-173651`. Dev/Runtime/Mirror static hashes aligned after synchronizing only `main.js` and `styles.css`; at that deployment window no `data.json` existed in the three plugin directories. Runtime later created its owner-local projection through normal use.
- Automatic source-code preflight verifier Gauss `01a01ea0-7853-7101-aaf2-42ac90261e42`: `PASS_WITH_CHANGES`; dual automatic/manual fields, serialized revalidation, historical reservation, capacity failure and no-recursive-refresh requirements were incorporated.
- Automatic source-code backup: `state/backups/ontology-meta-hub-auto-source-codes-20260820-180953`; focused regression remains `workspaces/26- supermemoconcept的改进/插件/tests/ontology-meta-hub-local-projection.test.js`.
- Automatic source-code final preflight verifier `/root/ontology_auto_source_verifier`: `PASS_WITH_ACTIONS`, no P0 and no functional-code P1. Trial deployment/rollback backup: `state/backups/ontology-meta-hub-auto-source-trial-deploy-20260821-113611`.

## Remaining Validation

- The automatic three-letter extension is synchronized to the proven Runtime and Repository Mirror. Three-side syntax, hashes and feature sentinels pass. Runtime owner-local data has upgraded to schema v2 and preserved all eight pre-trial manual source codes plus both owner aliases while allocating 52 automatic codes across three namespaces.
- User acceptance remains pending for the loaded UI: confirm manual overrides such as `HEC`/`XIT`, automatic codes on previously unnumbered sources, `恢复自动分配`, search/order, standalone and Mandala-embedded rendering, source-capsule switching and provider reload/unload degradation.
- Downgrade is deliberately a three-file restore: preserve trial-ending v2 data, then restore pre-trial Runtime `main.js`, `styles.css` and `data.json` from `state/backups/ontology-meta-hub-auto-source-trial-deploy-20260821-113611`.

## Ontology Keyword Index

status: repository_dev_verified_runtime_pending
updated: 2026-08-10

Hub adds a sixth, independent `关键词` rail/tab. It consumes the sidecar owner API from `keyword-index-plugin`, groups active labels by first-letter key, preserves unavailable targets, and projects only the locator badge plus semantic keyword name. It does not persist a second index and does not read owner JSON.

Clicking a keyword is an in-Hub discovery jump, not an Ontology-editor open. Hub resolves the full `ontology-owner-ref:v1` identity through bounded owner pages, derives the source capsule from the exact matched descriptor, commits the family/source page only after complete revalidation, scrolls the existing surface owner and temporarily highlights the matching row. Direct row actions continue to own explicit `openOntology` and `revealSource` behavior.

Ontology owner rows expose a compact tag action and existing keyword capsules. The manager modal supports multiple keywords per object; deletion is confirmation-gated and delegates to the sidecar tombstone writer. Global creation uses a bounded, paginated provider scan to select an Ontology target, while stored targets never contain provider generation or lease tokens.

Cross-plugin contract additions are additive: `ontology-keyword-index:ready`, `ontology-keyword-index:unavailable`, `ontology-keyword-index:changed`, `ontology-owner-ref:v1`, and `okw-` ids. A missing/unavailable keyword owner degrades the tab without hiding or mutating Ontology owners.

Repository-dev syntax, Hub/Mandala/Workspace integration regression and the dedicated sidecar lifecycle test pass. Runtime/Mirror still contain the prior direct-open projection pending explicit synchronization.

### Locator Categories And Navigation

status: confirmed_by_user_and_code_and_memory
updated: 2026-08-10

Hub treats the leading `A-Z` locator as owner-provided category metadata and displays the stripped semantic body. Keyword capsules retain only the compact category badge and semantic keyword name; target/source description rows are intentionally omitted.

Keyword navigation never matches a title. It compares provider, scope, family, stable-ref version and structured stable ref, then performs a bounded two-stage scan: first locate the owner in the family, then revalidate it under the owner-provided source group when complete facets are available. Repeated cursors, empty pages with continuation, page/entry limits, incomplete source facets, provider reload and cancellation fail without changing the current Keyword tab. A successful jump atomically switches the Hub page and gives the owner row transient visual emphasis in standalone or Mandala-embedded surfaces.

Existing categories are projected into wrapping horizontal capsules and a sticky right-side letter rail. Empty categories are omitted. Standalone Hub navigation scrolls the existing `.omh-page`; Mandala-embedded Hub navigation scrolls `.mtb-widget-body`. The embedded rail does not create a second vertical scroll container.

The projection is runtime-only over Keyword Index API fields. Hub does not migrate the sidecar, own Ontology data, or write Mandala/Workspace business JSON. A keyword assignment therefore cannot delete or create the target Ontology document.

Bayesian update: `corrects` the former direct-owner-open projection and `refines` keyword discovery into an exact in-Hub owner locator while preserving owner identity and storage boundaries.

Deployment status: repository Dev is verified; actual Runtime and Mirror remain on the prior Hub build pending explicit synchronization. Standalone and Mandala-embedded interaction smoke remains pending deployment and plugin reload.

### In-Place Keyword Rename UI

status: repository_dev_verified_runtime_pending
updated: 2026-08-09

The owner keyword manager exposes independent `改名`, `改绑` and `删除` actions. Rename opens a small modal prefilled with the raw locator label, preserves the target and keyword id, and delegates only to Keyword Index `updateKeyword`.

The modal submits the opened record's `label/updatedAt` snapshot. Provider reload or same-generation record drift refuses the write. Format, semantic duplicate, stale or CAS failures keep the modal open, preserve the user's input and restore the save control; only a successful owner write refreshes the manager and closes the modal. An unchanged label is disabled and produces no write.

Bayesian update: `refines` Hub's keyword-management UI contract without adding a writer or altering Ontology ownership.

## Populated Source Projection And Exact-Jump Feedback

status: runtime_synced_static_verified_ui_smoke_pending
updated: 2026-08-08

- Under the `已有内容` state filter, Hub omits specific source capsules whose filtered count is non-positive or malformed. The synthetic `全部` capsule remains visible even at `0`; other state filters retain zero-count source identities.
- Capsule rendering and selected-source validity use the same visibility rule. If the selected source becomes hidden, Hub removes the stale selection and performs the existing unfiltered family reread, so no invisible source filter remains active.
- `openCell` routing, canonical addresses and provider ownership are unchanged. Workspace supplies the destination-cell visual feedback after the exact address has already resolved.

Bayesian update: `refines` source-filter coherence and exact-navigation observability. Repository-dev and Runtime regression evidence pass; three-role hashes align and deployment verifier `019fdd72-985e-7b70-aa35-15d0f6cf90c7` returned `PASS`. UI smoke remains pending plugin reload or restart.

## Shared Backlink Proof

status: runtime_synced_static_verified_ui_smoke_pending
updated: 2026-08-07

- `listIncomingDestinations()` consumes one Hub-level single-flight proof shared by every visible editor cell.
- Complete proofs stay memory-only and are invalidated by formal reference commit/unlink or provider lifecycle change. Incomplete proofs use a short cooldown so a timeout does not create a permanent false zero or a retry storm.
- Workspace receives bounded provider-specific reasons and renders incomplete-zero separately from complete zero.
- Meta capture state is subscription-based. Existing cell buttons change visibility/state in place; entering or leaving Meta mode does not require a full recursive editor rerender.
- Incoming references use provider-supplied lightweight descriptors for readable labels. Their normal form is `source / Ontology object / column / nested column...`; table rows remain part of the canonical cell address, not the human breadcrumb.
- New editor sessions invalidate label proofs. A read that overlaps a proof-generation rollover discards the stale result and shares a current-generation rescan, while strict mutation proof semantics are unchanged.
- The `mouse-pointer-2` cell affordance exists only during Meta A/B capture and collapses outside Meta mode without hiding provenance, backlinks or diagnostics.

Trace: `memory/obsidian-plugin-system/change-records/2026/2026-08/20260807-ontology-reference-proof-save-hotfix.md`; `memory/obsidian-plugin-system/change-records/2026/2026-08/20260807-024008-ontology-readable-backlinks-meta-pointer.md`.

## Structured Schema Authority Address

status: runtime_synced_static_verified_user_smoke_passed
updated: 2026-08-07

- In `schemaaddr:v2`, `authorityStableRef` is an opaque structured identity. Hub normalization deep-clones and preserves non-array objects; it must never pass the field through display-text cleanup or JavaScript implicit string conversion.
- The shared-editor adapter accepts an owner-supplied `schemaAuthorityStableRefVersion/schemaAuthorityStableRef`. This lets a formal owner distinguish document identity from a source-level Schema authority while Hub remains only the coordinator.
- Legacy `"[object Object]"` is irreversibly lossy and remains invalid. Hub does not guess an object from that string, canonicalize it into a valid address, or authorize a formal graph mutation from it.
- Address validation is fail-closed before graph reconciliation or formal commit. A malformed authority may enter only Workspace's explicit, proof-gated local-fork recovery path; it never becomes a Hub-side repair or owner-JSON rewrite.

Bayesian update: `refines` the existing `schemaaddr:v2` contract by making opaque-reference type preservation explicit. This historical Structured Authority deployment used Hub hash `740AE604...33855A`; deployment verifier `019fdc88-fafe-7e90-ab1f-0b30f9e68fab` returned `PASS`, and the user later confirmed the intended interaction worked. The current Hub artifact has since advanced to `7FB931F2...5745E10` for the 2026-08-08 navigation/source-capsule deployment; that newer UI smoke remains pending until Hub is reloaded.

## Atomic Current And History Projection

status: repository_dev_verified_runtime_pending
updated: 2026-08-22

- Hub state filters are two explicit modes rather than an implicit mixture. `全部状态`, `已有内容` and `空表` use `includeHistorical:false`; `历史` uses `states=[historical]` together with `includeHistorical:true`. A legacy restored state with an empty state list and hidden history flag migrates to current-only.
- Keyword navigation remains identity-based and bounded, but now uses two phases: a broad history-aware read locates the exact stable owner; a second scan commits either current-only mode for a current owner or explicit History mode for a historical owner. Source capsules, summary counts, entries, pagination binding and ephemeral state all follow the committed mode.
- A failed target scan, incomplete source index, provider drift, cancellation or missing rendered row restores the complete prior surface, including both state list and history flag. Family/source navigation cannot carry an invisible historical mix into ordinary current views.
- Hub still owns no provider lifecycle. Mandala classifies project owners and enforces historical read-only behavior; Hub only requests and renders the matching projection.
- Repository Dev and both staging baselines pass current/historical keyword, filter, rollback and provider regression tests. Actual Runtime and Repository Mirror remain unchanged pending verification and explicit deployment confirmation.

Trace: `memory/obsidian-plugin-system/change-records/2026/2026-08/20260822-105345-ontology-project-tracking-parity.md`.

2026-09-29 staged refinement: user requests editing a Hub alias from existing name. Candidate prefills persisted alias or originalTitle as a draft, excluding auto source code; untouched close does not adopt original into Hub storage. Explicit Save or edited close uses unchanged owner-alias write path. Shared source-code editor has no suggested title. This is Hub-local symbolic UI, not provider rename or ownership change. Source confirmed_by_user + staged code/test; runtime not yet deployed. Trace: change-records/2026/2026-09/20260929-ontology-alias-prefill.md.

2026-09-29 publication: user explicitly approved alias-prefill deployment. Runtime/Dev/Mirror main.js now match reviewed SHA2561E857D815162A17E1516C370F704B23D78374A3EF0609B16548781660C94C7BF;13 other direct files unchanged. Native loaded-host verification awaits reload. Evidence state/staging/ontology-alias-prefill-20260929/deployment.json; trace change-records/2026/2026-09/20260929-ontology-alias-prefill-deployment.md. Supersedes staged-only status above; no ownership change.


## 2026-09-30 State comment images

status: repository_verified_runtime_pending

User observation: paste images into state-transition comments like Mandala daily notes. Hub owns these stateGraph notes; provider-owned ontology bodies and stateGraph.attachments (table mounts) remain separate. Nodes, edges and groups retain their identities.

Notes store encoded vault-relative Markdown image references, not binary JSON or a new schema. A reference commits through existing CAS before binary creation; failed uploads visibly remain pending, block implicit close, and allow retry or explicit cancellation of the reference. Retry checks existing bytes without overwriting; attachment files are never deleted by clearing a comment. Restart cannot recover clipboard File objects: missing files are labeled and require repaste. Forced application termination cannot be prevented.

Only local PNG/JPEG/GIF/WebP thumbnails render; click enlarges. Shared state graph editor/use-mode/detail panels consume the same notes; Workspace and Mandala source data need no matching write changes. Legacy readers display the reference text. Source: confirmed_by_code in staged modal tests; native Obsidian paste/host acceptance unknown. Bayesian update: extends local comment UI contract, preserves content ownership.

Trace: [engineering record](../../../../REFERENCE_BOUNDARIES.md#ref-236)（外部来源未随包提供）.


2026-09-30 publication: user approved deployment. Runtime/Dev/Mirror now match reviewed comment-image main SHA256 cbd160e76e8562dbb574bd82ac58d678cb8b42777c5f4103ffcf627c7dead54a and styles 17ef99c3a0704d6872c41120b48451aed838d41218943a94f6898628abc7f1c3. Protected plugin files unchanged during copy; original-host clipboard/UI acceptance awaits plugin reload. This supersedes repository-only status above. Evidence: state/staging/ontology-comment-images-20260930/deployment.json.


## 2026-09-30 State comment album and hidden links

status: repository_verified_runtime_pending

User observation: deployed image comments exposed attachment Markdown and opened individual previews instead of a daily-note-style album. This corrects the earlier incomplete UI interpretation. Hub notes ownership, provider bodies and table mounts remain unchanged.

The editor hides valid local image references in the text projection. Serialized notes and recovery drafts still retain them. Opening/closing untouched notes is byte-preserving; editing or clearing text retains images. Image references are removed explicitly from the album or by explicitly clearing text and images. No schema migration or file deletion.

Compact image-count launcher opens a large gallery. Editable comment album adds file picker, clipboard and drop inputs plus confirmed single-reference removal; read-only graph albums have no mutation controls. Parent editor owns drafts/uploads; closing a child album returns to parent, while parent close/discard also closes child/viewer. Names, identities, layout and provider data are unchanged. Source: confirmed_by_code via24 regressions/syntax; native Obsidian album interaction still unknown. Bayesian update: corrects user-interface contract while preserving content ownership.

Trace: [engineering record](../../../../REFERENCE_BOUNDARIES.md#ref-237)（外部来源未随包提供）.


2026-09-30 album correction published under existing image-feature deployment authorization. Runtime/Dev/Mirror main SHA256 e73cd06ae7b6ccc7bc116b57e92453a230c6fba6aec6074909f481472a316482 and styles dc5d3ee88ed4427fb71421b17ddc923e1f7239b98bf28aecb1eaed6b0ce02fae match reviewed candidate. Protected plugin files unchanged. Supersedes repository-only album status; native gallery acceptance pending reload. Evidence state/staging/ontology-comment-album-20260930/deployment.json.
