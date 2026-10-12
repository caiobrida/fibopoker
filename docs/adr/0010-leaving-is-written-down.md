# Leaving is written down; falling quiet is not

ADR 0008 says presence is derived and that **nothing writes "Alice left"**. Ticket 12 adds the one thing that does: leaving sets `participants.left_at`, and that write bumps the Room's revision, because who is _in_ a Room is part of what the Room contains while who is _looking at it_ is not.

The rule 0008 settled is intact — the activity window is still computed at read time, and the heartbeat still writes nothing but `last_seen_at`. What follows is the second half of the same question, which 0008 had no reason to ask.

## Two ways to be absent, and only one of them is an inference

Falling outside the activity window means nobody has heard from you lately. It is reversible by the next read, by design: 0008 promises that a returning tab is re-admitted by the read that brings it back, and never sees the nickname form again.

Leaving is a decision, and that promise is exactly what must not apply to it. The token is still in the browser that holds it; a departure that existed only as a stale `last_seen_at` would be undone by the next poll — or by the next person to sit down at that machine, who would find themselves wearing the previous person's nickname. Story 13 in `spec.md` ("leave a Room and rejoin as someone else in the same browser, so that a shared machine never forces anybody into an incognito window") is only answerable if the Room records the departure rather than inferring it.

So a Participant is present when `left_at` is null **and** they have been seen inside the window. The first clause is stored, the second derived, and they answer different questions.

## The row outlives the person, because the history does

The obvious implementation — delete the Participant — is wrong here, and the database says so. `estimates.participant_id` cascades on delete, so removing the row would take every Estimate that person ever cast with it, including the ones in revealed Rounds.

`spec.md` asks for the opposite, and is emphatic that the asymmetry is the point: "a Participant who leaves takes their Estimate out of an **open** Round, so the tally stops counting a person who is gone; their Estimates in **revealed** Rounds stay, because history does not get rewritten when someone closes a browser."

A revealed Round that lost its Estimates when somebody went home would be a Round that tells a different story depending on who is still in the meeting. So the Participant row stays, marked as departed, and exactly one Estimate — the one in the open Round — is deleted.

## The asymmetry is a predicate, not a branch

The Estimate is withdrawn by a delete whose `where` requires the Round to be unrevealed, in the same transaction as the departure. The use case says which Round holds the vote; the repository refuses to touch a revealed one.

That placement decides a race, and decides it the right way. If somebody presses Reveal between the read and the write, the delete matches nothing: every Estimate in the now-revealed Round stays, and the departure still succeeds. The alternative — checking the Round in the use case and raising on a revealed one — would make leaving fail because a teammate clicked a button, which is not a failure anybody can act on. Leaving always works; a revealed Round never changes. The in-memory repository carries the same predicate, so the test seam cannot disagree with Postgres about it.

## A spent token is an unknown token

`participantHolding` ignores a departed Participant, so a token that outlives its departure resolves to nobody and the API answers `unknown_participant` (401) — the same answer a forged token gets.

That is what makes leaving cheap on the client. The web app already had this path: `useRoomState` clears local storage on a stale identity and re-reads the Room anonymously, which is how it recovers from a Room that was wiped between sessions. Leaving needed no new failure mode on the client, only an existing one pointed at a new cause.
