# 08 — Open a Round and cast a hidden Estimate

**What to build:** Someone titles a Round with the task being estimated, everyone picks a card from the Deck, and nobody can see anyone else's choice. The screen shows who has already voted and how many of the people present that is — but never what anybody picked.

**Blocked by:** 06 — The Room is a table

**Status:** ready-for-agent

- [x] A Round can be opened with a title, and also without one for a quick unplanned vote
- [x] The Deck is a constant in the shared package, so the values the screen offers and the values the API accepts cannot diverge
- [x] An Estimate outside the Deck is rejected
- [x] A Participant holds at most one Estimate per Round, enforced by the database rather than by application code
- [x] Choosing again while the Round is open replaces the previous choice
- [x] Before the Reveal, others can see that a Participant has voted but not what they voted
- [x] The tally shows how many of the present Participants have voted
- [x] The Deck and every Participant's voted state are seated into the table from ticket 06, rather than placed beside it
- [ ] Verified across two browsers: each sees the other's vote registered and still hidden

The last box is the only one open, and it is a hand-check rather than work: two independent
identities were driven and each saw the other vote, but in one Chrome across two origins rather than
in two browsers. "How it was verified" says exactly what that does and does not cover.

## Comments

**Nobody else's Estimate is hidden — it is absent.** `RoomSnapshot` has no field that could carry
one. Each Participant comes back as `{ id, nickname, hasVoted }` and the Round carries
`selfEstimate`, the reader's own choice and nothing else, so hiding is not a filter somebody has to
remember to apply at the Reveal boundary. A filter is a line of code that can be deleted by
accident; a missing field is a compile error. The seam test asserts the negative directly — Bob
picks `☕`, and Alice's whole serialised snapshot is checked for the character.

