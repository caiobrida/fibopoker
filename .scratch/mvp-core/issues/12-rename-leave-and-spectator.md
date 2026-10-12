# 12 — Rename, Leave and Spectator

**What to build:** The three ways a person adjusts their own presence in a Room.

**Rename** fixes a nickname typed in a hurry without costing anyone their vote. **Leave** is the actual logout: it clears the local identity so the next visit asks for a nickname again, which is what keeps a shared machine from ever needing a private browsing window. **Spectator** lets whoever brought the work be present and answer questions without their opinion anchoring the team's numbers.

Leaving is deliberately asymmetric about Estimates, and that asymmetry is the point: the tally must stop counting someone who is gone, while history must not be rewritten because somebody closed a browser.

**Blocked by:** 09 — Reveal a Round

**Status:** ready-for-agent

- [x] Renaming keeps identity, position in the list and any Estimate in an open Round
- [x] Leaving clears the local identity, so the next visit to that link asks for a nickname
- [x] Leaving removes the Estimate from an open Round, so the tally stops counting an absent person
- [x] Leaving keeps Estimates in revealed Rounds
- [x] Two people can use one browser in sequence with no private window
- [x] A Spectator is present but never in the tally — neither in the numerator nor the denominator
- [x] A Participant can switch between voting and spectating
- [x] Switching out of voting is refused in an open Round where they have already voted, since it would silently drop a counted vote

## Comments

**Leaving is written down rather than inferred, and that is a new rule**, so it is recorded as
[ADR 0010](../../../docs/adr/0010-leaving-is-written-down.md) rather than only here. ADR 0008 said
presence is derived and nothing writes "Alice left"; a departure now does, because the promise
that makes the activity window work — a returning tab is re-admitted by the read that brings it
back — is exactly the promise a deliberate leave must not get. The token is still in the browser,
so a departure left to a stale `last_seen_at` would be undone by the next poll, or worn by the
next person to sit down at that machine.

**The Participant row outlives the Participant, because `estimates.participant_id` cascades.**
Deleting the row on the way out would take every Estimate that person ever cast with it,
including the revealed ones, which is the opposite of the asymmetry this ticket exists for. So
`left_at` is set and exactly one Estimate — the one in the open Round — is deleted, both in the
same transaction, bumping the revision once.

**The asymmetry is a `where` clause, not a branch in the use case.** The delete requires the Round
to be unrevealed, so somebody pressing Reveal between the read and the write costs nothing: the
delete matches nothing, every Estimate stays, and the departure still succeeds. The alternative —
resolving the Round in the use case and raising on a revealed one — would fail somebody's leave
because a teammate clicked a button. Leaving always works; a revealed Round never changes. The
in-memory repository carries the same predicate, so the test seam cannot disagree with Postgres
about which one wins. It was briefly written to throw instead, which would have made the fake
lie about the only behaviour ADR 0006 leaves uncovered.

**Spectating needed two refusals, and they are what keep the tally arithmetic honest.** A
Spectator is refused the Deck (`spectator_never_estimates`), and a Participant holding a counted
vote is refused the switch into spectating (`estimate_already_cast`) — the second is the
ticket's last criterion, the first is what stops the first criterion from being reachable
sideways. Together they mean a Spectator can never hold an Estimate in an open Round, so "0 of 1
voted" can never be a Room where two people have voted. Both are 409: the request is well formed
and the Room is simply not in a state that accepts it.

**A Spectator still runs the session.** They open Rounds, reveal them and record the Final
Estimate; only the Deck is closed to them. `CONTEXT.md` defines a Spectator as "present without
estimating", and the Final Estimate is agreed by people rather than estimated — it is the number
the team settled on, which is usually read out by whoever brought the work. Refusing it to them
would have made the role useless to the only person it was written for.

**The tally's two halves are filtered in the browser, not carried in the snapshot.** The contract
gained `spectating` on each Participant — the seat needs it anyway to draw itself — and
`RoundInTheMiddle` filters once before counting. Putting a ready-made `voted of voting` in the
snapshot was the alternative, and would have moved the arithmetic inside the tested seam; it was
rejected because the snapshot is deliberately the Room's state and not its presentation, and
because the same filter would still be needed for the seats. The cost is real and worth naming:
by ADR 0006 the web app has no tests, so this one line is checked by eye.

