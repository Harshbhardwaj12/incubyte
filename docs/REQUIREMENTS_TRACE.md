# Requirements Traceability

| Requirement | Implementation | Test evidence |
|---|---|---|
| Registration/login and safe users | `backend/src/services/authService.ts`, `backend/src/routes/authRoutes.ts` | `backend/tests/auth.test.ts` |
| JWT and admin authorization | `backend/src/middleware/auth.ts`, `backend/src/routes/vehicleRoutes.ts` | `backend/tests/auth.test.ts` |
| Vehicle CRUD and search | `backend/src/repositories/vehicleRepository.ts`, vehicle controller/routes | `backend/tests/vehicles.test.ts` |
| Atomic purchase and no oversell | `backend/src/services/vehicleService.ts`, row lock and conditional stock update | `backend/tests/inventory.test.ts` |
| Purchase history after deletion | purchases foreign key with `ON DELETE SET NULL`, snapshot columns | `backend/tests/inventory.test.ts` |
| Admin restock | vehicle route and service | `backend/tests/inventory.test.ts` |
| Stock movement ledger | `db/migrations/002_stock_movements.sql`, stock movement repository, transactional vehicle service | `backend/tests/inventory.test.ts` |
| Dashboard/reporting | dashboard repository/controller and report CSV controller | dashboard/export cases in `backend/tests/inventory.test.ts` |
| Frontend authentication and inventory | `frontend/src/auth/AuthContext.tsx`, `frontend/src/pages/DashboardPage.tsx` | `frontend/src/api/client.test.ts`, `frontend/src/pages/DashboardPage.test.tsx` |

Verified on 2026-10-25: backend 29/29 tests, frontend 3/3 tests, lint, typecheck, and production build passed.
