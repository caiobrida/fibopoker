# 05 — Live Room

**What to build:** The Room keeps itself current. Somebody joining in another browser appears without anyone reloading, and somebody who closed their laptop drops off the list so the team is not waiting on a person who left.

This is where the transport decision becomes real, and the whole point is that only one module ever knows about it.

**Blocked by:** 04 — Join a Room with a nickname

**Status:** ready-for-agent

- [ ] Exactly one client module is aware that a transport exists; every other module consumes Room state through it
- [ ] The interval adapts — frequent while a Round is open, slower when idle, slower still with the tab in the background
- [ ] An unchanged revision does not cause a re-render
- [ ] Reading the snapshot updates the reader's last-seen time, costing no extra request
- [ ] Nothing reads the system clock directly; time is injected everywhere it is consulted
- [ ] A Participant not seen within the activity window leaves the list and stops counting toward the tally
- [ ] A backgrounded tab is not evicted from the Room
- [ ] Tests move time forward rather than sleeping
- [ ] Verified across two separate browsers, not two tabs of one
