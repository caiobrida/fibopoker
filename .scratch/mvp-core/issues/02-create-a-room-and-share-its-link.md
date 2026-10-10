# 02 — Create a Room and share its link

**What to build:** A team member opens the app, creates a Room with one click, and gets a link they can copy and paste into the team chat. Reopening that link later lands back in the same Room.

This is the first tracer bullet: the thinnest complete path through schema, migration, API, screen and test. It also establishes three foundations that every later ticket assumes, so that none of them has to be retrofitted — the dark token layer, the repository interface with its in-memory fake, and the Room revision being bumped from the very first write.

**Blocked by:** 01 — Monorepo scaffold and CI

**Status:** ready-for-agent

- [x] Creating a Room yields a short random identifier, never a sequential integer — the link is the only credential in the system, so identifiers must not be enumerable
- [x] The Room link is copyable with a single click
- [x] Reopening the link resolves to the same Room, days later
- [x] A Room carries a revision, set on creation and bumped inside the same transaction as any mutation to that Room's data
- [x] The dark semantic token set is defined once; the screen references tokens only, with no literal colour, spacing, radius or duration anywhere in component styles
- [x] A repository interface exists, with a Prisma implementation and an in-memory implementation
- [x] Use cases are tested by driving them against the in-memory implementation, with no database and no HTTP in the suite
- [x] The migration applies cleanly to a fresh database

## Comments

The API is four directories, each with one job: `domain` holds the use cases, the `Room`, the repository interface and the typed errors; `http` holds the controller and the filter that maps those errors to status codes; `infra` holds the Prisma client and its repository; `testing` holds the in-memory fake.

**The domain layer imports no framework.** Use cases are plain classes with constructor arguments, wired in `app.module.ts` with `useFactory` rather than decorated with `@Injectable`. This costs a handful of lines in the module and buys two things: searching `src/domain` for a Nest import comes back empty, and the suite instantiates a use case with `new` instead of standing up a testing module.

Two things the plan called for are deliberately **not** here yet, because neither has anything to do in this ticket:

- **No injected `Clock`, and no `created_at` on a Room.** ADR 0006 makes time a dependency because the activity window is otherwise untestable — and the activity window arrives in ticket 05. A Room is `id` and `revision`, and nothing in this ticket reads a timestamp, so adding one would have meant either a port with no caller or a `new Date()` that contradicts the rule. Ticket 04 is where the first timestamp (`last_seen_at`) lands, and the `Clock` belongs with it.
- **No zod validation pipe.** Stage 3 wants one fed by the shared schemas, but nothing in this ticket has a request payload: creating a Room is a bare `POST`, and reading one carries its identifier in the path. A malformed identifier is answered `404 room_not_found` rather than `400` on purpose — someone pasting a truncated link should be told the Room is not there, which is true, rather than that their request was malformed. The pipe earns its place with ticket 04's first body.

**`nanoid` is called directly in the use case rather than hidden behind a port.** The repository interface is a seam because it has a second implementation; a random-identifier port would have had exactly one, and the test does not need to predict an identifier — it asserts the properties the criterion actually names. The test creates fifty Rooms and checks that every identifier is twelve characters from the URL-safe alphabet, that none is a run of digits, and that no two collide.

**The revision is set on every write, and so far there is exactly one write.** The "bumped inside the same transaction" half of that criterion has no mutation to govern yet — creation is the only thing that writes a Room. What this ticket fixes is that the column exists, is not nullable, has no database default, and is therefore impossible to insert without choosing a value. Ticket 04's writes are where the bump itself gets enforced and tested.

On the browser side, **exactly one module knows a transport exists**: `src/shared/api`. It exports `useRoomState`, which returns a typed union — `resolving`, `present`, `absent`, `unreachable` — rather than a query object, so the screens never touch TanStack Query's vocabulary and ticket 05 can change the transport underneath without touching a screen. `ApiProvider` wraps the query client so even `main.tsx` is transport-agnostic.

Two of the three micro-decisions left open in `plan.md` are now settled, both the way the plan was leaning. **React Router** for the two routes, and **TanStack Query** for fetching — it does the loading and error bookkeeping this ticket needs today, and ticket 05's adaptive interval is one option on a call it already makes. The third, whether the Participant token is stored raw or hashed, stays open; it belongs to ticket 04.

The design system is one primitive, `Button`, because the two screens need one primitive. Its variant is a typed union rendered as a `data-variant` attribute rather than a second class name, which sidesteps the fact that a CSS Modules class is typed `string | undefined` under `noUncheckedIndexedAccess`. Everything else is the token layer: `tokens.css` holds every value, `global.css` holds the base element styles, and searching for `#` or for a literal length or duration anywhere else under `apps/web/src` comes back empty. The two state colours ADR 0004 deliberately left unfixed are still unfixed — they want choosing against the real revealed-Round screen, which is ticket 07.

**Prisma 7 changed enough to be worth writing down.** The CLI reads `prisma7.config.ts`, not the schema's `env()` calls, so the schema's `datasource` block no longer names a URL at all: the config passes `DIRECT_URL` to the CLI for migrations, and `src/infra/prisma.ts` passes `DATABASE_URL` to the client for the pooled runtime connection. A driver adapter is now mandatory, hence `@prisma/adapter-pg`. The client is generated as TypeScript into `src/generated`, which is gitignored and rebuilt by a `postinstall`, so a clean clone still needs nothing but `pnpm install`.

CORS allows the single origin in `WEB_ORIGIN`. Matching preview hostnames by pattern is ticket 03's, where the previews exist.

`GET /` and the Deck it served are gone, as ticket 01 said they should be once real controllers arrived.

### How this was verified

`pnpm build`, `pnpm lint` and `pnpm format:check` pass from the root; the API's suite is five tests in about a quarter of a second, and the API workflow now runs it.

The migration was generated and applied by `prisma migrate dev` against a fresh local Postgres, and the whole path was then driven against it: `POST /rooms` answers `201` with a twelve-character identifier and `revision: 1`, `GET /rooms/:id` answers `200` with the same pair, and an identifier no Room holds answers `404` with the shared error shape. The two responses were parsed with the very `roomSnapshotSchema` and `apiErrorSchema` the web client uses, so the contract is confirmed from the consumer's side rather than assumed. CORS was checked with an `Origin` header on both the preflight and the real request, and the dev server was confirmed to serve a `/r/:roomId` link.

**What was not verified: the screens in a browser.** The browser automation this session had available would not connect, so the create screen, the one-click copy and the three states of the Room screen have been typechecked, linted and built but not clicked. That is the gap to close first, and ticket 05's two-browser criterion closes it properly.
