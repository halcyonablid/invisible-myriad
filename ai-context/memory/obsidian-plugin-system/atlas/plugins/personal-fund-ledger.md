# Personal Fund Ledger

status: runtime_synced_static_verified_ui_smoke_pending
updated: 2026-08-11
source_status: confirmed_by_user_and_code

## Role

Personal Fund Ledger owns the user's fund transaction ledger, fund registry, finance snapshots, audit events, and local form drafts. It is a standalone business-data owner rather than a projection of Project Overview, Mandala, Workspace Mount, or another system plugin.

## Data Safety Contract

- Transactions are append-only audit facts. A correction does not rewrite or delete the original transaction.
- A reversal appends a `reversal` transaction linked by `reversesTransactionId` and appends a matching audit event.
- A reversed purchase is not automatically transferred to another fund. The user separately records the intended purchase under the correct fund.
- Duplicate reversal of the same original transaction is rejected.
- Form drafts are isolated by operation type, original record identity, and the opened record hash.

## Correction Workflow

For a transaction entered under the wrong fund:

1. Open the original row and choose `冲销`.
2. Review the displayed date, fund, transaction type, amount, and fee.
3. Enter a non-empty reason and confirm the destructive action.
4. Add a new purchase transaction under the correct fund.

The reversal dialog uses the plugin's draft-protected Obsidian modal. Native browser `window.prompt()` is not part of the supported interaction contract.

## Current Evidence

- User case: the 2026-08-11 purchase was recorded against the wrong fund and should be corrected through reversal plus a new correct-fund purchase.
- Repository Dev replaces the unreliable native prompt with the existing `FormModal`, preserves the append-only store contract, and adds focused source/bundle regressions.
- `npm test` and `node --check main.js` pass in Repository Dev.
- After explicit confirmation, verified `main.js` and `styles.css` were synchronized to Actual Runtime and Mirror. Dev/Runtime/Mirror hashes align, while Runtime `ledger.json`, drafts, journal, previous ledger, manifest, schema, and versions remained unchanged across the copy window.
- Independent deployment verifier `019ff045-68d1-74a1-9971-c5745f7b8480` returned `PASS`; loaded Obsidian interaction smoke remains pending.

## Boundaries

- Owner: `personal-fund-ledger`.
- Provider/consumer: not applicable for this local correction flow.
- Contract types: business JSON ownership, append-only audit lifecycle, input-modal draft protection, UI correction workflow.
- This page records stable owner and correction semantics. Transaction-specific financial details remain only in the business ledger and are not copied into Atlas.
