# 02 — Create a Room and share its link

**What to build:** A team member opens the app, creates a Room with one click, and gets a link they can copy and paste into the team chat. Reopening that link later lands back in the same Room.

This is the first tracer bullet: the thinnest complete path through schema, migration, API, screen and test. It also establishes three foundations that every later ticket assumes, so that none of them has to be retrofitted — the dark token layer, the repository interface with its in-memory fake, and the Room revision being bumped from the very first write.

**Blocked by:** 01 — Monorepo scaffold and CI

**Status:** ready-for-agent

- [ ] Creating a Room yields a short random identifier, never a sequential integer — the link is the only credential in the system, so identifiers must not be enumerable
- [ ] The Room link is copyable with a single click
- [ ] Reopening the link resolves to the same Room, days later
- [ ] A Room carries a revision, set on creation and bumped inside the same transaction as any mutation to that Room's data
- [ ] The dark semantic token set is defined once; the screen references tokens only, with no literal colour, spacing, radius or duration anywhere in component styles
- [ ] A repository interface exists, with a Prisma implementation and an in-memory implementation
- [ ] Use cases are tested by driving them against the in-memory implementation, with no database and no HTTP in the suite
- [ ] The migration applies cleanly to a fresh database
