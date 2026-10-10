# 01 — Monorepo scaffold and CI

**What to build:** No user-facing behaviour. This is the prefactor: the workspace layout, the shared tooling and continuous integration, in place from the first commit so that every ticket after it is guarded rather than retrofitted.

Three workspaces — the web app, the API, and the package holding the contract between them — under one package manager, with one lint and formatting configuration at the root rather than per workspace.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Installing from a clean clone succeeds with no manual steps
- [ ] Lint and build pass from the repository root across all three workspaces
- [ ] The shared package builds standalone and is importable from both apps
- [ ] The shared package has no framework-specific or browser-specific dependency
- [ ] Version control ignores dependencies, build output, environment files, local platform directories and coverage output
- [ ] Two CI workflows run lint and build, each with a path filter so a change to one app does not run the other's checks
- [ ] Both workflows are green on a pull request
