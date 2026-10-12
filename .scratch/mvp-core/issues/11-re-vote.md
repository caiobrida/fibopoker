# 11 — Re-vote carrying the title

**What to build:** After a Round is revealed and discussed, the team estimates the same task again. One action opens a fresh Round already carrying the title, so converging on a number is a normal part of the ceremony rather than a workaround.

The first Round survives intact. The record is supposed to show that the team started three apart and converged — that evidence is the interesting part, and reopening the old Round would destroy it.

**Blocked by:** 10 — Final Estimate and the next Round

**Status:** ready-for-agent

- [x] Re-voting a revealed Round opens a new Round carrying the same title
- [x] The previous Round and every Estimate in it are untouched
- [x] The history shows the task more than once, with each outcome
- [x] Re-voting never reopens an already-revealed Round

## Comments

**The title is copied by the server, which is the whole reason this is a use case.** A re-vote is
`OpenRound` with the title already known, so the cheap version is a button that reads the title
out of the snapshot it already has and posts it to `POST /rounds`. That was rejected for one
reason: a client-supplied title can disagree with the Round it claims to re-estimate. The third
criterion asks the history to show _the task_ more than once, and that identity only holds if the
two Rounds get their title from the same place. `ReVote` reads it off the Round being re-voted, so
"carrying the same title" is a guarantee rather than a convention. It also puts the behaviour at
the one seam ADR 0006 tests at, which the cheap version would not have.

**`POST /rooms/:roomId/rounds/:roundId/re-vote` takes no body at all** — there is nothing for the
caller to supply and therefore nothing to validate, which is the ticket's "one action" in the
shape of a request. It answers with the new Round's id, so it reuses `openRoundResponseSchema`.
Nothing was added to `packages/shared` and no error code was added either: the four refusals a
re-vote can meet are the four the Room already had.

**`freshRound` and `noRoundOpenIn` are extractions, not new concepts.** `OpenRound` and `ReVote`
differ only in where the title comes from, so the Round constructor and the one-Round-at-a-time
rule now live in `round.ts` and `room.ts` respectively and both use cases call them. The
room-lookup-then-`actingIn` preamble was left duplicated, because every use case in the package
already repeats it and making this pair the exception would be the inconsistency.

**`RoundStillOpenError`'s message had to grow a second half.** It read "a Final Estimate comes out
of the discussion a Reveal starts", which was true when `SetFinalEstimate` was its only caller and
actively misleading the moment a re-vote could raise it. It now names both.

**Resolving the Round before checking that nothing is open is deliberate.** Re-voting a Round that
is itself still open answers `round_still_open`, which says the useful thing; checking the Room
first would answer `round_already_open` about the very Round the caller named. Re-voting an older
Round while a newer one is open still answers `round_already_open`, correctly.

**Any revealed Round can be re-voted, not only the one on the table.** That falls out of resolving
by identifier — the same property `SetFinalEstimate` has — and a team that learns something at
task nine and wants task three again gets it for free. It has a test, because nobody asked for it
and it would be easy to break without noticing.

**Below the table the hand now has three moves, ordered by distance from the Round.** Record the
number you agreed on (the Deck), re-vote it, then open the next task. The Re-vote is a button and
a line of prose rather than a third form, because it is the only one of the three that needs no
input. Nothing new animates — the section sits inside `AfterTheReveal`'s existing `rising`.

**Verified against a throwaway local Postgres**, since no migration was needed: every migration
from the first still applies in order, and the whole ceremony was driven through the HTTP API —
a re-vote refused on an open Round (409), a re-vote by somebody who neither opened nor revealed
the Round, the re-voted Round still refusing an Estimate afterwards (409), a re-vote refused while
the next Round was open (409), an unknown Round (404) and a stranger (401). Then the same path in
the browser: 3 against 8, Re-vote, one click, same title, nobody voted, 5 and 5, Final Estimate 5
— and the history reading `The checkout flow — No Final Estimate` above `The checkout flow — 5`,
which is the record the ticket says is the interesting part.

**What was not checked:** the failure Alert on the Re-vote button renders only in a genuine race
(somebody else opens a Round between the poll and the click), which could not be staged reliably;
it is the same three lines as the Final Estimate's Alert directly above it. Phone width was not
re-verified either — the browser window would not resize — and ticket 14 is the layout pass that
owns it.
