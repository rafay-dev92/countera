# @countera/api

Countera REST API (Express + Drizzle ORM/PostgreSQL). Part of the Countera monorepo — see the root README.

## Database

- Schema lives in `db/schema.ts` (tables, enums, relations); the drizzle client is exported from `db/index.ts`.
- SQL migrations are generated into `drizzle/` with `pnpm db:generate` and applied with `pnpm db:migrate`.
- Connection is a single `DATABASE_URL` (`postgres://user:password@host:port/database`; append `?sslmode=no-verify` for managed PG with a self-signed CA). Used by the app, drizzle-kit, and the backup script alike.
- `pnpm db:seed` creates the super admin (`SUPER_ADMIN_PASSWORD` must be set) and base permissions.

The app is pure TypeScript ESM (`"type": "module"`), executed through `tsx` (`pnpm dev` / `pnpm start`). The daily-backup cron shells out to `node scripts/backup.ts`, which relies on Node's built-in type stripping (Node ≥ 22.18).
