# 02 — Create a Room and share its link

**What to build:** A team member opens the app, creates a Room with one click, and gets a link they can copy and paste into the team chat. Reopening that link later lands back in the same Room.

This is the first tracer bullet: the thinnest complete path through schema, migration, API, screen and test. It also establishes three foundations that every later ticket assumes, so that none of them has to be retrofitted — the dark token layer, the repository interface with its in-memory fake, and the Room revision being bumped from the very first write.

**Blocked by:** 01 — Monorepo scaffold and CI

**Status:** ready-for-agent

- [x] Creating a Room yields a short random identifier, never a sequential integer — the link is the only credential in the system, so identifiers must not be enumerable
- [x] The Room link is copyable with a single click
- [x] Reopening the link resolves to the same Room, days later
- [x] A Room carries a revision, written on creation by the code rather than defaulted by the database, so no Room can come into existence without one
- [x] The dark semantic token set is defined once; the screen references tokens only, with no literal colour, spacing, radius or duration anywhere in component styles
- [x] A repository interface exists, with a Prisma implementation and an in-memory implementation
- [x] Use cases are tested by driving them against the in-memory implementation, with no database and no HTTP in the suite
- [x] The migration applies cleanly to a fresh database

## Comments

The API is four directories, each with one job: `domain` holds the use cases, the `Room`, the repository interface and the typed errors; `http` holds the controller and the filter that maps those errors to status codes; `infra` holds the Prisma client and its repository; `testing` holds the in-memory fake.

**The domain layer imports no framework.** Use cases are plain classes with constructor arguments, wired in `app.module.ts` with `useFactory` rather than decorated with `@Injectable`. This costs a handful of lines in the module and buys two things: searching `src/domain` for a Nest import comes back empty, and the suite instantiates a use case with `new` instead of standing up a testing module.

**The revision criterion was split, and half of it moved to ticket 04.** As originally written it asked for two things: that a Room carry a revision set on creation, and that the revision be bumped inside the same transaction as any mutation to that Room's data. The first half is done, and is what the box above now says: `INITIAL_REVISION` is written by the use case, the column is not nullable and carries no database default, and `RoomRepository` exposes `create` and `findById` and nothing else — so as the code stands it is impossible to write a Room without choosing a revision.

The second half had nothing to do here. Nothing in this ticket mutates a Room, so there was no transaction to wrap, no bump to perform and no test to write — a test for "every mutation advances the revision" needs a mutation. Inventing an `update` that no screen calls, purely to have something to wrap, is what `AGENTS.md` means by adding a thing in anticipation of its need. The clause now lives on ticket 04, which brings the first write that changes a Room, and `spec.md` keeps it among the invariants either way.

Two things the plan called for are deliberately **not** here, because neither has anything to do in this ticket:

- **No injected `Clock`, and no `created_at` on a Room.** ADR 0006 makes time a dependency because the activity window is otherwise untestable — and the activity window arrives in ticket 05. A Room is `id` and `revision`, and nothing in this ticket reads a timestamp, so adding one would have meant either a port with no caller or a `new Date()` that contradicts the rule. Ticket 04 is where the first timestamp (`last_seen_at`) lands, and the `Clock` belongs with it.
- **No zod validation pipe.** Stage 3 wants one fed by the shared schemas, but nothing in this ticket has a request payload: creating a Room is a bare `POST`, and reading one carries its identifier in the path. A malformed identifier is answered `404 room_not_found` rather than `400` on purpose — someone pasting a truncated link should be told the Room is not there, which is true, rather than that their request was malformed. The pipe earns its place with ticket 04's first body.

**`nanoid` is called directly in the use case rather than hidden behind a port.** The repository interface is a seam because it has a second implementation; a random-identifier port would have had exactly one, and the test does not need to predict an identifier — it asserts the properties the criterion actually names. The test creates fifty Rooms and checks that every identifier is twelve characters from the URL-safe alphabet, that none is a run of digits, and that no two collide. `roomIdSchema` states the same shape in the contract, length and alphabet both, so the two cannot drift apart.

