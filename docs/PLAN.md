# Plan — Car Dealership Inventory System

## Milestones

- [x] M1 Scaffold monorepo (npm workspaces, TS, scripts)
- [x] M2 Postgres migrations + seed (≥12 vehicles, 5 categories, 2 zero-stock)
- [x] M3 Auth (register/login/JWT/bcrypt/roles) — tests first
- [x] M4 Vehicle CRUD + search — tests first
- [x] M5 Purchase (txn + conditional UPDATE) + restock — tests first
- [x] M6 React frontend wired to real API
- [x] M7 Lint, typecheck, tests, builds
- [x] M8 Docs (README, PROMPTS, REPORT, REQUIREMENTS_TRACE, API, INTERVIEW_GUIDE)

## Progress notes

- Audited backend, frontend, migrations, seed data, tests, environment files, and Docker Compose.
- Fixed production migration discovery to use the repository SQL directory, so compiled backend startup can run migrations.
- Made test configuration prefer the separate test database when `NODE_ENV=test`.
- Added UUID validation for vehicle route parameters and aligned purchase creation responses with the existing tests.
- Normalized backend vehicle responses and translated frontend `imageUrl` payloads to the backend `image_url` contract.
- Added a frontend API contract test for response normalization and vehicle payload translation.
- Added the required documentation stubs with explicit owner-confirmation markers where source material is unavailable.
- Added additive stock movement migration with opening-balance backfill, transactional purchase/restock/adjustment ledger writes, and history-preserving vehicle deletion.
- Added live dashboard KPIs, category valuation, recent purchases, best sellers, sales trend, low-stock/status filters, pagination, and CSV exports.
- Verified backend 29/29 tests, frontend 3/3 tests, lint, typecheck, build, migration, seed idempotency, and live health/auth responses.

## Blockers

- Docker CLI is not installed; local PostgreSQL 16 services were available, so Docker was not needed for verification.
- Docker was unavailable in this environment; local PostgreSQL was used for database verification.
- Submission evidence still needs genuine raw AI logs/public links, meaningful project commit history/TDD evidence, and public-repository verification; local screenshots are now stored under `screenshots/` and linked from the README.

## Next

Functional verification is complete for the available local environment. Before submission, add the genuine assignment evidence listed above without fabricating logs, links, screenshots, or TDD history.
