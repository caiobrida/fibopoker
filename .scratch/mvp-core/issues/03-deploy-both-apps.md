# 03 — Deploy both apps

**What to build:** Both apps reachable on real URLs, with Room creation working end to end against them.

This lands third, not last, on purpose. Everything after it is then verified on the platform it will actually run on — framework cold start, preview-origin CORS, connection pooling, a database waking from idle. Discovering those at the end, with the whole feature built, is where they are most expensive to fix.

**Blocked by:** 02 — Create a Room and share its link

**Status:** needs-info

- [ ] The web app and the API deploy as two separate projects from this monorepo
- [x] The CORS allowlist matches preview origins by pattern, not by fixed string, so a preview deployment is not born broken
- [x] The API uses the pooled database connection at runtime and the direct one for migrations
- [ ] The database client and the API instance are module-scoped singletons, so a warm invocation neither re-bootstraps the framework nor opens a new connection
- [ ] Creating a Room and reopening its link both work against the deployed URLs
- [ ] A first request after a long idle period succeeds with no manual step to wake anything

## Comments

Every deployable decision now lives in the repository rather than in a dashboard. Each app owns a `vercel.json` carrying its install command, its build command and, for the web app, its routing; what stays in the dashboard is the root directory and the environment, because neither can be expressed in a file. Both projects install with `pnpm install --filter '<package>...'`, so a deployment pulls its own workspace and `packages/shared` and nothing else.

**The platform compiles TypeScript with esbuild, and esbuild does not implement `emitDecoratorMetadata`.** Nest resolves a controller's constructor from exactly that metadata, so an entrypoint the platform compiled yields a controller whose dependencies cannot be resolved — the failure arrives at runtime, as a dependency injection error, not as a build error. That is why `apps/api/server.js` exists and contains nothing but `import './dist/main.js'`: the platform is pointed at output `tsc` has already produced, so `tsc` stays the only compiler whose work we run. The one-line file is the whole mitigation and it is recorded in ADR 0005, which is the right place for it — `AGENTS.md` bans the comment that would otherwise explain it in the file.

The API ships as **one captured Node server** rather than a per-request handler. Vercel detects a `server` entrypoint that calls `listen()` during module startup and routes every request into the server it started, which is what makes the criterion about warm invocations fall out of the design instead of needing a hand-rolled promise cache: `main.ts` bootstraps at module scope, once per cold start, and `src/infra/prisma.ts` was already a module-scoped `PrismaClient`. Nothing in the request path constructs either.

**CORS is a list of patterns, not a string.** `WEB_ORIGINS` holds comma-separated origins in which `*` stands for exactly one hostname label — never spanning a `.`, a `:` or a `/` — and every entry is anchored at both ends, so `https://fibopoker-*-<team-slug>.vercel.app` covers every preview of a project while the team slug keeps another account's previews out. Anchoring is the other half of that: without it `https://fibopoker.vercel.app.evil.com` would pass. The patterns are `RegExp`s handed straight to `enableCors`, so the matching itself is the `cors` package's, not ours. `credentials` is deliberately left off — header-borne identity never needs a credentialed request, and enabling it is the first step back toward the cookie ADR 0005 exists to avoid.

`WEB_ORIGIN` became `WEB_ORIGINS` because it now holds a list. Ticket 02's comments still name the singular form; that is a record of what ticket 02 did and was left alone rather than rewritten.

**Migrations run only on a production deployment, and only after the workspace compiles.** Both halves were wrong in the first pass and corrected under review. Migrating before compiling can leave the schema ahead of code that then fails to build; and a preview that migrated would move the schema of the one database production is already serving, which on a single free-tier Neon database means a merge that drops a column would break the running API from a branch nobody had reviewed yet. `DIRECT_URL` is what the migration uses, through `prisma7.config.ts`; `DATABASE_URL` is what the client uses. Nothing asserts that the first is really Neon's pooled endpoint, because sniffing for `-pooler` in a hostname would make the code care which vendor hosts the database, and ADR 0001 spent its argument on not caring.

`prisma generate` is not in the build command. It looked necessary, and the api's `postinstall` turned out to already cover it — confirmed by deleting the generated client and running the exact filtered install the deployment runs.

Three things are deliberately absent:

- **No build-time guard on `VITE_API_URL`.** One was written and then removed. It keyed off a Vercel-specific variable, so it would have gone quietly inert on any other host while ADR 0005 promises that re-hosting the web app costs one environment variable; it read `process.env` where the app reads `import.meta.env`, so a value supplied through a `.env` file would have failed a build that was actually configured; and an empty string passed it. Left unset, the bundle calls `localhost` and fails visibly in the browser on first use, which is ordinary misconfiguration rather than a silent wrong answer.
- **No test for the origin patterns**, by explicit decision of the maintainer, keeping ADR 0006's one-seam rule literal. It is the only logic in the ticket and it is security-relevant, so it was exercised by hand instead, against a running server rather than only as a function.
- **Nothing implements the idle-wake criterion**, because ADR 0001 already chose the host that satisfies it: Neon resumes on the next query with no human in the loop. No retry and no connection-pool tuning was added — `pg` closes an idle connection after ten seconds by default, far inside Neon's five-minute suspend window, so the stale-socket case a retry would catch cannot arise from the pool sitting idle.

### How this was verified

`pnpm build`, `pnpm lint`, `pnpm format:check` and the API's suite all pass from the root; the suite is unchanged at five tests.

The allowlist was driven against a real Nest server started from the compiled output with a three-entry `WEB_ORIGINS`. Preflight requests carrying the production origin, a preview deployment origin, a preview branch origin and `http://localhost:5173` each came back `204` with `Access-Control-Allow-Origin` echoing the origin and `Vary: Origin` set; `https://evil-fibopoker.vercel.app`, `https://fibopoker.vercel.app.evil.com` and a preview origin under a different team slug each came back with no `Access-Control-Allow-Origin` header at all, which is the refusal. `Access-Control-Allow-Credentials` was absent throughout, and `Access-Control-Allow-Headers` reflected `authorization`, which is what ticket 04 will need. The same patterns were also exercised as a function over fifteen cases including a `.` smuggled into a wildcard, a path smuggled past a wildcard port, an empty wildcard and an unset variable.

The production-only migration condition was run in a shell with `VERCEL_ENV` set each way, and skips on `preview`.

### What was not verified, and why the four boxes are open

**Nothing has been deployed.** The Vercel CLI is installed in the session but not authenticated, and no Neon connection strings exist here, so no project could be created. The two end-to-end criteria need real URLs by definition, and two more are open because they assert platform behaviour rather than code:

- **Two separate projects** is config that no deployment has consumed yet.
- **Warm invocations** rest on the platform detecting `apps/api/server.js` as a server entrypoint. That is the single riskiest assumption in the change: if detection does not fire, the api project builds as a static site and every request answers `404`. The documented contract says a root-level `server.js` that calls `listen()` at module startup is detected, and nothing in `vercel.json` needs to declare it — but documented is not observed, and the first deployment is the test. The fallback, should it not fire, is an `api/` function entrypoint plus a rewrite, which changes no application code.

What is needed to close all four: a `vercel login`, and `DATABASE_URL` and `DIRECT_URL` for a Neon database. `WEB_ORIGINS` and `VITE_API_URL` follow from whatever URLs the two projects are given.
