# API Contracts

All vehicle endpoints require `Authorization: Bearer <JWT>`.

- `POST /api/auth/register` — `{ email, password }` → `{ user, token }` (`201`)
- `POST /api/auth/login` — `{ email, password }` → `{ user, token }` (`200`)
- `GET /api/auth/me` — returns the authenticated safe user.
- `GET /api/vehicles` — lists all vehicles, including zero stock.
- `GET /api/vehicles/search?make=&model=&category=&minPrice=&maxPrice=&year=&status=&sortBy=&sortDirection=&page=&pageSize=` — filtered, sorted, paginated list with inclusive price bounds. `status` is `in_stock`, `low_stock`, or `sold_out`.
- `GET /api/vehicles/:id` — detailed vehicle record.
- `POST /api/vehicles` — admin-only vehicle creation.
- `PUT /api/vehicles/:id` — admin-only update; `:id` must be a UUID.
- `DELETE /api/vehicles/:id` — admin-only deletion (`204`).
- `POST /api/vehicles/:id/purchase` — `{ quantity }`; atomic purchase (`201`).
- `POST /api/vehicles/:id/restock` — admin-only `{ quantity }` (`200`).
- `POST /api/vehicles/:id/adjust` — admin-only `{ quantityChange, reason }` (`200`); rejects negative resulting stock.
- `GET /api/dashboard` — database-backed KPIs, category valuation, recent purchases, best sellers, sales trend, and recent stock movements.
- `GET /api/stock-movements` — authenticated stock movement ledger.
- `GET /api/reports/inventory.csv` — authenticated inventory valuation export.
- `GET /api/reports/sales.csv` — admin-only sales export.

Errors use `{ "error": { "message": "...", "code": "..." } }`.
