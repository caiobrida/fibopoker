# Two Vercel projects, and identity in a header rather than a cookie

The web app and the API deploy as two separate Vercel projects from this monorepo, with root directories `apps/web` and `apps/api`. They therefore sit on different origins, and the API needs CORS. The allowlist must match preview origins by pattern, not by fixed string: every preview deployment gets a fresh `*.vercel.app` hostname, so a hardcoded origin means every preview is born broken.

**A Participant's identity token travels in an `Authorization` header, from `localStorage` — never in a cookie.** This is deliberate and load-bearing, not an oversight. Two origins plus a cookie would mean a third-party cookie with `SameSite=None`, which modern browsers increasingly block outright. Header-borne identity sidesteps the problem completely. Anyone tempted to "improve" this by moving to cookies would reintroduce it.

Keeping the API as its own deployable also means moving it off Vercel later — to a VPS, where a long-running process makes WebSocket transport viable — touches nothing in the web app but one environment variable.
