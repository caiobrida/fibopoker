# 15 — Motion pass

**What to build:** Every moment in the session that deserves motion, got it — and every moment that got it, deserved it. This is the second cross-cutting ticket in the set, and the sibling of ticket 14: that one makes the screens work at every viewport, this one makes them feel like one product rather than a sequence of states.

It lands late because it needs every screen to exist first. The vocabulary it works in — duration and easing tokens, the reduced-motion rule — is established back in ticket 06, so this should be a sweep. If this ticket finds itself inventing curves or defining what an animation means, something earlier bypassed the token layer, exactly as ticket 14 says about literal spacing.

**The Reveal is the moment that matters most.** Ticket 09 guarantees every Estimate becomes visible at the same instant, which is an integrity rule and is not negotiable here. What this ticket owns is that the Reveal _reads_ as the event it is — the whole table turning over together — without any choreography that leaks who voted first.

**Blocked by:** 13 — Export the session · 14 — Layout pass

**Status:** ready-for-agent

- [ ] The Reveal is a single coordinated moment across the table, and nothing in its timing hints at the order votes arrived
- [ ] Casting and changing an Estimate are acknowledged on the voter's own screen immediately, without waiting for the next poll
- [ ] A card registering as voted on somebody else's screen is visible without being distracting mid-discussion
- [ ] Grouped identical values and the highlighted extremes arrive as part of the Reveal rather than appearing afterwards
- [ ] Opening the next Round clears the table as a movement, so the session reads as continuous rather than as a page change
- [ ] Arriving, leaving, renaming and switching to Spectator each read as the same kind of event they are elsewhere in the app
- [ ] Nothing animates on an unchanged poll, anywhere
- [ ] Every animation is suppressed under `prefers-reduced-motion`, and every screen remains fully usable and legible with it on
- [ ] No literal duration or easing exists in any component; every one resolves to a token
- [ ] Motion holds up at every viewport ticket 14 covers, where it has already settled the layout

## Notes

The failure mode to watch for is motion that is pleasant once and tiring on the fortieth Round of a long refinement session. A planning session is repetitive by nature, so anything on the hot path — casting a vote, seeing somebody else vote — should be shorter and quieter than the once-per-Round moments like the Reveal.

The other failure mode is motion that delays somebody. Nothing here should make a Participant wait for an animation to finish before they can act, and an animation that would still be running when the next poll lands is too long.
