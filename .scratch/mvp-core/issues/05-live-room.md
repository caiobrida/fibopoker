# 05 — Live Room

**What to build:** The Room keeps itself current. Somebody joining in another browser appears without anyone reloading, and somebody who closed their laptop drops off the list so the team is not waiting on a person who left.

This is where the transport decision becomes real, and the whole point is that only one module ever knows about it.

**Blocked by:** 04 — Join a Room with a nickname

**Status:** ready-for-agent

- [x] Exactly one client module is aware that a transport exists; every other module consumes Room state through it
- [x] The interval adapts — frequent while a Round is open, slower when idle, slower still with the tab in the background
- [x] An unchanged revision does not cause a re-render
- [x] Reading the snapshot updates the reader's last-seen time, costing no extra request
- [x] Nothing reads the system clock directly; time is injected everywhere it is consulted
- [x] A Participant not seen within the activity window leaves the list and stops counting toward the tally
- [x] A backgrounded tab is not evicted from the Room
- [x] Tests move time forward rather than sleeping
- [x] Verified across two separate browsers, not two tabs of one

## Comments

**The heartbeat is the one write that does not bump the revision, and that is now an ADR.** Ticket 04 left the rule as "nothing writes without bumping it", enforced by a single `bumpingRevision` helper in both repositories. This ticket adds a write that cannot go through it: reading a snapshot touches the reader's `last_seen_at`, and every client does that several times a second for as long as anybody has the Room open. Bumping there would advance the revision continuously with nothing having happened, which costs the revision its entire reason to exist — an unchanged Room would never read as unchanged, for the client today or for a `since revision N` endpoint later. The rule is therefore narrowed rather than broken: every mutation to a Room's **content** bumps the revision in the same transaction, and who is looking at the Room is not its content. `markSeen` sits visibly outside `bumpingRevision` in both implementations, and a test at the seam pins it.

ADR 0008 records this, because the rule as written in `spec.md` and ADR 0002 said otherwise and a reader of either would have been misled.

**Presence is derived, which makes the re-render criterion subtler than it looks.** Nothing writes "Alice left". She is absent because `now - last_seen_at` passed the activity window, so the same Room yields different Participants depending on when it is read, and two snapshots can carry the same revision while listing different people. Keying the client's change detection on the revision — the obvious reading of ADR 0002, and of this ticket's third criterion — would therefore mean nobody ever visibly drops off, which is this ticket's own headline. What satisfies the criterion is comparing the snapshot: TanStack Query's structural sharing keeps the previous object when the new body is deeply equal, so an unchanged Room re-renders nothing while an eviction still does. `structuralSharing: true` is set explicitly in the query options rather than left to the default, because it is load-bearing and a default does not say so.

**The fast tier is driven by the revision moving, because there is no Round to open yet.** The criterion asks for "frequent while a Round is open", and Rounds arrive in ticket 06. Rather than ship a tier with no trigger, `Cadence` goes fast for the ten polls after the revision last changed and idles after that, so all three intervals are reachable and exercised today: somebody joins, the revision moves, the Room polls at 1.5s for about fifteen seconds, then settles to 8s.

This is a proxy, and the way it is wrong is worth writing down for whoever picks up 06: during an open Round where the team discusses for longer than the hysteresis without anyone voting, the client drops to 8s and the next vote lands up to eight seconds late — the exact case the criterion wants at 1.5s. The fix is additive and belongs with the Round that justifies it: widen `Cadence` to go fast while a Round is open, not only while the revision is moving.

**The activity window is 120 seconds, and ADR 0006's passing "60-second" is now wrong.** A backgrounded tab polls every 30 seconds, which looks like a comfortable margin against 60 until the browser is involved: Chrome throttles timers in a tab hidden for a few minutes to roughly one per minute, so a 60-second window would evict people sitting in the meeting with the tab behind their editor. 120 tolerates the throttled rate with a minute to spare and still drops somebody who closed their laptop well inside the twenty minutes story 18 complains about. The test covering this advances the clock a full minute per read, five times over, which is the throttled worst case rather than the configured 30s.

What it does not survive is Chrome freezing a hidden tab outright instead of throttling it — then no read arrives at all and the Participant does drop off. No window fixes that, and it is close enough to the truth to leave alone, because re-admission makes the gap silent rather than permanent.

**The reader is present because they are reading.** `GetRoomSnapshot` marks the reader seen and then filters, so a Participant who fell outside the window is re-admitted by the very read that brings them back. Without that, a tab left closed over lunch would return holding a valid token for a Participant the snapshot no longer lists, `selfId` would point at nobody in `participants`, and the screen would ask them to join again. The invariant is now asserted directly: a snapshot never answers with a `selfId` its Participant list does not contain.

