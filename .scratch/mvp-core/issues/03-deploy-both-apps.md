# 03 — Deploy both apps

**What to build:** Both apps reachable on real URLs, with Room creation working end to end against them.

This lands third, not last, on purpose. Everything after it is then verified on the platform it will actually run on — framework cold start, preview-origin CORS, connection pooling, a database waking from idle. Discovering those at the end, with the whole feature built, is where they are most expensive to fix.

**Blocked by:** 02 — Create a Room and share its link

**Status:** ready-for-agent

- [ ] The web app and the API deploy as two separate projects from this monorepo
- [ ] The CORS allowlist matches preview origins by pattern, not by fixed string, so a preview deployment is not born broken
- [ ] The API uses the pooled database connection at runtime and the direct one for migrations
- [ ] The database client and the API instance are module-scoped singletons, so a warm invocation neither re-bootstraps the framework nor opens a new connection
- [ ] Creating a Room and reopening its link both work against the deployed URLs
- [ ] A first request after a long idle period succeeds with no manual step to wake anything
