# 09 — Reveal a Round

**What to build:** When the team is ready, any Participant reveals, and every Estimate appears at the same moment. Identical values are grouped together and the highest and lowest are highlighted, because the disagreement is the reason to talk.

Nothing reveals on its own, and nobody has a special right to do it — a session must never stall waiting for one particular person to be at their keyboard.

**Blocked by:** 08 — Open a Round and cast a hidden Estimate

**Status:** ready-for-agent

- [x] Any Participant can reveal; there is no host and no permission check
- [x] Nothing reveals automatically
- [x] Revealing is possible before everyone has voted, so one absent teammate cannot block the team
- [x] Every Estimate becomes visible at the same instant, with no window in which someone could adjust after seeing a number
- [x] A revealed Round refuses new and changed Estimates
- [x] Revealing an already-revealed Round is an error
- [x] Identical values are grouped rather than listed one per Participant
- [x] The highest and lowest Estimates are visually distinguished
- [x] No average or median appears anywhere on the screen
- [x] The Reveal reads as one moment across the table; ticket 15 refines the choreography but the integrity rule above is settled here

## Comments

**The snapshot's Round became a discriminated union, and that is the whole integrity story.** An
open Round carries `selfEstimate` and no `estimates`; a revealed one carries `estimates` and no
`selfEstimate`. There is no shape in between, so "every Estimate becomes visible at the same
instant" is not a rule anybody has to remember at the Reveal boundary — it is the only shape the
type system will let the snapshot take. Ticket 08 made hiding structural by giving the payload no
field that could carry somebody else's Estimate; this is the same move one state further on. It
cost the existing specs a compile error apiece, which is the point: `snapshot.round?.selfEstimate`
stopped type-checking everywhere, and every call site had to say which state it meant.

**`round` now means the current Round, not the open one.** Ticket 08 wrote down that the single
`round` field means "the open one", which would have made a revealed Round vanish off the table the
instant it was revealed. `currentRoundOf` is the last Round the Room holds. `openRoundOf` survives
unchanged for `OpenRound`, which still needs "is one open right now?" to refuse a second.

**Ticket 08 left a closed door and asked 09 to refine the refusal.** It did: `openRoundIn(room,
roundId)` resolves a Round by identifier and then by state, so a Round this Room never held is a
404 and one it has already revealed is a 409 that says `round_already_revealed`. `CastEstimate` and
`RevealRound` share that one door, which is why "a revealed Round refuses new and changed Estimates"
needed no new check in `CastEstimate` at all — it inherited the refusal by changing which lookup it
used.

**Revealing takes `actingIn` and nothing else.** That one line is the whole of "any Participant can
reveal; there is no host and no permission check" — it establishes that the caller is _in_ the Room
and then asks nothing further. The absence is the feature, so there is a test pinning it: Bob, who
neither opened the Round nor voted in it, reveals.

**Nothing reveals on its own is a negative, so it is tested as one.** A Round in which every
Participant has voted is still open until a human calls `RevealRound`. That test passes today for a
trivial reason and would fail loudly the day somebody adds an "everyone has voted, so…"
convenience.

**The wire never says who voted first.** Revealed Estimates are sorted by Participant, not by
`castAt`. Without that, the array order is insertion order, which is voting order — the Reveal would
leak the very thing the hidden phase exists to protect, in the payload rather than on the screen.
The sort is a plain string comparison rather than `localeCompare`, which the rest of the file uses
as a tiebreak: `localeCompare`'s `ignorePunctuation` default is locale-dependent (it is `true` for
`th`), and nanoid's alphabet contains `-` and `_`, so under such a locale two distinct identifiers
could compare equal — and a comparator that returns 0 falls back to insertion order, which is cast
order. Checked rather than assumed, and it is why the guarantee now lives in the comparator instead
of in an Intl default.

**Grouping and the extremes are derived on the client**, following ticket 08's reasoning about the
tally: the snapshot carries the facts, the screen derives the presentation. The wire carries a flat
list of `{ participantId, value }`, which the table reads twice — once to fill each seat, once to
group the middle. Two derivations, one fact on the wire.

**Comparable means "reads as a number", not "is in the Deck".** `CONTEXT.md` says an Estimate keeps
telling the truth after the Deck changes, so a Round from last month may hold a value today's Deck
no longer offers. Ranking by `DECK.indexOf` would score that `-1`; `Number(value)` ranks it
correctly and makes `?` and `☕` incomparable for free, which is exactly right — neither is ever an
extreme. Groups sort numerically first, then the non-numbers in Deck order, so the row reads like
the Deck does.

