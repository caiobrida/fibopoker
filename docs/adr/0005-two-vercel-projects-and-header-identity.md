# Two Vercel projects, and identity in a header rather than a cookie

The web app and the API deploy as two separate Vercel projects from this monorepo, with root directories `apps/web` and `apps/api`. They therefore sit on different origins, and the API needs CORS. The allowlist must match preview origins by pattern, not by fixed string: every preview deployment gets a fresh `*.vercel.app` hostname, so a hardcoded origin means every preview is born broken.

**A Participant's identity token travels in an `Authorization` header, from `localStorage` — never in a cookie.** This is deliberate and load-bearing, not an oversight. Two origins plus a cookie would mean a third-party cookie with `SameSite=None`, which modern browsers increasingly block outright. Header-borne identity sidesteps the problem completely. Anyone tempted to "improve" this by moving to cookies would reintroduce it.

Keeping the API as its own deployable also means moving it off Vercel later — to a VPS, where a long-running process makes WebSocket transport viable — touches nothing in the web app but one environment variable.

## How this is configured, since ticket 03

The allowlist is `WEB_ORIGINS`, a comma-separated list in which `*` stands for exactly one hostname label — never spanning a `.`, a `:` or a `/` — and every entry is matched whole. One entry covers every preview of a project, and the team slug in it is what stops a preview deployed from another Vercel account matching. Anchoring is the other half: without it, `https://fibopoker.vercel.app.evil.com` would pass. The allowlist is a list of `RegExp` handed straight to `enableCors`, so nothing hand-rolls the matching.

**The API is one Vercel Function, and the platform chooses and compiles its entrypoint.** Vercel looks for `src/main`, `src/app`, `src/index`, `src/server`, `app`, `index` or `server` at the project root, in that order, and requires the file it picks to import Nest — an entrypoint that only forwards to compiled output is refused outright, with `No entrypoint found which imports nestjs`. So `src/main.ts` is the entrypoint, and the platform compiles it with the repository's own TypeScript and `tsconfig.json`.

**`bootstrap()` must not be awaited at module scope.** The launcher imports the entrypoint and then completes a handshake of its own; a module that awaits `listen()` at top level never lets that import settle in time, and every request hangs until the gateway times out — no response, no runtime log, nothing to point at the cause. The bare call is what the platform documents and what works. It costs nothing the ticket wanted: the call still happens once, when the module is first evaluated, which is what makes the Nest app a module-scoped singleton. Measured on the deployment, a cold request takes about a second and every warm one about 0.3s.

**`emitDecoratorMetadata` in `apps/api/tsconfig.json` is load-bearing.** Nest resolves a controller's constructor from exactly that metadata. Compiling this API without the flag produces an app that starts cleanly, maps its routes and logs nothing wrong, and then fails on the first request with `TypeError: Cannot read properties of undefined` — the controller was built with nothing injected. The failure is silent until traffic arrives, which is why the flag deserves a note rather than being left to look incidental. Vercel's own compilation of `src/main.ts` honours it; the generated function was inspected and the compiled controller carries its `design:paramtypes`.

`credentials` is deliberately left off the CORS options. Header-borne identity needs no credentialed request, and enabling it is the first step back toward the cookie this decision exists to avoid.