On the browser side, **exactly one module knows a transport exists**: `src/shared/api`. It exports `useRoomState`, which returns a typed union — `resolving`, `present`, `absent`, `unreachable` — rather than a query object, so the screens never touch TanStack Query's vocabulary and ticket 05 can change the transport underneath without touching a screen. `ApiProvider` wraps the query client so even `main.tsx` is transport-agnostic.

That union resolves `present` **before** `unreachable`, which matters more than it looks: once ticket 05 adds an interval, one failed refetch must not replace a Room the team is looking at with an error screen. The module also keeps library vocabulary out of the text people read — a dead network and an unparseable body each become one plain sentence, so zod's "expected string, received number" and the browser's "Failed to fetch" never reach a screen. What does reach a screen is the API's own `message`, because that one is written for a human.

Two of the three micro-decisions left open in `plan.md` are now settled, both the way the plan was leaning. **React Router** for the two routes, and **TanStack Query** for fetching — it does the loading and error bookkeeping this ticket needs today, and ticket 05's adaptive interval is one option on a call it already makes. The third, whether the Participant token is stored raw or hashed, stays open; it belongs to ticket 04.

The design system is the primitives the two screens actually use: `Button`, plus `Screen`, `Heading`, `Lead` and `Note`, which exist because both screens were otherwise repeating the same centred column and the same two text styles in their own CSS modules. `Button`'s variant is a typed union rendered as a `data-variant` attribute rather than a second class name, which sidesteps the fact that a CSS Modules class is typed `string | undefined` under `noUncheckedIndexedAccess`. Everything else is the token layer: `tokens.css` holds every value, `global.css` holds the base element styles, and no component stylesheet contains a literal colour, length or duration. ADR 0004's table was brought back in step with it and now points at `tokens.css` as the one place values live. The two state colours that ADR deliberately left unfixed are still unfixed — they want choosing against the real revealed-Round screen, which is ticket 09.

**Prisma 7 changed enough to be worth writing down.** The CLI reads `prisma7.config.ts`, not the schema's `env()` calls, so the schema's `datasource` block no longer names a URL at all: the config passes `DIRECT_URL` to the CLI for migrations, and `src/infra/prisma.ts` passes `DATABASE_URL` to the client for the pooled runtime connection. A driver adapter is now mandatory, hence `@prisma/adapter-pg`. The client is generated as TypeScript into `src/generated`, which is gitignored and rebuilt by a `postinstall`, so a clean clone still needs nothing but `pnpm install`.

CORS allows the single origin in `WEB_ORIGIN`, which is what the local tracer bullet needs and what ADR 0005 warns is not enough for deployment. That is not an oversight here: ticket 03 carries the criterion "the CORS allowlist matches preview origins by pattern, not by fixed string", and the patterns want writing where the preview hostnames exist.

`GET /` and the Deck it served are gone, as ticket 01 said they should be once real controllers arrived. The Deck constant itself stays in the shared package with no caller for now — it is the contract constant `spec.md` asks for, and ticket 08 renders it.

### How this was verified

`pnpm build`, `pnpm lint` and `pnpm format:check` pass from the root; the API's suite is five tests in about a fifth of a second, and the API workflow now runs it.

The migration was generated by `prisma migrate dev` and then, as committed, applied by `prisma migrate deploy` to a brand-new empty Postgres — which is the criterion, rather than the state the generating run happened to leave behind. The whole path was then driven against that database: `POST /rooms` answers `201` with a twelve-character identifier and `revision: 1`, `GET /rooms/:id` answers `200` with the same pair, and an identifier no Room holds answers `404` with the shared error shape. The two responses were parsed with the very `roomSnapshotSchema` and `apiErrorSchema` the web client uses, so the contract is confirmed from the consumer's side rather than assumed. CORS was checked with an `Origin` header on both the preflight and the real request, and the dev server was confirmed to serve a `/r/:roomId` link.

**What was not verified: the screens in a browser.** The browser automation this session had available would not connect, so the create screen, the one-click copy and the four states of the Room screen have been typechecked, linted and built but not clicked. That is the gap to close first, and ticket 05's two-browser criterion closes it properly.
