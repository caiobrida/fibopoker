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

The API reads two Postgres connection strings and the origins it accepts browser requests from:

| Variable       | Used by          | Value                                 |
| -------------- | ---------------- | ------------------------------------- |
| `DATABASE_URL` | the running API  | the pooled connection                 |
| `DIRECT_URL`   | `prisma migrate` | the direct connection                 |
| `WEB_ORIGINS`  | the running API  | comma-separated origins, wildcards ok |

The web app reads `VITE_API_URL`, the base URL of the API. Both apps fall back to their local
defaults, so `pnpm install` and two `dev` commands are enough once `DATABASE_URL` points
somewhere.

An entry in `WEB_ORIGINS` is a whole origin, matched whole, in which a `*` stands for exactly one
hostname label — it never spans a `.`, a `:` or a `/`, so `*` on its own matches nothing. One
entry therefore covers every preview deployment of a project without covering anybody else's:

```
WEB_ORIGINS=https://fibopoker.vercel.app,https://fibopoker-*-<team-slug>.vercel.app
```

The team slug is what makes that safe: a preview in someone else's Vercel account is named after
their slug, so it cannot match. `https://evil-fibopoker.vercel.app` and
`https://fibopoker.vercel.app.evil.com` do not match either.

## Database

The Prisma schema and its migrations live in `apps/api/prisma`. The client is generated into
`apps/api/src/generated`, which is not in version control — `pnpm install` regenerates it.

From `apps/api`:

- `npx prisma migrate dev --name <what-changed>` — write a migration and apply it locally
- `npx prisma migrate deploy` — apply pending migrations to the configured database
- `npx prisma dev` — run a local Postgres to develop against

## Deployment

Two Vercel projects from this one repository, as ADR 0005 decided. Each owns its `vercel.json`,
so what is left to the dashboard is the root directory, the framework preset and the
environment.

| Project | Root directory | Framework preset | Environment                                 |
| ------- | -------------- | ---------------- | ------------------------------------------- |
| web     | `apps/web`     | Vite             | `VITE_API_URL`                              |
| api     | `apps/api`     | NestJS           | `DATABASE_URL`, `DIRECT_URL`, `WEB_ORIGINS` |

The api preset is not cosmetic. Set to `Other`, Vercel stops looking for a server entrypoint,
builds the project as a static site and fails on a missing output directory.

`VITE_API_URL` is read when the web app is **built**, not when it runs, so changing it needs a
redeploy. Left unset, the bundle calls `localhost` and every request fails in the browser.

The API deploys as a single Vercel Function built from `apps/api/src/main.ts`, which the
platform picks and compiles itself. Two things about that entrypoint are load-bearing and are
explained in ADR 0005: `bootstrap()` is called without `await`, and `emitDecoratorMetadata`
stays on.

Deployment Protection is off on the api project. The API answers browsers that no one has
logged in, so protecting it behind Vercel Authentication would make every request from the web
app fail.

The API's build command applies pending migrations over `DIRECT_URL`, but only on a production
deployment, and only once the workspace has compiled. Both halves matter: a preview that
migrated would move the schema of the one database production is already serving, and migrating
before compiling could leave the schema ahead of code that then failed to build.

Both projects install with a `pnpm --filter` so a deployment pulls only the workspaces it needs.
