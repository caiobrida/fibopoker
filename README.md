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
