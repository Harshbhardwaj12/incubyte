# Technical Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Monorepo | npm workspaces (`backend`, `frontend`) | Simple, no Turborepo overhead |
| DB access | `pg` + parameterized SQL | Spec requires raw SQL, no ORM |
| Auth | JWT in `Authorization: Bearer` + bcrypt | Spec + standard SPA pattern |
| Roles | `user` \| `admin` column; public register always `user` | Prevent privilege escalation |
| Purchase | `UPDATE … WHERE quantity >= $n RETURNING` inside transaction | Atomic, no oversell |
| Purchase FK | `ON DELETE SET NULL` or soft vehicle snapshot | Preserve purchase history |
| Test DB | Separate Docker Compose DB + `DATABASE_URL` override | Isolation from dev data |
| Frontend API | Single `api.ts` fetch client | One place for auth headers/errors |
| UI | Charcoal / off-white / bronze-red accents | Spec design direction |
| Migration files | Read repository `db/migrations` at runtime | SQL files are not emitted by the TypeScript compiler |
| Vehicle API shape | Backend uses database snake_case; frontend maps at its API boundary | Keeps SQL rows explicit while keeping UI state predictable |
