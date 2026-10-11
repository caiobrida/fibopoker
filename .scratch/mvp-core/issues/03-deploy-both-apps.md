# 03 — Deploy both apps

**What to build:** Both apps reachable on real URLs, with Room creation working end to end against them.

This lands third, not last, on purpose. Everything after it is then verified on the platform it will actually run on — framework cold start, preview-origin CORS, connection pooling, a database waking from idle. Discovering those at the end, with the whole feature built, is where they are most expensive to fix.

**Blocked by:** 02 — Create a Room and share its link

**Status:** ready-for-agent

- [x] The web app and the API deploy as two separate projects from this monorepo
- [x] The CORS allowlist matches preview origins by pattern, not by fixed string, so a preview deployment is not born broken
- [x] The API uses the pooled database connection at runtime and the direct one for migrations
- [x] The database client and the API instance are module-scoped singletons, so a warm invocation neither re-bootstraps the framework nor opens a new connection
- [ ] Creating a Room and reopening its link both work against the deployed URLs
- [x] A first request after a long idle period succeeds with no manual step to wake anything

## Comments

Every deployable decision lives in the repository rather than in a dashboard. Each app owns a `vercel.json` carrying its install command, its build command and, for the web app, its routing. What is left to the dashboard is the root directory, the framework preset and the environment, because none of the three can be expressed in a file. Both projects install with `pnpm install --filter '<package>...'`, so a deployment pulls its own workspace and `packages/shared` and nothing else; the build log confirms it, resolving `2 of 4 workspace projects`.

**The framework preset is not cosmetic.** Set to `Other`, Vercel stops looking for a server entrypoint, treats the project as a static build and fails on a missing output directory. The api project is `NestJS`, the web project `Vite`.

**The platform chooses and compiles the API's entrypoint, and that cannot be worked around.** Vercel looks for `src/main`, `src/app`, `src/index`, `src/server`, `app`, `index` or `server` at the project root, in that order, and the file it picks must import Nest. An entrypoint that merely forwards to already-compiled output is refused with `No entrypoint found which imports nestjs`. So `src/main.ts` is the entrypoint and the platform compiles it, with the repository's own TypeScript and `tsconfig.json`.

**`bootstrap()` must not be awaited at module scope.** This was the whole deployment, and it cost most of the work in this ticket. Vercel's Node launcher imports the entrypoint and then completes a handshake of its own; a module that awaits `listen()` at top level never lets that import settle in time. Every request then hangs until the gateway times out — no response body, no status, and no runtime log at all, so nothing in the platform points at the cause. Changing `await bootstrap()` to `bootstrap()`, which is the shape Vercel documents, made the same deployment answer immediately. The module-scoped singleton the criterion asks for is unaffected: the call still happens once, when the module is first evaluated.

**CORS is a list of patterns, not a string.** `WEB_ORIGINS` holds comma-separated origins in which `*` stands for exactly one hostname label — never spanning a `.`, a `:` or a `/` — and every entry is anchored at both ends, so `https://fibopoker-web-*-<team-slug>.vercel.app` covers every preview of a project while the team slug keeps another account's previews out. Anchoring is the other half: without it `https://fibopoker-web.vercel.app.evil.com` would pass. The patterns are `RegExp`s handed straight to `enableCors`, so the matching itself is the `cors` package's, not ours. `credentials` is deliberately left off — header-borne identity never needs a credentialed request, and enabling it is the first step back toward the cookie ADR 0005 exists to avoid.

`WEB_ORIGIN` became `WEB_ORIGINS` because it now holds a list. Ticket 02's comments still name the singular form; that is a record of what ticket 02 did and was left alone rather than rewritten.

**Deployment Protection is off on the api project.** It defaults to Vercel Authentication over every deployment that is not on a custom domain, which includes the production `.vercel.app` URL. With it on, the API answered `302` to Vercel's SSO instead of answering the request, so no browser could reach it and the web app would fail on every call. An API serving a public front cannot sit behind a login that the product does not have. The web project keeps its protection: there it only decides who may look at a preview.

**Migrations run only on a production deployment, and only after the workspace compiles.** Migrating before compiling can leave the schema ahead of code that then fails to build; and a preview that migrated would move the schema of the one database production is already serving, which on a single free-tier Neon database means a merge that drops a column would break the running API from a branch nobody had reviewed yet. `DIRECT_URL` is what the migration uses, through `prisma7.config.ts`; `DATABASE_URL` is what the client uses. Nothing asserts that the first is really Neon's pooled endpoint, because sniffing for `-pooler` in a hostname would make the code care which vendor hosts the database, and ADR 0001 spent its argument on not caring.

