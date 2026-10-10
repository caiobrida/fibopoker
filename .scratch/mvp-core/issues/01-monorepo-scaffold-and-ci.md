# 01 — Monorepo scaffold and CI

**What to build:** No user-facing behaviour. This is the prefactor: the workspace layout, the shared tooling and continuous integration, in place from the first commit so that every ticket after it is guarded rather than retrofitted.

Three workspaces — the web app, the API, and the package holding the contract between them — under one package manager, with one lint and formatting configuration at the root rather than per workspace.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [x] Installing from a clean clone succeeds with no manual steps
- [x] Lint and build pass from the repository root across all three workspaces
- [x] The shared package builds standalone and is importable from both apps
- [x] The shared package has no framework-specific or browser-specific dependency
- [x] Version control ignores dependencies, build output, environment files, local platform directories and coverage output
- [x] Two CI workflows run lint and build, each with a path filter so a change to one app does not run the other's checks
- [ ] Both workflows are green on a pull request

## Comments

Landed as a pnpm workspace with `apps/web` (Vite, React, TypeScript), `apps/api` (NestJS) and `packages/shared`. The shared package has no dependencies at all, so it cannot reach a framework or a browser API; it exports the Deck, which is what both apps import to prove the contract resolves at runtime as well as at compile time.

Linting is oxlint rather than ESLint: both the Vite and the Nest generators now ship oxlint, so a single root `.oxlintrc.json` serves all three workspaces without either app fighting its own template. `pnpm build` is also the typecheck in every workspace, so no separate `typecheck` script earns its place yet.

`pnpm` is pinned to the version installed on the maintainer's machine, so the lockfile the workflows install from is the one generated locally.

The last criterion — both workflows green on a pull request — is the only one that cannot be checked from a clone, since it needs the workflows to actually run on GitHub. Everything else was verified locally, including a fresh clone installing and building with no manual step.
