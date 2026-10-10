# fibopoker

A team estimates tasks in Fibonacci points together. Anyone opens a Room, shares its link, and votes — no accounts, no sign-up, no limit on how many Rounds a Room can hold.

The domain language is in [`CONTEXT.md`](./CONTEXT.md). The decisions behind the build are in [`docs/adr/`](./docs/adr/).

## Workspaces

| Workspace         | What it holds                                            |
| ----------------- | -------------------------------------------------------- |
| `apps/web`        | the browser app — Vite, React, TypeScript                |
| `apps/api`        | the HTTP API — NestJS                                    |
| `packages/shared` | the contract between the two, free of any runtime's APIs |

One pnpm workspace, one TypeScript base config, one lint and one formatting config, all at the root.

## Commands

From the repository root:

- `pnpm install` — every workspace, from a clean clone, with no further steps
- `pnpm build` — all three workspaces in dependency order; this is also the typecheck
- `pnpm lint` — oxlint over the whole repository
- `pnpm format` — prettier, in place; `pnpm format:check` to only report

To run an app: `pnpm --filter @fibopoker/web dev`, or `pnpm --filter @fibopoker/api start:dev`.

The API's test suite: `pnpm --filter @fibopoker/api test`. It drives the use cases against
in-memory implementations, so it needs neither a database nor a running server.

## Environment

The API reads two Postgres connection strings and the origin it accepts browser requests from:

| Variable       | Used by          | Value                            |
| -------------- | ---------------- | -------------------------------- |
| `DATABASE_URL` | the running API  | the pooled connection            |
| `DIRECT_URL`   | `prisma migrate` | the direct connection            |
| `WEB_ORIGIN`   | the running API  | where the web app is served from |

The web app reads `VITE_API_URL`, the base URL of the API. Both apps fall back to their local
defaults, so `pnpm install` and two `dev` commands are enough once `DATABASE_URL` points
somewhere.

## Database

The Prisma schema and its migrations live in `apps/api/prisma`. The client is generated into
`apps/api/src/generated`, which is not in version control — `pnpm install` regenerates it.

From `apps/api`:

- `npx prisma migrate dev --name <what-changed>` — write a migration and apply it locally
- `npx prisma migrate deploy` — apply pending migrations to the configured database
- `npx prisma dev` — run a local Postgres to develop against