**Three endpoints under `/participants/me`** — `PUT …/nickname`, `PUT …/spectating`, and
`DELETE …/participants/me`. `me` rather than a Participant id because the token already is the
identity, and because an id in the path invites renaming or removing somebody else, which
`spec.md` puts out of scope. These three finish the **API surface** list rather than extending it:
"rename oneself; leave; switch between voting and spectating" are the last three of the ten
operations that paragraph names, which ticket 11's re-vote already made eleven. Eleven routes,
each a different verb on a different thing a person controls.

**The Join button was wired to a past mutation, and Leave is what exposed it.** It was disabled on
`mutation.isSuccess`, which is true forever after the first successful join — so the second
person at a shared machine found the form filled in and the button dead, which is the fifth
criterion failing in the only place it matters. It now reads the Room's own answer to "are you
already in", the `leaving` flag the panel already received. Found by clicking it, not by reading
it: the API had been answering this case correctly all along.

**Verified against a throwaway local Postgres**, both ways a migration can be wrong. From empty:
every migration from the first applies in order and leaves the schema in sync. On a populated
database: a Room and a Participant were inserted with the five earlier migrations applied, then
this one, which backfilled the existing row to `spectating = false, left_at = null` — a voter who
has not left, which is what an upgrade must mean for everybody already in a Room.

Then the whole ceremony through the HTTP API: a rename keeping the same `selfId` and the same
place in the list, an empty nickname refused (400), spectating refused on a counted vote (409)
with the Estimate still on the table afterwards, spectating accepted once the Round was revealed
with both Estimates still on the record, a Spectator's Estimate refused (409), the tally reading
1 of 1 with two people at the table, a leave spending the token (401 thereafter) and taking its
open-Round Estimate while the revealed one stayed in the database, a new Participant joining
afterwards, and all three endpoints answering 401 to a token from another Room and to no token
at all.

Then the same path in the browser, which is where the Join button bug surfaced: rename to "Alice
from Design" and watch the seat follow, vote, be refused the switch, reveal, spectate — the seat
losing its card outline and gaining a "spectating" line, the tally dropping to 0 of 1 with two
seats at the table — open the next Round as a Spectator and find the Deck replaced by a sentence,
join the voting and get it back, leave and land on the nickname form, then join as somebody else
in the same browser with no private window and no reload.

**What was not checked:** the rename and leave failure Alerts render only on a genuine race
(leaving twice, or renaming after the Room forgot you), which could not be staged reliably; they
are the same three lines as the spectating Alert directly above them, which was seen. Phone width
was not re-verified — ticket 14 owns it — though the seat is now at its tallest with a long
nickname, "you" and "spectating" stacked under a revealed Estimate, which is the case that pass
should look at.

**What the review moved.** `isPresent` became `hasNotLeft`, because `presentAt` in the same module
already means the activity window and two presences in one file is one too many — the pair now
reads the way ADR 0010 describes them, one clause stored and one derived. `roundHoldingAVoteBy`
became `roundHoldingAnEstimateBy`: it returns the Round holding an Estimate, and `CONTEXT.md`
keeps "vote" off that noun. `Rename` became `RenameSelf`, which the controller had been admitting
by aliasing the injected field. `EntryPanel`'s `leaving` prop became `seated`, since it now also
gates the Join button and "you are already in" is what it actually asks. `RenameAction.renamed`
went the way of `joined`, for the same reason.

**Two findings were declined.** Collapsing `rename` and `setSpectating` into one
`updateParticipant(roomId, participantId, patch)` would halve four short methods, and would also
be the first repository operation that does not name what it writes — a caller could set
`left_at` without the Estimate withdrawal that has to share its transaction. `revealRound` and
`setFinalEstimate` are already a near-identical pair in the same file for the same reason.
Extracting the `findById` → `RoomNotFoundError` → `actingIn` preamble, now in eight use cases
of eleven, is the better of the two and is getting harder to argue against — but ticket 11 ruled on
it deliberately, and reversing that is a sweep across every use case rather than three new ones.

**The Spectator's empty slot fades rather than vanishing**, which is why it is
`border-color: transparent` and not `border-style: none`. `.estimate` already transitions its
border colour over `--duration-settle`, so the card outline melts away when somebody starts
spectating and draws itself back when they rejoin the voting; `none` would have snapped both ways.
ADR 0004's rule is about colour decisions, and an absence is not one — the `#` grep the plan asks
for still comes back empty on that file.
