# Presence is computed at read time, outside the revision rule

Reading a Room's snapshot doubles as the reader's heartbeat: it writes that Participant's `last_seen_at` and nothing else. That write deliberately does **not** advance the Room's revision, which makes it the one exception to "nothing writes without bumping it" — a rule ticket 04 enforced through a single `bumpingRevision` helper in both repository implementations, and which this leaves intact for everything that changes what a Room _contains_.

The exception is not a convenience. Every client polls, so bumping on a heartbeat would advance the revision several times a second for as long as anybody has the Room open, with nothing having happened. The revision exists so that an unchanged Room reads as unchanged; a revision that never settles answers every question with "something changed" and is worth nothing to the client, to a later `since revision N` endpoint, or to the cheap-polling argument in ADR 0002. So the rule now reads: **every mutation to a Room's content bumps the revision in the same transaction; who is looking at the Room is not its content.**

That has a consequence worth stating plainly, because it is easy to discover the hard way. **Presence is derived, not stored.** Nothing writes "Alice left" — she is absent because `now - last_seen_at` has grown past the activity window, and the same Room yields different Participants depending on when it is read. Two snapshots can therefore carry the same revision and list different people.

So **the client cannot key change detection on the revision alone**, which is what the obvious reading of ADR 0002 would suggest. It compares the snapshot itself: `useRoomState` relies on TanStack Query's structural sharing, which keeps the previous object when the new body is deeply equal, so an unchanged Room re-renders nothing while somebody falling out of the window still does. The revision is what paces the polling, not what gates the render.

## The activity window is 120 seconds

ADR 0006 mentions a 60-second window in passing. The number is settled here at 120 seconds, and 60 would be wrong.

A backgrounded tab polls every 30 seconds, which leaves a comfortable margin on paper. It does not survive contact with the browser: Chrome throttles timers in a tab that has been hidden for a few minutes down to roughly one per minute, so a 60-second window would start evicting people who are sitting in the meeting with the tab behind their editor — which is exactly what "a backgrounded tab is not evicted" forbids. 120 seconds tolerates the throttled rate with a full minute to spare, and still drops somebody who closed their laptop inside the two minutes that story 18 cares about.

## Consequences

- A Participant who falls outside the window is **re-admitted by the read that brings them back**, since that read is their heartbeat. Their `selfId` is therefore always a Participant the same snapshot lists, and a returning tab never sees the nickname form.
- A tab Chrome freezes outright, rather than throttling, stops polling altogether and its Participant does drop off the list. No window can prevent that, and it is close enough to the truth — nothing is reaching that person — to leave alone.
- The heartbeat costs one write per read. At this size that is the straightforward reading of "presence costs no extra request"; throttling it to one write per half-window is available if a connection budget ever makes it matter.