**Unanimity wears the voted green rather than two highlighted extremes.** When the numbers agree
there is no disagreement to point at, and highlighting both ends of a single value would invent a
conflict. ADR 0004 already said the voted colour carries consensus later for the same reason it
carries voted now; this is that later. A Round holding one lone Estimate reads the same way.

**The extremes are marked on the seats as well as in the middle**, which the review had to point
out. The first draft coloured only the grouped row and left every revealed seat neutral, on the
reasoning that a coloured ring would read as a traffic light. That reasoning was answering the
wrong question: `spec.md`'s story 35 asks for the extremes highlighted "so that **the people** who
should explain their reasoning are obvious immediately", and a number in the middle makes you read
a value and then hunt the ring for whoever holds it. The seat and the group now share one colour
language — clay for an extreme, green for agreement, neutral in between — computed once by
`standingOfEachValue` so the two can never disagree.

**The extremes are not carried by colour alone.** Each group states its standing in its accessible
name — "3, chosen once, the lowest" — because "visually distinguished" via two low-saturation
colours is a signal a colour-blind reader would not get. ADR 0004's claim is that the eye reads
colour faster than numbers, which is about speed, not about colour being the only channel.

**Agreement needs more than one person to agree.** A lone Estimate, or one number beside two `?`s,
used to wear the consensus green and say "agreed" — which is a claim nobody made. `agreed` now
requires both that no number diverges and that more than one Participant gave that number;
otherwise the group is neutral.

**The reveal failure is only shown while the client still thinks the Round is open.** Two people
saying "ready? reveal!" and clicking together is a normal moment in a real session, and the loser
gets a 409. Once their own poll brings the revealed Round there is nothing left to report — they got
what they asked for — so the Alert is guarded on `round.state === 'open'` and disappears on its own.
Driven in the browser rather than reasoned about.

**A refused Estimate is always said, and that is the opposite of the rule above.** The two races
are not symmetrical. Somebody who loses the Reveal race got what they asked for — the Round is
revealed — so the message is noise. Somebody whose Estimate is refused because the Round was
revealed mid-click did **not** get what they asked for, and their seat will sit empty beside four
numbers; telling them is the whole point. The first draft gated both alerts the same way and would
have swallowed the second. Only the reveal alert is gated.

**The Deck is not rendered at all once the Round is revealed**, rather than rendered disabled. A
Deck exists to be picked from and a revealed Round has nothing to pick; ten greyed cards under a
revealed table are noise. This also means `Deck`'s `disabled` prop lost its `round === null` arm,
because the open Round is now the only state that draws it.

**`Cadence` had to learn the difference.** It polled fast while `round !== null`, which after this
ticket would mean "fast forever once a Round has ever been opened", since a revealed Round stays on
the table. It now asks for `state === 'open'`. Seen in the browser: with the Round revealed the tab
drops to the idle tier, which is why a later Round opened behind its back took a few seconds rather
than a few hundred milliseconds to appear.

**One duplication was taken.** `client.ts` checked `response.ok` and threw in three places; that is
now `successful(response)`, with the reveal call the fourth caller. The three mutation hooks still
share a shape and are still left alone, for the reason ticket 08 gave: what they share is three
lines of TanStack boilerplate.

**A dead end ships with this ticket, knowingly.** Once a Round is revealed there is no way forward
in the interface — opening the next Round is ticket 10 and re-voting is ticket 11. The API already
allows it and the table clears correctly when the next Round arrives (verified by opening one over
HTTP and watching both browsers follow), but no button offers it yet.

## How it was verified

`pnpm build`, `pnpm lint` and `pnpm format:check` pass from the root. The suite is 69 tests in under
half a second, 21 of them new.

**No migration was needed and that was confirmed rather than assumed.** Ticket 08 landed
`revealed_at` ahead of the feature that writes it. All four migrations were applied in order to a
throwaway Postgres 17 in Docker and `migrate diff` against the result reports **"No difference
detected"**, so the committed migrations still describe the schema the code expects.

**The whole surface was driven over HTTP** against that database. A Participant who neither opened
the Round nor voted in it reveals successfully (204). Revealing again is 409
`round_already_revealed`; so is a new Estimate after the Reveal, and so is changing one — and the
Estimate the Round already held is still the one in the database afterwards. Revealing without a
token is 401. A Round identifier the Room does not hold is 404 `round_not_found`. A Round holding no
Estimates at all reveals fine and comes back as `"estimates":[]`.

