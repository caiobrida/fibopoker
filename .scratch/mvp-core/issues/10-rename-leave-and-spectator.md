# 10 — Rename, Leave and Spectator

**What to build:** The three ways a person adjusts their own presence in a Room.

**Rename** fixes a nickname typed in a hurry without costing anyone their vote. **Leave** is the actual logout: it clears the local identity so the next visit asks for a nickname again, which is what keeps a shared machine from ever needing a private browsing window. **Spectator** lets whoever brought the work be present and answer questions without their opinion anchoring the team's numbers.

Leaving is deliberately asymmetric about Estimates, and that asymmetry is the point: the tally must stop counting someone who is gone, while history must not be rewritten because somebody closed a browser.

**Blocked by:** 07 — Reveal a Round

**Status:** ready-for-agent

- [ ] Renaming keeps identity, position in the list and any Estimate in an open Round
- [ ] Leaving clears the local identity, so the next visit to that link asks for a nickname
- [ ] Leaving removes the Estimate from an open Round, so the tally stops counting an absent person
- [ ] Leaving keeps Estimates in revealed Rounds
- [ ] Two people can use one browser in sequence with no private window
- [ ] A Spectator is present but never in the tally — neither in the numerator nor the denominator
- [ ] A Participant can switch between voting and spectating
- [ ] Switching out of voting is refused in an open Round where they have already voted, since it would silently drop a counted vote
