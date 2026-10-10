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

Linting is oxlint rather than ESLint, which the plan did not call for; the reasoning is recorded in `docs/adr/0007`. `pnpm build` is also the typecheck in every workspace, so no separate `typecheck` script earns its place yet.

There are three workflows rather than two. Formatting is a property of the whole repository, so gating it inside a path-filtered app workflow would both fail the `web` job for an `api` formatting slip and leave a docs-only change unchecked. It therefore runs unfiltered in `format.yml`, which leaves `web.yml` and `api.yml` purely app-scoped: lint and build, nothing else.

`pnpm` is pinned to the version installed on the maintainer's machine, so the lockfile the workflows install from is the one generated locally.

Two things are deliberately left for later tickets rather than stubbed now:

- **The API workflow runs no tests.** The spec has it running "lint, build and the test suite", but ADR 0006 puts the repository's first test in ticket 02, where the seam gets chosen deliberately. The workflow has to be reopened then; a test runner installed now with nothing to run would only fail.
- **`GET /` is a scaffold smoke endpoint**, not part of the API surface the spec enumerates. It exists because this ticket has to show the contract package importing and resolving from the API at runtime, and nothing else in the API does yet. Ticket 02 replaces it with the real controllers, and the Deck should stop being served when it does.

One trap worth knowing before ticket 03 writes its first injected constructor: `apps/api` deliberately does **not** set `verbatimModuleSyntax`, although `packages/shared` and `apps/web` do. With `emitDecoratorMetadata`, a type-only import of an injected class emits `Object` as its metadata and Nest's DI then fails at runtime with nothing useful to say. Making the three configs consistent would reintroduce that.

The last criterion — both workflows green on a pull request — is the only one that cannot be checked from a clone, since it needs the workflows to actually run on GitHub. Everything else was verified locally, including a fresh clone installing and building with no manual step.