**Both races were driven against real Postgres, which is the layer the suite cannot reach.** Two
Reveals fired together answer `204` and `409` on every trial, never a 500, and exactly one row ends
up with `revealed_at` set.

The cast-versus-Reveal window needed a deterministic setup, because fired together the Reveal always
commits before the cast even reads, and the domain check catches it at the front door. Holding a
Reveal open in `psql` — bump the revision, set `revealed_at`, `pg_sleep`, then commit — puts the cast
exactly where the bug lives: it reads the Round as open (the Reveal is uncommitted and invisible at
`READ COMMITTED`), passes the domain check, then blocks on the Room row lock until the Reveal
commits. **Without the guard that answers `200` and the revealed Round ends up holding `[3,8]`.**
With it, `409` and `[3]`, three trials each. That red run is the only evidence available for this
code path, since ADR 0006 leaves the Prisma repository uncovered by design — so it was produced
rather than argued, including re-killing the old process after `pkill` silently failed and left the
fixed build serving a "red" run.

**The order on the wire is not the order of the votes, measured on real identifiers.** Cast order
was Alice, Bob, Carol; the revealed array came back `PqHNl6wyhh5f`, `UbHyrNqZby5R`, `bTE1BqNiQ5Tu` —
ascending by identifier, with the first voter last. Before the comparator was changed this same
check returned the `localeCompare` ordering, which is how the punctuation-collation problem above
was noticed at all.

**`☕` round-trips through the Reveal**, checked at the bytes in Postgres (`e29895`) and at the
codepoint after parsing the response as UTF-8 (`0x2615`). Worth doing the slow way: the terminal
rendered it as `?` and an intermediate check reported `0xe2 0x2dc 0x2022`, both of which are console
encoding rather than anything in the app — exactly the trap ticket 08 recorded.

**Two independent identities in the browser.** Alice on `localhost:5173` and Bob on
`127.0.0.1:5173` — different origins, therefore different `localStorage`, therefore different
tokens. Carol and Dave were seated over HTTP to get a four-sided table.

- Before the Reveal, with all four voted, Alice's own authenticated response contains no `21`, no
  `"8"`, and **no `estimates` key at all** — asserted over the raw response text in her tab, not
  over the DOM. Every seat's accessible name reads "has voted" and every slot is empty.
- Bob reveals. Alice's tab follows with no reload: her seat shows `3`, Bob's `8`, Carol's `8`,
  Dave's `21`, and the middle shows `3` · `8 ×2` · `21` with `3` and `21` in the divergent clay.
  Grouped, not listed one per Participant.
- Then Alice reveals a second Round, so both directions of the two-browser check are covered. All
  four picked `5`: one group, `5 ×4`, in the consensus green, nothing marked as an extreme.
- A third Round mixed `2`, `13`, `?` and `☕`. `2` and `13` are the extremes; `?` and `☕` are
  neutral and the row reads in Deck order. The accessible names are "2, chosen once, the lowest",
  "13, chosen once, the highest", "?, chosen once", "☕, chosen once".
- That third Round also walked into `spec.md`'s own edge case without being set up for it: Carol and
  Dave had dropped out of the activity window by then, so the screen showed **4 Estimates and 2
  Participants in the Room**. "A revealed Round may well show more Estimates than that denominator"
  — seen rather than argued.
- The race was driven deliberately: Carol reveals over HTTP, then Bob clicks Reveal. He gets the 409
  Alert, and it clears by itself when his poll brings the revealed Round. His tab was hidden at the
  time, so that took the 30s background tier rather than the 1.5s one — which also confirms the
  background tier still applies to a revealed Room.
- `average`, `median` and `mean` appear nowhere in the rendered text of any revealed screen.

**The three colour cases were re-checked in the browser after the review's seat change.** A spread
of `3`, `8`, `8`, `21`: Alice's and Dave's seats compute to `rgb(80, 55, 43)` with the labels
"Alice, estimated 3, the lowest" and "Dave, estimated 21, the highest", Bob's and Carol's stay
neutral, and the middle reads `3` · `8 ×2` · `21`. Unanimous `5`: all four seats and the single
group compute to `rgb(43, 64, 52)`, "chosen 4 times, agreed". One `5` beside two `?`s: every seat
neutral, groups "5, chosen once" and "?, chosen 2 times", and the string "agreed" appears nowhere in
the document — which is the case that used to overclaim.

**The motion rules hold.** With the duration tokens forced to `0ms` — which is all
`prefers-reduced-motion` does — the revealed group list computes to `animation-duration: 0s` at full
opacity and the seat slots to `transition-duration: 0s` with their values still rendered and fully
legible, because the `rise` keyframe ends at the resting state. Across six polls spanning twelve
seconds of an unchanged revealed Room the animation count never moved, none was running, and no
transition was ever created.