**The tally is derived on the client, on purpose.** The snapshot carries who is present and whether
each has voted, which `spec.md` names exactly ("the present Participants with whether each has
voted"); "5 of 8" is a count of that list, not a second copy of it on the wire. Ticket 12 excludes
Spectators from the denominator by excluding them from the list, with no change to the payload.

**An Estimate is stored as a literal string, and the Deck is checked in the domain.** The wire
schema for a value is `z.string().min(1)` rather than `z.enum(DECK)`, because `spec.md` wants an
Estimate to keep telling the truth after the Deck changes: a Round from last month holding a value
today's Deck no longer offers must still parse. The Deck rule therefore lives in `CastEstimate` as a
typed domain error, which is also what makes it testable — ADR 0006 puts the only seam at the use
cases, and a rule enforced solely by a Nest pipe is a rule no test in this repo can reach.

**The Deck is drawn as your hand, under the ring and inside the table's composition.** The ticket
asks for it "seated into the table … rather than placed beside it", and the middle was already spoken
for: ticket 06 gave it to the Round's state, which is where the title and the tally now live. So the
Deck is a third region of `RoomTable` rather than a sibling panel in `RoomScreen` — it moves with the
table, it is bounded by it, and the cards sit where a hand sits at a real table. Each seat's Estimate
slot is the dashed placeholder ticket 06 reserved, filled in rather than re-homed.

**`revealed_at` lands here although nothing in this ticket writes it.** `CONTEXT.md` defines a Round
as open or revealed, and the snapshot's single `round` field means "the open one" — which needs the
concept to exist before the feature does. The alternative was to define the current Round as "the
only Round", which is a sentence the domain never says and which ticket 10 would have had to migrate
away from. Ticket 09 writes the column; ticket 08 only reads it.

**Only the open Round takes an Estimate, and that is structural rather than a check.** `CastEstimate`
resolves the Round through `openRoundOf` and compares the identifier, so a Round that is not the open
one is simply not found. The first draft looked it up by id among all Rounds and left the refusal to
ticket 09 — which would have handed 09 a `upsert` that silently rewrites a revealed Round's Estimates
unless somebody remembered. There is now one way to reach a votable Round and it is "the open one";
ticket 09 inherits a closed door and can refine the refusal from a 404 to something that says
"revealed" once it has a way to produce that state.

**Opening a second Round is refused, which nothing asked for.** It is what keeps the snapshot's
single `round` field honest: two open Rounds and the field is a lie about which one you are voting
in. 409, the open Round untouched, the revision not advanced.

**Acting in a Room is not a heartbeat.** The first draft marked the opener and the voter as seen,
reasoning that voting is stronger evidence of presence than reading. That is true and it is still the
wrong rule: ADR 0008 makes presence a thing reads compute, and a second source of it means two places
to look when somebody is wrongly absent. The window it guarded closes on the client's own next poll,
which its own mutation triggers by invalidating. A test now pins the absence of the behaviour, the
way ticket 05 pinned that a read does not bump the revision.

**Ticket 05's cadence debt is paid.** That ticket shipped "fast while the revision is moving" as a
proxy for "fast while a Round is open" and wrote down how the proxy was wrong: a team discussing for
longer than the hysteresis drops to 8s and the next vote lands up to eight seconds late. `Cadence`
now knows whether a Round is open. Measured both ways below.

**The Deck goes inert while a cast is in flight**, so two clicks cannot race to decide what the
server stores last. On localhost this is invisible; on Vercel and Neon it will be a few hundred
milliseconds of the hand at reduced opacity on every vote, and whether that reads as "the table is
taking your card" or as a flicker is a judgement to make on the deployed app. The alternative trades
that for a rare wrong card, so it is a real trade rather than an oversight.

**The suite caught a flaky test of its own.** `aRoomBeingEstimated` joined two Participants at one
`ManualClock` instant, and `byArrival` breaks that tie on `id.localeCompare`, which is a random
`nanoid` — so the expected order was a coin flip that had been landing heads. The helper now advances
the clock between joins, the way `join-room.spec.ts` already did. Worth knowing for every later
ticket that seeds a Room: same instant means undefined order.

## How it was verified

`pnpm build`, `pnpm lint` and `pnpm format:check` pass from the root. The suite is 48 tests in under
half a second, 26 of them new, and it was run three times over to confirm the flake above is gone.

**The database was checked against a throwaway Postgres 17 in Docker**, not against Neon. All four
migrations applied in order to an empty database and `migrate diff` against the result reports no
difference, so the committed migration is what the schema describes. The invariant the ticket wants
in the database really is in the database: `estimates` has `(round_id, participant_id)` as its
**primary key** rather than a surrogate id with a unique index, and a duplicate row inserted by hand
in `psql` is refused with `duplicate key value violates unique constraint "estimates_pkey"`. There is
no second Estimate for a Participant to be had, from application code or from anywhere else.

**The whole surface was driven over HTTP** against that database. A Round opens with a title and
without one; a second one is refused with 409 and leaves the open Round and the revision untouched;
opening without a token is 401; a value outside the Deck is 400 `invalid_estimate`; a Round
identifier the Room does not hold is 404; a title over 120 characters is 400 from the shared schema.
Casting, then casting again, leaves one row in `estimates` with the second value.

**`☕` round-trips.** It is stored as `e29895` and comes back as `☕`, checked at the bytes in
Postgres and at the codepoint in the browser. This was worth checking rather than assuming: an
earlier attempt appeared to store `?`, which turned out to be the shell mangling a `curl` argument
rather than anything in the app — but the only way to know which it was, was to look.

**Two independent identities in the browser, each seeing the other.** Alice on `localhost:5173` and
Bob on `127.0.0.1:5173` — different origins, therefore different `localStorage`, therefore different
tokens, which is the arrangement that matters here. Bob picks `☕`; Alice's screen shows his seat
filled and the tally move with no reload, and the snapshot her tab received contains no `☕` anywhere
— asserted over the raw response text, not over the rendered DOM. The mirror holds: Bob sees Alice
voted and never her `3`. A reader with no token at all sees both as voted and `selfEstimate: null`.
Alice changing `8` to `3` leaves the tally at 2 of 2 and one row in the database.

Incidentally confirmed on the way past: presenting Bob's token to Carol's Room answers 401. That is
`spec.md`'s "a token for Room A must be useless on Room B", seen rather than argued.

**Both polling tiers were measured, not inferred.** With a Round open and the Room unchanged far past
the ten-poll hysteresis, the gaps were 2010, 2003, 1997, 1998, 1992, 2011, 1990, 1997, 2005 ms; with
no Round open, the same nine gaps followed by 8998, 9007, 8998. The absolute figures are inflated
because Chrome clamps timers in a tab that is not painting, which rounds the 1.5s ask up to the next
second — but that is exactly why the comparison is the proof: the live tier and the idle tier are
plainly different numbers, and an open Round holds the first one where the old `Cadence` would have
dropped to the second.

**The motion rules from ticket 06 and ADR 0009 still hold.** Across five polls of an unchanged Room
the animation count does not move and no transition is created. With the duration tokens forced to
`0ms` — which is all `prefers-reduced-motion` does — the card and slot transitions compute to `0s`
and a voted slot is still fully, visibly voted. No literal colour, duration, spacing or radius
appears in any of the new CSS.

**At a full table it reads.** Eight seats, five of them voted: the filled slots are findable in one
sweep and the three dashed ones are plainly empty, without the green shouting. That is the
calibration ADR 0004 asked for, now recorded there.

**Two things could not be checked this way.** The literal two-browser pass is still open — the
automated browser drives one Chrome, and two origins give separate storage and separate tokens but
not a separate browser. `pnpm dev` with Chrome and Edge is five minutes and closes the last box.
And the motion was again verified by its mechanics rather than watched: the automated tab never
paints, and Chrome freezes animations in exactly that state, which is the fact ticket 06 had to
design around in the first place.

## From the review

Two axes were reviewed. Neither found anything that would have reached a user, and both found real
things; the fixes are in the same branch.

**The spec axis found the hole ticket 09 would have fallen into** — `CastEstimate` resolving a Round
by id among all of them, described above. It also caught that `round.title ?? 'A quick vote'`
invents a task name for a Round that deliberately has none: another Participant arriving later
cannot tell the difference between a title somebody typed and one the app made up. An untitled Round
now says "An untitled Round" in secondary weight and colour, which no one will read as content.

**The standards axis caught ADR 0004 going out of step**, which it explicitly asks not to happen —
`tokens.css` gained the voted colour and the ADR's table did not. Both rows are in, and the paragraph
that left the state colours open now records the voted one and leaves divergence to ticket 09.

**It also caught `card` sitting on `CONTEXT.md`'s avoid list** for both Estimate and Deck, while the
code grew `EstimateCard` and `--card-width`. The resolution is ticket 06's own: a card the screen
draws is furniture, exactly as the table is furniture inside a Room, and `CONTEXT.md` now says so
rather than leaving the next reader to resolve the clash.

**Three duplications were named and two were taken.** The use-case preamble that resolves a token to
a Participant became `actingIn`, and the three JSON writes in the web client became `sendJson`. The
third — that the mutation hooks share a shape — was declined: each one's value is its named action
(`join`, `open`, `cast`), and what they share is three lines of TanStack boilerplate, so collapsing
them would buy an abstraction whose only job is to hide `useMutation`.

**One name was genuinely wrong and the first fix made it worse.** The shared type for the Round
inside a snapshot was `OpenRound`, colliding with the `OpenRound` use case and reading as a command.
Renaming it to `Round` follows the precedent `Participant` already sets — the same noun in two layers,
which never confuses anyone because the two never meet in one file — but it then collided with the
`Round` component. The component is `RoundInTheMiddle`, which is what ticket 06 called that slot.

**Declined, with the reason.** `Cadence.noticed` takes a `RoomSnapshot` and reads `revision` and
`round` off it, which the review called mild Feature Envy. Handing it `{ revision, estimating }`
instead would move the decision "an open Round means poll fast" out to the call site, and that
decision is the one thing `Cadence` exists to hold.