During review this was one function with `id === self?.id ||` wired into the presence filter, which said "the reader was just seen" a second time and in a second way. It is now `seenAt` — the Room with that Participant seen at that instant — composed with `presentAt`, whose predicate is uniform. One rule, one place, and no branch to forget if the window rule ever changes.

**Criterion 1 is read as one module, not one file.** `client.ts` has done `fetch` since ticket 02 and `cadence.ts` joins it now; both live inside `shared/api`, neither is exported from its barrel, and that barrel exposes only hooks. Nothing outside `shared/api` imports either, and Room state reaches every screen through `useRoomState` alone — which is what ADR 0002 asks for and what keeps the transport swappable.

**The tally half of criterion 6 has no subject yet.** The criterion asks that an absent Participant "leaves the list and stops counting toward the tally"; `RoomSnapshot` carries no tally, because nothing is voted on until ticket 06. The eviction a tally would be computed from is the one already in place — the tally will count what `participants` holds — so this is the half that exists arriving first rather than a second mechanism waiting to be built. Worth remembering alongside it: `spec.md` is explicit that falling outside the window removes somebody from the tally but **never** removes an Estimate they already cast.

**Nothing reads the clock on either side.** `SystemClock` remains the only `new Date()` in the API, and `GetRoomSnapshot` and `CreateRoom` differ deliberately: the first consults time and takes a `Clock`, the second does not and still does not. On the client the question never arises — `Cadence` counts polls rather than measuring elapsed time, so the web app reads no clock at all and there is nothing there to inject.

### How this was verified

`pnpm build`, `pnpm lint` and `pnpm format:check` pass from the root; the suite is twenty tests in under three tenths of a second, six of them new and every one moving a `ManualClock` rather than sleeping.

The database work was checked against a throwaway Postgres 17 in Docker rather than against Neon. All three migrations applied in order to an empty database and `migrate diff` reports no drift. The new one was then run the way it will actually run in production — against a table that already holds rows — by dropping the column, inserting a Room and a Participant, and replaying the file: the `NOT NULL` column lands with `last_seen_at` backfilled from `joined_at`, which is the honest answer for a Participant who existed before anybody was tracking it.

The flow was driven with `curl` against that database. Two joins take the revision to 3 and it stays at 3 across every read that follows, authenticated or not, so the heartbeat really does not bump it. After a read carrying Alice's token her `last_seen_at` has moved past her `joined_at` and Bob's has not — the heartbeat touches the reader and nobody else. Backdating Bob by five minutes drops him from the snapshot; his own next read puts him back with `selfId` pointing at him inside the list; the read after that shows him to everybody else. At 110 seconds he is still present, which is the window's near edge holding.

**The three intervals were measured in the browser rather than inferred.** With the Room quiet, the gaps between snapshot reads were 1510, 1509, 1507, 1510, 1509 ms and so on for ten polls after the last change, then 8016 and 8024 ms once it settled — the live and idle tiers, at the figures ADR 0002 names. Hiding the tab moved them to 31952, 31001 and 30999 ms, and showing it again brought them back. Over a 20-second stretch of 8-second polling with nothing happening, the Room component rendered zero times, which is the unchanged-revision criterion seen rather than argued.

Presence was then driven both ways against the live screen. A second Participant joining through the API appeared in the browser with no reload, and the cadence snapped back to 1.5s on the poll that noticed. Pushing that Participant's `last_seen_at` five minutes into the past dropped them off the list and the count returned to "1 Participant in the Room" — with the revision never moving for either event, which is precisely why the render cannot key on it. Bringing them back inside the window put them in the list again, 26 seconds later, on a tab that was polling at the backgrounded 30-second rate. That same tab had been hidden for several minutes by then and was never evicted: its `last_seen_at` stayed around 30 seconds old against a 120-second window for as long as it was left alone.

**Two separate browsers, not two tabs of one.** Chrome held Alice and Edge held a second Participant, each with its own storage and therefore its own token — the arrangement `spec.md` exists to make possible, since the point of the whole token scheme is that nobody needs a private window. The second Participant was joined by hand in Edge; from the server both browsers were plainly heartbeating in parallel, their `last_seen_at` about three and thirty seconds old respectively, the thirty being Chrome polling at the backgrounded rate with its tab behind another window.

The Chrome side picked the new arrival up on its own: the list went to "2 Participants in the Room" with Alice still marked `you`, and the page reported a single navigation entry, so nothing was reloaded between the two states. The Participant who had been pushed outside the window earlier stayed off both lists throughout.
