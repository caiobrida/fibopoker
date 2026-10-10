# Planning Poker

A team estimates tasks in Fibonacci points together. Anyone can open a space, share its link, and vote — no accounts, no sign-up, no limit on how many estimates a space can hold.

## Language

**Room**:
The persistent space behind a shareable link. It outlives any single vote and stays valid for as long as the team keeps using it.
_Avoid_: session, board, game, table

**Round**:
A single vote inside a Room, with an optional free-text title naming what is being estimated. A Round is either open or revealed.
_Avoid_: vote, poll, story, ticket

**Participant**:
Someone present in a Room, identified only by a nickname they choose when entering. A Participant can rename themselves or leave at any time.
_Avoid_: user, player, member, voter

**Spectator**:
A Participant who is present without estimating — typically whoever brought the work rather than whoever will do it. A Spectator is never counted in a Round's vote tally.
_Avoid_: observer, guest, viewer

**Estimate**:
The Deck value a Participant picks in a Round. Recorded as the literal value chosen, so a Round keeps telling the truth about what was voted even after the Deck changes.
_Avoid_: vote, point, card, score

**Deck**:
The fixed set of values a Participant may choose from: `0, 1, 2, 3, 5, 8, 13, 21, ?, ☕`. `?` means the task is not understood well enough to estimate; `☕` asks for a break.
_Avoid_: scale, cards, sequence

**Reveal**:
The irreversible act of making every Estimate in a Round visible at once. A revealed Round is immutable — its Estimates are never altered or removed, so the Room's history stays trustworthy.
_Avoid_: flip, show, close

**Re-vote**:
Estimating an already-revealed task again after discussion. It opens a new Round carrying the same title, rather than reopening the old one — the disagreement that triggered the discussion stays on the record.
_Avoid_: retry, attempt, round 2

**Final Estimate**:
The single value a team settles on for a Round after seeing the Estimates and discussing them. It is agreed by people, never computed from the Estimates — a Round can be revealed without ever receiving one.
_Avoid_: result, consensus, average, final score