**No literal colour, duration, spacing or radius appears in any new or changed CSS**, and every
custom property the new CSS reads resolves to a declaration in `tokens.css` — except `--seat-x` and
`--seat-y`, which are the per-seat placement values ticket 06 sets inline and are not design tokens.

**Two things were not checked this way.** No second browser engine ran — the automated browser
drives one Chrome, and two origins give separate storage and separate tokens but share a renderer;
ticket 05 ran Chrome and Edge and nothing here is engine-sensitive. And the Reveal was again
verified by its mechanics rather than watched: the automated tab never paints, and Chrome freezes
animations in exactly that state. Screenshot capture on one of the two tabs also started timing out
part way through the session while JavaScript kept executing normally, so the last two cases were
confirmed through the DOM and from the other tab.

## From the review

Two axes were reviewed. Both found real things, and between them they found a hole in this ticket's
headline rule that would have reached a user. The fixes are in the same branch.

**The spec axis found the window the ticket exists to close.** `CastEstimate` resolved the Round,
found it open, and then wrote in a separate transaction — and `castEstimate` carried no condition on
the Round's state at all. A cast that read before a Reveal committed would write its Estimate onto
the revealed Round. That is "A revealed Round refuses new and changed Estimates" and "no window in
which someone could adjust after seeing a number", both defeated, by the one interleaving the
feature is supposed to make impossible. Both repositories now refuse inside the transaction:
`stillOpen` re-reads the Round after `bumpingRevision` has taken the Room's row lock, so the check
sees every Reveal that committed before it. The lock was already there — every mutation goes through
it — which is why the fix is a read in the right place rather than new machinery.

**The standards axis found the same bug from the other side**, as a divergence between the two
implementations of one interface: the in-memory fake set `revealedAt` unconditionally while Prisma
guarded with `revealedAt: null` and threw `P2025` on a miss — not a `DomainError`, so a concurrent
double Reveal answered **500** rather than 409. ADR 0006 says the fake earns the repository
interface by being its second implementation; a fake more permissive than the real thing makes the
race unmodellable at the only seam this project tests. The fake now enforces the invariant too,
`revealRound` uses `updateMany` and raises `RoundAlreadyRevealedError` on a zero count, and two seam
tests drive both races — they fail without the guards, which was checked rather than assumed.

**Three more findings were taken.** `shown` named the revealed Estimates and `show` is on
`CONTEXT.md`'s avoid list for Reveal. `theOpenRound` and `theRevealedRound` had become three copies
of one narrowing helper and moved to `testing/snapshot-rounds.ts` — they assert the shared contract
rather than carrying fixture data, which is what makes them worth sharing. `client.ts` had two
styles for one ok-check.

**Two were declined, with reasons.** `aRoomBeingEstimated` stays duplicated per spec file: it is
fixture data, not a shared rule, and a Room shaped for the Reveal's sake should not be able to break
ticket 08's tests. And `deckPosition` stays in the web app rather than moving beside `isInTheDeck` in
the shared package — it is only ever reached for values that are not numbers, so it orders `?` and
`☕` for display rather than stating a general fact about the Deck, and the shared package holds the
contract both apps must agree on.

**One finding dissolved rather than being declined.** `Standing` was flagged as exported for nobody;
it is now the type the seats carry.

## From the deploy

**The pull request's three GitHub workflows passed and Vercel's deploy of the API failed**, on a
line the whole local toolchain accepts. `nest build` finishes, and then Vercel's Node builder runs a
type-check of its own which does not honour the `target` in our tsconfig: `currentRoundOf`'s
`rounds.at(-1)` came back as `TS2550: Property 'at' does not exist on type 'Round[]'`, with the
error's own hint pointing at `lib`.

The condition is reproducible locally — `tsc --target ES2019 --lib ES2019` raises the identical error
at the identical line and column — so the fix was verified red and green rather than guessed at by
deploying twice. `apps/api/tsconfig.json` now states `"lib": ["ES2023"]`, which an explicit setting
makes immune to whatever `target` the builder forces.

Declaring the library beat rewriting the expression, because the expression was not the problem:
`origin-patterns.ts` already used `replaceAll`, one library version away from breaking the same way,
and every ES2022-or-later builtin a future ticket reaches for would have been the same trap. The
only honest reading of a deploy that compiles against a library older than the one the repo targets
is that the library needed saying out loud.
