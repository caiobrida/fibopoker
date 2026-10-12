# 10 — Final Estimate and the next Round

**What to build:** After the discussion the team records the number they agreed on, then opens the next Round and keeps going. This is what closes the ceremony's loop and turns a Room into a record of what the session actually decided.

The Final Estimate comes out of people talking, so it is typed in — never derived from the Estimates on screen.

**Blocked by:** 09 — Reveal a Round

**Status:** ready-for-agent

- [x] A Final Estimate can be recorded on a revealed Round
- [x] The Final Estimate is the only thing writable after a Reveal; Estimates stay immutable
- [x] A Round can be revealed and moved on from without a Final Estimate ever being set
- [x] The next Round can be opened, with no limit on how many Rounds a Room holds
- [x] Finished Rounds are listed with their titles and Final Estimates
- [x] The Final Estimate is entered by a person and never computed from the Estimates

## Comments

**"Typed in" was resolved to "picked from the Deck", and it was the maintainer's call rather than
a reading of the ticket.** The sentence above says the Final Estimate is typed in; `CONTEXT.md`
defines an Estimate as "the Deck value a Participant picks" and a Final Estimate only as "the
single value a team settles on", and that difference looked deliberate enough not to guess at. It
went the other way: the Final Estimate is a Deck value. The Deck is a shared constant precisely so
the values the screen offers and the values the API accepts cannot disagree, the product estimates
in Fibonacci points, and ticket 13's export is only worth pasting into a board if what it carries
is a point value rather than "8 or 13". The load-bearing half of the sentence — _never derived
from the Estimates on screen_ — is untouched, and has a test of its own: a Round where the whole
Room voted 5 still reveals with `finalEstimate: null`.

`?` is therefore a legitimate outcome, and it is the one the team needs most: "we cannot size this
yet" is a real conclusion to reach about a task, and nothing else in the Deck says it.

**`revealedRoundIn` is `openRoundIn` with the door hung the other way round.** Ticket 09 built one
lookup that resolves a Round by identifier and then by state; this adds its mirror, and both now
share a private `roundIn` that only does the identifier half. A Round this Room never held is a
404 either way; a Round that is still open is a 409 that says `round_still_open`. Two use cases
each name the state they need, and neither repeats the other's check.

**The history is positional, not a state check.** `history` is `rounds.slice(0, -1)` — everything
behind the Round on the table. That is exact rather than convenient: `OpenRound` refuses while any
Round is open, so every Round but the last is necessarily revealed, and asking `isOpen` of them
would be asking a question whose answer is already guaranteed. It also means the Round being
discussed never appears twice, in the middle and in the list below.

That has one consequence ticket 13 inherits and should not discover the hard way: `history` is not
"every revealed Round", so an export that reads it alone drops the last task of the session — the
one still on the table, which is usually the one the team just settled. The export has to read
`round` beside `history`.

**The Final Estimate is writable, not write-once.** A team that records 1 when they meant 13 has
to be able to say so, and the invariant the spec protects is about Estimates, not about this. The
same follows for Rounds the team has already moved past: because the use case resolves a Round by
identifier rather than taking whichever one is current, an earlier Round can still receive the
number that came out of a discussion that ran long. There is a test pinning that, because it is a
consequence of the design rather than something anybody asked for, and it would be easy to break
later without noticing.

**`SetFinalEstimate` is the first use case with no `Clock`.** Nothing about it is timestamped —
the data model has no `final_estimate_at` and the spec never asks when the team agreed, only what
they agreed. Injecting a clock it does not read would have been a constructor argument the next
reader has to rule out.

**The write guards on `revealed_at IS NOT NULL` even though it cannot fail.** A Reveal is
irreversible, so a Round read as revealed can never be open by the time the update lands — the
guard is unreachable by construction. It is there anyway, in both repositories, because it states
the invariant at the place the row actually changes, the way `stillOpen` does for Estimates. ADR
0006 leaves the Prisma repository with no automated coverage at all, which makes a rule written
into the query worth more than the same rule written only in a use case.

**Below the table, the hand became "what you can do now".** While a Round is open that is the
Deck; once it is revealed it is the Deck again — the same ten cards, for the number the team
agreed on — plus the form that opens the next Round. The middle of the table keeps showing the
Round itself: title, the grouped Estimates, and the Final Estimate once there is one. The form was
lifted out of `RoundInTheMiddle` into `OpenTheRound` unchanged, which is why opening the first
Round of a Room and opening the next one are the same four controls rather than two screens that
drift apart. Nothing new animates; `AfterTheReveal` and the history list reuse the `rising`
keyframe from ticket 06.

**The migration is a nullable column and nothing else**, so it applies to a database with live
Rooms in it without rewriting a row. Verified against a throwaway local Postgres rather than the
team's Neon branch: every migration from the first applies clean in order, and the whole ceremony
was then driven through the HTTP API against it — a Final Estimate refused on an open Round (409),
an off-Deck value refused (400), an Estimate refused after the Reveal (409), the number recorded
by somebody who neither opened the Round nor revealed it, three Rounds opened in a row, and the
history coming back with one title settled and one not. ADR 0006 says the real check here is
human, so the same path was then clicked through in the browser.
