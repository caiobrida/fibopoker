# Two Vercel projects, and identity in a header rather than a cookie

The web app and the API deploy as two separate Vercel projects from this monorepo, with root directories `apps/web` and `apps/api`. They therefore sit on different origins, and the API needs CORS. The allowlist must match preview origins by pattern, not by fixed string: every preview deployment gets a fresh `*.vercel.app` hostname, so a hardcoded origin means every preview is born broken.

**A Participant's identity token travels in an `Authorization` header, from `localStorage` — never in a cookie.** This is deliberate and load-bearing, not an oversight. Two origins plus a cookie would mean a third-party cookie with `SameSite=None`, which modern browsers increasingly block outright. Header-borne identity sidesteps the problem completely. Anyone tempted to "improve" this by moving to cookies would reintroduce it.

Keeping the API as its own deployable also means moving it off Vercel later — to a VPS, where a long-running process makes WebSocket transport viable — touches nothing in the web app but one environment variable.

## How this is configured, since ticket 03

The allowlist is `WEB_ORIGINS`, a comma-separated list in which `*` stands for exactly one hostname label — never spanning a `.`, a `:` or a `/` — and every entry is matched whole. One entry covers every preview of a project, and the team slug in it is what stops a preview deployed from another Vercel account matching. Anchoring is the other half: without it, `https://fibopoker.vercel.app.evil.com` would pass. The allowlist is a list of `RegExp` handed straight to `enableCors`, so nothing hand-rolls the matching.

**The API is deployed as one captured Node server, built by `tsc` before the platform ever sees it.** Vercel detects a `server.js` at the project root and routes every request into the HTTP server it starts, so the Nest app is bootstrapped once per cold start at module load and a warm invocation re-enters an app that is already listening. There is no per-request bootstrap to cache by hand.

The indirection — `server.js` containing nothing but `import './dist/main.js'` — is the load-bearing part, and it is not decoration. Vercel compiles a TypeScript entrypoint with esbuild, which does not implement `emitDecoratorMetadata`; Nest resolves a controller's constructor from exactly that metadata, so an entrypoint compiled that way yields a controller whose dependencies cannot be resolved. Pointing the platform at already-compiled output means `tsc` remains the only compiler that produces anything we run. Anyone tempted to "simplify" this by letting Vercel compile `src/` directly would reintroduce it.

`credentials` is deliberately left off the CORS options. Header-borne identity needs no credentialed request, and enabling it is the first step back toward the cookie this decision exists to avoid.
