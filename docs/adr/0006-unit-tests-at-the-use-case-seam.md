# Unit tests at the use case seam, and nothing below it

Automated tests enter the API at exactly one seam: the use cases, driven with an in-memory implementation of the repository interface and an injectable `Clock`. There is no database, no HTTP layer and no supertest in the suite, so it runs in milliseconds and CI needs no Postgres service container.

This has a consequence worth stating plainly rather than discovering later: **the Prisma repository and the migrations have no automated coverage at all.** A wrong column, a bad query or a migration that applies cleanly but drops the wrong constraint passes CI green. Three things make that an acceptable trade for this project rather than a reckless one: the queries are simple reads and writes with no derived logic, the database enforces the invariants that matter most through constraints rather than application code, and the real integration check is a human one — the two-browser test at the end of the delivery plan's Stage 5 and the team's first real session at Stage 7.

Two deliberate design consequences:

1. **The repository interface is a test seam, not speculative indirection.** The in-memory fake is its second implementation, which is what justifies the abstraction existing at all.
2. **Time is a dependency, never ambient.** Nothing calls `new Date()` directly. The 60-second activity window that decides who counts as present is only testable because `Clock` is injected, and a test can move time forward instead of sleeping.

An HTTP-level suite was considered: one seam, higher up, surviving any internal refactor. It was rejected for the MVP on speed and setup cost. Should it ever be added, it belongs *alongside* these tests at the same seam count, replacing them rather than layering on top.
