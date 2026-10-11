# 04 — Join a Room with a nickname

**What to build:** Someone opens a Room link, types a nickname, and is in the Room seeing who else is there. No account, no sign-up, and no private browsing window.

Reloading the page keeps them as themselves — same nickname, same place in the list, no duplicate.

Joining is also the first thing in the project that **changes** a Room rather than creating one, so the revision rule becomes testable here. Ticket 02 established that a Room cannot exist without a revision; this is where it starts moving, and where the rule that nothing writes without bumping it gets enforced for every write that follows.

**Blocked by:** 02 — Create a Room and share its link

**Status:** ready-for-agent

- [x] Opening a Room link without an identity asks for a nickname
- [x] Joining issues an opaque token, held in browser storage scoped to that Room
- [x] The token travels in an `Authorization` header and never in a cookie
- [x] A token issued for one Room is rejected by every other Room
- [x] Reloading preserves identity — the same nickname, no second entry in the list
- [x] A nickname already in use in that Room produces a warning but does not block joining
- [x] A single snapshot read returns everything needed to draw the Room, including its revision
- [x] Every mutation to a Room's data bumps that Room's revision inside the same transaction as the mutation itself, so nothing can write without bumping — carried over from ticket 02, which had no mutation to govern
- [x] No screen assembles Room state from more than one call

## Comments

**Identity resolves in a use case, not in a guard.** Stage 3 of `plan.md` describes "a guard resolves the `Authorization` token to a Participant scoped to that Room". It is a use case here instead, and the reason is ADR 0006: tests enter at exactly one seam, so an invariant living in a Nest guard is an invariant no test in this repo can reach. "A Participant token is valid only for the Room it was issued for" is on `spec.md`'s list of invariants that get tested, so it had to be reachable from the seam. `GetRoomSnapshot` takes the token, the controller's only job is to parse `Bearer` off the header, and the rule is covered twice over — a token from another Room, and a token nobody holds.

The lookup falls out of the Room aggregate rather than querying for the Participant. `findById` loads the Room with its Participants and `participantHolding` matches the presented hash among them, which means the cross-Room rule is not a condition anyone had to remember to write: you can only be found inside the Room you were looked for in. One query serves the whole snapshot, which is what `spec.md` asks of the only read.

**The token is stored as a sha256, settling the last open micro-decision.** `plan.md` left "whether the Participant token is stored raw or hashed" to be chosen at the keyboard, leaning hashed, and hashed is what shipped — `issueToken` returns `nanoid(32)`, the column holds the digest, and a database dump identifies nobody. The rationale recorded for the lean was "lookup stays a deterministic single query", and that holds, though not quite the way it was imagined: the deterministic hash is what lets the Participant be found at all, but the finding happens in memory over an already-loaded aggregate. The `(room_id, token_hash)` unique index therefore earns its place as a constraint today rather than as the path a lookup takes. `plan.md`'s open list is now empty and says so.

**The bump is a property of the write, not of the caller.** Both repositories expose exactly one mutation, and in both the revision is advanced by the thing that performs the write rather than by whoever calls it: `PrismaRoomRepository.bumpingRevision` opens the transaction, increments, and only then hands a transaction to the write, and `InMemoryRoomRepository.bumpingRevision` does the same over its map. A future mutation is a new method, and the only way either class can write is through that helper. What this does not do is make the rule unforgeable in the type system — nothing stops a sibling method reaching for `this.prisma` directly. Making that impossible would mean hand-narrowing every Prisma delegate to its read half, which is a lot of type machinery to restate a rule the one write path already enforces.

That matters more than usual because of where the test sits. The seam is the use cases, so "every mutation advances the revision" is asserted against the in-memory fake; a Prisma write that skipped the helper would pass CI green. This is exactly the hole ADR 0006 declares and accepts, so the transaction was checked by hand instead, by making the second statement inside it fail: a duplicate insert was rejected with `P2002` and the revision stayed where it was, so the increment rolls back with the write it accompanies rather than committing beside it.

**`nicknameAlreadyInUse` was removed from the contract during review, and the warning now comes off the snapshot.** The first implementation had `JoinRoom` return a flag and the screen render it. Three things were wrong with that. It was a second source for a fact the snapshot already carries, since the Participants and their nicknames are in it. It was computed from the Room as read _before_ the write, so two people joining as Alice at the same moment would both have been told they were the first. And it vanished on reload while its cause did not, so the warning was a property of a moment rather than of the Room.

The screen now derives it from the one read it already has, which costs no call, survives a reload, and tells _both_ Alices rather than only the latecomer — closer to story 14's "two people called the same thing is a choice rather than an accident" than warning one of them was. `JoinRoom` returns `{ token }` and nothing else. The half of the criterion that is a domain rule — that a taken nickname does not refuse the Participant — stays at the seam as a test; the half that is a warning is presentation, and `spec.md` already accepts that the web app carries no tests.

Nicknames are compared case-insensitively, which no criterion asked for either way. Two people in a list as `Alice` and `alice` read as the same name to everyone looking at it, so treating them as a collision is what makes the warning mean anything.

**`viewerId` was renamed `selfId` during review.** `CONTEXT.md` lists "viewer" among the words to avoid for **Spectator**, and Spectator arrives in ticket 12 — so the first name would have had the snapshot calling one thing a viewer while the glossary reserved that word for something else, in a contract package where renaming later is a contract change.

