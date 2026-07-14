# Countera

Open-source business operations platform — do more with less clicks. Invoicing, quoting, customers, products and inventory, payments, and multi-user role-based access, with domain plugins that extend the core for specific industries (e.g. the vehicle pack: work orders, inspections, vehicles, appointments).

Roadmap: AI document parsing (feed in supplier invoices, inventory updates itself) and a first-class plugin API.

## Structure

pnpm workspaces + Turborepo monorepo:

| Package | Path | What it is |
|---|---|---|
| `@countera/api` | `apps/api` | Express 4 + Sequelize (MySQL) REST API |
| `@countera/web` | `apps/web` | React 18 + Vite SPA (Material Tailwind) |
| `@countera/shared` | `packages/shared` | Shared TypeScript package (domain enums), built with tsup to dual CJS/ESM |

## Getting started

```bash
pnpm install
pnpm build          # builds @countera/shared (and the web bundle)
pnpm dev            # runs shared (watch) + api (nodemon) + web (vite) via turbo
```

Each app reads its own `.env` (`apps/api/.env`, `apps/web/.env`) — see the app code for the variables used. The API needs `@countera/shared` built at least once before `node`/`sequelize-cli` commands work (`pnpm dev`/`pnpm build` handle this).

## Database

```bash
pnpm db:migrate                                   # run migrations
pnpm --filter @countera/api db:seed              # seed
pnpm --filter @countera/api db:generate -- <name>  # new empty migration
pnpm --filter @countera/api db:makemigrations    # auto-generate from model changes
```

Never rename existing migration files — production `SequelizeMeta` tracks them by filename (this is why `20250705184240-sales4x-main-migration.js` keeps its historical name).

## TypeScript

Incremental migration: all packages have `tsconfig.json` with `allowJs`; `packages/shared` is TS-only. New code should be TS. Suggested order for converting existing code: `apps/web/src/services` → `apps/api/utils` (adopt `tsx watch` when the first API `.ts` lands) → web components → API routes/models.

## Deployment

Not wired up for this monorepo yet — the legacy `sales4x-be`/`sales4x-fe` GitHub repos still drive the live VPS deployment. The old per-app workflows are kept (inert) under `apps/*/.github/workflows/deploy.yml` for reference until CI/CD is migrated.
