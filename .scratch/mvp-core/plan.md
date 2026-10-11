# MVP: core voting flow — staged plan

The spec for this feature is [`spec.md`](./spec.md); this file is the delivery order.

Create a Room, share its link, join with a nickname, estimate in Fibonacci, reveal together.

Domain language is in [`CONTEXT.md`](../../CONTEXT.md). The decisions behind this plan are in [`docs/adr/`](../../docs/adr/) — read 0001 through 0005 before changing anything structural.

## Done, for the whole MVP

The team runs a real planning session on it, start to finish, without anyone opening an incognito tab or being told to reload.

---

## Stage 0 — Monorepo and CI

`pnpm` workspaces with `apps/web` (Vite + React + TS), `apps/api` (NestJS), `packages/shared`. Shared base `tsconfig`, one ESLint + Prettier config at the root. `.gitignore` grows to cover `node_modules`, `dist`, `.env*`, `.vercel`, `coverage`.

Both GitHub Actions workflows land here, running lint + build only — they exist from the first commit so every later stage is guarded. Path filters so web changes don't run the API job.

**Done:** `pnpm install`, `pnpm lint` and `pnpm build` pass from the root across all three packages; both workflows green on a PR.

## Stage 1 — Shared contract

`packages/shared` holds the Deck constant and one zod schema per payload: create room, join, rename, leave, cast estimate, open round, reveal, set final estimate, toggle spectator, plus the `RoomSnapshot` and the error shape. The snapshot carries `revision`.

Must stay runtime-agnostic — no Nest imports, no browser APIs, since both apps build it.

**Done:** `packages/shared` builds standalone; both apps import a schema and `z.infer` a type from it.

## Stage 2 — Schema and migrations

Prisma schema for `Room`, `Round`, `Participant`, `Estimate`, against Neon.

Invariants that belong in the database, not in application code:

- One Estimate per (Round, Participant) — unique constraint.
- Room ids are `nanoid` 12+, never sequential integers.
- `Room.revision` is a single integer bumped **in the same transaction** as any mutation to that Room's data. Nothing writes without bumping it.
- A revealed Round is immutable: `revealed_at` set means Estimates are never updated or deleted. `final_estimate` is the one nullable field that may still be written after reveal.

Runtime uses Neon's pooled URL; `prisma migrate` uses the direct one.

**Done:** migration applies cleanly to a fresh Neon branch, and a Room round-trips through the Prisma repository against it — verified by hand, since no automated test reaches this layer (ADR 0006).

## Stage 3 — API and tests

NestJS with the app instance cached at module scope so a warm invocation skips bootstrap, and `PrismaClient` as a module singleton. A zod validation pipe fed by the shared schemas. Repository interface with a Prisma implementation behind it. This interface **is** the test seam: the in-memory fake implements it, so it earns its place rather than being speculative indirection.

Use cases: create room, join, snapshot (which doubles as the heartbeat, touching `last_seen_at`), cast or change estimate, reveal, open next round, set final estimate, rename, leave, toggle spectator. Typed domain errors mapped to HTTP at the edge.

A guard resolves the `Authorization` token to a Participant scoped to that Room — a token for Room A must be useless on Room B.

Tests enter through **one seam only**: the use cases, driven with an in-memory repository and an injectable `Clock`. No database, no HTTP, no supertest — the suite runs in milliseconds and CI needs no service container. See ADR 0006 for what this deliberately does not cover, and [`spec.md`](./spec.md) for the invariants covered.

**Done:** the suite is green in CI; the full flow is drivable with `curl` against a local instance.

## Stage 4 — Design system

Dark-only semantic tokens on `:root` per ADR 0004, and only the primitives the core flow actually needs: `Button`, `Surface`, `Input`, `EstimateCard`, `ParticipantRow`. Variants as typed unions, never boolean props.

Built for the screens in Stage 5 rather than speculatively — a primitive with no caller is a guess.

**Done:** every primitive renders with zero literal colors, spacings or radii; grep for `#` in component styles comes back empty.

## Stage 5 — Core flow in the browser

Two routes: create, and room. `useRoomState(roomId)` is the only thing that knows about the transport — adaptive interval (~1.5s open, ~8s idle, ~30s backgrounded), keyed on `revision` so an unchanged snapshot does not re-render.

Screens: create a Room and land in it; copy the link in one click; join with a nickname; the Deck; who is present and who has already voted; reveal; the revealed Round with identical values grouped and the min/max divergence highlighted.

**Done:** two browsers (not two tabs) join the same link and each sees the other vote and reveal, with no manual reload.

## Stage 6 — The rest of the MVP

Final estimate on a revealed Round; open next Round; re-vote carrying the title; rename; leave (clearing the local token); Spectator mode; export the session as a `task → points` list for the clipboard. Layout verified at phone width.

**Done:** every item on the in-scope list in this session's shared understanding works.

## Stage 7 — Deploy

Two Vercel projects with root directories `apps/web` and `apps/api`. CORS allowlist matching preview origins **by pattern** — a fixed origin string means every preview is born broken. Env: `DATABASE_URL` (pooled) and `DIRECT_URL` on the API, API base URL on the web app.

**Done:** a real session with the team on the deployed URLs.

---

## Three tickets added after the fact

Tickets 06, 07 and 15 were written once ticket 05 had shipped and the Room could be looked at. They are the interface work the stages above describe only as "screens" — a part of this plan that was left implicit rather than a change to it.

**The set was renumbered when they landed**, so the numbers still read as the delivery order: what were tickets 06 through 12 are now 08 through 14, and the two new ones that belong early took 06 and 07. A ticket's number is still only an identifier — `Blocked by` is what actually sequences the set — but a number that disagrees with the order is a trap for whoever reads this next, and renumbering was cheaper than the trap.

- **06 — The Room is a table.** The Participant list becomes seats around a table that fill in as people arrive. It goes before the Deck because the Deck, the voted state and the Reveal all need a seat to live in, and building them against a list would mean re-homing every one of them. It also establishes the duration and easing tokens, which is why it has to come before anything else that animates.
- **07 — Design the entry screens.** The create and nickname screens, which shipped functional and plain in tickets 02 and 04.
- **15 — Motion pass.** The sibling of ticket 14 — the same kind of cross-cutting sweep, for motion rather than layout, landing after it.

Stage 4 above lists `ParticipantRow` among the primitives; ticket 06 is where that becomes a seat at a table instead. Stage 5's "Done" condition is unchanged and still the real one: two browsers, one link, each seeing the other vote and reveal with no manual reload.

## Explicitly out of scope

Accounts and login · backlog import · average or median on screen · host/facilitator role · light mode · removing a participant · reordering or deleting Rounds · sound on reveal · "is choosing" indicator · per-Round timer · editing a revealed Round's title.

## Settled micro-decisions

Three were left to be decided at the keyboard, listed so they would be chosen rather than defaulted. All three went the way the lean pointed, and none is open any more:

1. **Polling mechanics** — **TanStack Query**, chosen in ticket 02. `refetchInterval` accepts a function and the library already knows about window focus and background tabs, which is exactly the adaptive interval ticket 05 needs.
2. **Participant token at rest** — **a sha256 of it**, chosen in ticket 04. A database dump identifies nobody, and the deterministic digest is what lets a presented token be matched at all. The match happens in memory over the Room aggregate the snapshot has already loaded, so the `(room_id, token_hash)` unique index serves as a constraint rather than as a lookup path.
3. **Routing** — **React Router**, chosen in ticket 02. Two routes either way, and it is what any contributor expects.