**Participants come back in arrival order, and the order is total.** `snapshotOf` sorts by `joined_at` and breaks ties on the identifier, so a read is identical to the one before it and nobody shifts position on reload — which is what "same place in the list" asks for. Two Participants who join inside the same millisecond are ordered by identifier rather than by who was truly first; the timestamp has millisecond precision and no one can perceive the difference. A test caught this by joining twice without moving the clock, and what it proved was that the test asserted arrival order where the only promise is stability — so it now asserts membership, and the ordering test moves the clock between joins.

The ordering lives in `snapshotOf` rather than in each repository's query, so the rule has one home and both implementations stay ignorant of it.

**`joined_at` landed; `last_seen_at` did not.** Ticket 02 forecast that "ticket 04 is where the first timestamp (`last_seen_at`) lands, and the `Clock` belongs with it". The `Clock` did land, and it is injected as ADR 0006 requires — `ManualClock` in `testing` is what lets a test move time instead of sleeping, which ticket 05 needs. The column is `joined_at` rather than `last_seen_at` because arrival order is what this ticket reads a timestamp for. Every criterion that wants a last-seen time is on ticket 05 — the heartbeat, the activity window, the eviction — so a `last_seen_at` here would have been a column with no reader.

**The zod pipe arrived with the first request body, as ticket 02 said it would.** `ZodValidationPipe` is fed `joinRoomRequestSchema` from the shared package, so the API and the join form validate against the same declaration. Its messages are the schema's own, written for a human, because ticket 02's rule that library vocabulary never reaches the text people read applies to the API's `message` too: a missing or non-string nickname answers "A nickname is required." rather than zod's "expected string, received undefined", and a body that is not an object at all gets one sentence from the pipe. The field name stays in the message, so `nickname: A nickname cannot be empty.` says which field without reading like a stack trace.

`roomIdSchema`, `participantIdSchema` and `participantTokenSchema` are now one `nanoIdSchema(length)` rather than three copies of the same length-and-alphabet pair, so the alphabet cannot drift between them.

**A stale token recovers instead of dead-ending.** The API rejects a token it does not recognise, which is the criterion. On the client that would otherwise be a permanent error screen, since the bad token is in storage and goes out on every read — so `shared/api` forgets it and reads again without it, landing on the nickname form. No criterion asked for this; the alternative is a Room nobody can get into without clearing site data by hand, which happens as soon as a database is reset. The screen still draws from one read: the retry replaces the rejected read, it does not add to it.

A malformed `Authorization` header — one with no `Bearer`, or a scheme this app never sends — is read as no identity at all rather than as an error, so the worst it can do is ask for a nickname again.

**One divergence between the two repositories is known and left alone.** Adding a Participant to a Room that does not exist throws `RoomNotFoundError` from the fake and a raw Prisma error from the real one. Neither is reachable: `JoinRoom` resolves the Room first, and nothing in this system deletes a Room. Mapping Prisma's `P2025` would be error handling for a path no caller has, and it sits in the layer ADR 0006 leaves uncovered on purpose.

### How this was verified

`pnpm build`, `pnpm lint` and `pnpm format:check` pass from the root; the suite is fourteen tests in about a quarter of a second.

The database work was checked against a throwaway Postgres 17 in Docker rather than against Neon, so nothing deployed was touched. Both migrations applied in order to an empty database with `prisma migrate deploy`, and `migrate diff` against the result reports no drift, so the committed migration is what the schema describes. `participants` came out with the `(room_id, token_hash)` unique index and a cascading foreign key to `rooms`.

The whole flow was then driven with `curl` against that database. A Room reads with `participants: []` and `selfId: null` before anyone joins. Joining answers a 32-character token, trims the nickname, and the next read carries the Participant with `selfId` pointing at them; reading twice more returns the identical body, so a reload neither duplicates anyone nor moves them. A second Participant joining as `alice` is accepted and both appear. The revision goes 1 to 2 to 3 to 4 across three joins and never moves on a read. A token from one Room presented to another answers `401 unknown_participant`; a token nobody holds answers the same; an absent Room answers `404`; an empty, overlong, missing or wrongly typed nickname answers `400 invalid_request` with the schema's own sentence. Every error body was the shared error shape. The database was inspected directly: the column holds a sha256 digest and the issued token appears nowhere in it. CORS answers the configured origin on both the preflight and the real request, and sends no allow-origin header to a foreign one.

**The screens were clicked, which closes the gap ticket 02 left open.** The browser automation that would not connect for ticket 02 — and did not connect on the first attempt here either — was working by the end of this ticket, so the Room screen was driven by hand rather than only typechecked.

Creating a Room lands on `/r/:roomId` asking for a nickname, with the field focused and **Join the Room** disabled until the nickname validates, so the empty case is refused by the same schema the API validates against rather than by a second rule. Joining as `Alice` replaces the form with the Room: "You are in as Alice", one Participant, the row marked `you`, and the Room link with its copy button. Reloading the page returns exactly that — same nickname, same single row, no prompt — which is criterion 5 seen rather than inferred.

The nickname warning was checked the way the review's redesign made possible: a second Participant joined as `alice` through the API, and after a reload the note appeared for the _original_ Alice, who had joined first and whose own join response had said nothing. The flag this replaced could not have done that. The list read `Alice`, `alice`, `Bob` in arrival order with `you` on the first.

`localStorage` held exactly one key, `fibopoker.participant.<roomId>`, with a 32-character value, and nothing under any other Room's key. Planting a token the Room does not know and reloading produced the nickname form again with the key gone from storage, so the stale-token recovery is real and not just written down. A link to a Room that does not exist gives "No such Room". `cookie` appears nowhere in either app's source — only in the spec, ADR 0005 and a transitive dependency of Express.
