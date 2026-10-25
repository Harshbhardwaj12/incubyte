# Engineering Report

## Current state

The existing monorepo contains the React frontend, Express API, PostgreSQL schema, migrations, seed data, authentication, vehicle search/CRUD, atomic purchasing, restocking, a permanent stock-movement ledger, database-backed dashboard/reporting, and automated tests.

## Changes made in this continuation

- Production migration discovery now reads repository SQL migrations outside the compiled TypeScript output.
- Test configuration selects the separate test database when `NODE_ENV=test`.
- Vehicle route IDs are validated as UUIDs before database queries.
- Purchase creation returns `201`.
- Registration maps concurrent unique-email conflicts to `409 EMAIL_EXISTS`.
- Frontend vehicle responses and image URL payloads are mapped to the backend database contract.
- Existing stale fixtures were aligned with admin-only vehicle mutation and the purchase response shape.
- Added an additive stock-movement migration with opening-balance backfill, purchase/restock/adjustment ledger entries, and history-preserving vehicle deletion.
- Added dashboard KPIs, category valuation, recent purchases, best sellers, sales trend, status filters, pagination, and CSV exports.
- Added a focused dashboard workflow test covering live metrics, inventory rendering, admin controls, ledger rendering, and disabled sold-out purchase controls.

## Verification status

Verified on 2026-10-25:

- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm run test` passed: backend 29/29 and frontend 3/3.
- `npm run build` passed.
- PostgreSQL migration applied successfully; the repeatable seed detected existing data and skipped reinsertion on both runs. The seed source defines 12 vehicles across five categories, including two sold-out entries; the preserved configured development database currently reports 12 models, five categories, and three sold-out vehicles.
- Live API health returned `200`; frontend HTTP returned `200`; unauthenticated dashboard returned `401`; and a real admin login returned a safe user object and live dashboard metrics.

## Submission evidence still required

- `PROMPTS.md` contains genuine accessible Codex excerpts and the linked public ChatGPT project conversation. Complete exports for unavailable conversations remain outstanding and must be supplied by the owner if required.
- README now links to captured local screenshots in `screenshots/` for the landing page, dashboard, and admin controls.
- The current branch has no meaningful project commit history and all project files are uncommitted/untracked, so Red-Green-Refactor history cannot be established from this checkout.
- Public repository status was not verified.
- Docker was not available in the environment; PostgreSQL was verified locally instead.