`prisma generate` is not in the build command. It looked necessary, and the api's `postinstall` turned out to already cover it — confirmed by deleting the generated client locally, and then again in every deployment log.

Three things are deliberately absent:

- **No build-time guard on `VITE_API_URL`.** One was written and then removed. It keyed off a Vercel-specific variable, so it would have gone quietly inert on any other host while ADR 0005 promises that re-hosting the web app costs one environment variable; it read `process.env` where the app reads `import.meta.env`, so a value supplied through a `.env` file would have failed a build that was actually configured; and an empty string passed it.
- **No test for the origin patterns**, by explicit decision of the maintainer, keeping ADR 0006's one-seam rule literal. It is the only logic in the ticket and it is security-relevant, so it was exercised by hand instead, and then again against the deployment.
- **Nothing implements the idle-wake criterion**, because ADR 0001 already chose the host that satisfies it: Neon resumes on the next query with no human in the loop. No retry and no connection-pool tuning was added — `pg` closes an idle connection after ten seconds by default, far inside Neon's five-minute suspend window, so the stale-socket case a retry would catch cannot arise from the pool sitting idle.

### What was claimed earlier in this ticket and is not true

An earlier revision of these comments, and of ADR 0005, said the API shipped as a captured Node server behind `apps/api/server.js`, and justified that file by saying Vercel compiles a TypeScript entrypoint with esbuild, which does not implement `emitDecoratorMetadata`. Both halves are wrong and both have been corrected. The platform refuses a forwarding entrypoint outright, so `server.js` could never have been used; it has been deleted. And Vercel compiles `src/main.ts` with the repository's own TypeScript, honouring `emitDecoratorMetadata` — the generated function was unpacked and its compiled controller carries the `design:paramtypes` metadata.

The underlying worry was still worth having, just not about esbuild. Compiling this API without `emitDecoratorMetadata` produces an app that starts cleanly, maps its routes, logs nothing wrong, and then fails on the first request with `TypeError: Cannot read properties of undefined (reading 'execute')`, because the controller was constructed with nothing injected. That is recorded in ADR 0005 so the flag in `apps/api/tsconfig.json` does not look incidental to whoever reads it next.

### How this was verified

`pnpm build`, `pnpm lint`, `pnpm format:check` and the API's suite all pass from the root; the suite is unchanged at five tests.

Against the deployed API at `https://fibopoker-api.vercel.app`, with plain `curl` and no authentication bypass:

- `POST /rooms` returned `201` and `{"id":"7KomOSVnpV_H","revision":1}`.
- `GET /rooms/7KomOSVnpV_H` returned `200` and the same Room, which is the deployed half of reopening a link.
- `GET /rooms/ZZZZZZZZZZZZ` returned `404` and `{"code":"room_not_found",…}`, so `DomainErrorFilter` survives the platform.
- A preflight carrying `https://fibopoker-web.vercel.app` returned `204` with `Access-Control-Allow-Origin` echoing it and `Vary: Origin` set; one carrying a preview origin matched by the wildcard did the same; one carrying `https://fibopoker-web.vercel.app.evil.com` returned no `Access-Control-Allow-Origin` header at all, which is the refusal. `Access-Control-Allow-Credentials` was absent throughout.
- Five consecutive reads: `1.04s`, then `0.32s`, `0.29s`, `0.30s`, `0.30s`. The drop is the warm instance, and it is the evidence for the singleton criterion.
- After roughly ten minutes with no query against it, the first read returned `200` in `1.07s`, with nothing done to wake anything.

The production build log shows `Applying migration 20261010195151_create_rooms` followed by `All migrations have been successfully applied`, over `DIRECT_URL`, after the workspace compiled. The same step is absent from every preview build, which is the production-only gate working.

The web app at `https://fibopoker-web.vercel.app` serves `/` and, through the SPA rewrite, `/r/abc123XY` as well, both `200 text/html`.

### What is still open

**Creating a Room and reopening its link against the deployed URLs** is verified against the API but not yet through the deployed web app. `VITE_API_URL` is read at build time, and the published web bundle predates that variable being set — it still carries `http://localhost:3000`. One production deployment of the web project fixes it, after which the browser flow is the last thing to confirm.
