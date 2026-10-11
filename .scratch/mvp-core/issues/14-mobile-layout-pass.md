# 14 — Mobile layout pass

**What to build:** Every screen verified at phone width, so that being away from a desk does not exclude somebody from the estimate. This is the one cross-cutting ticket in the set: it adds no behaviour, it makes the behaviour that exists usable on a narrow viewport.

It is one of two cross-cutting passes, and the one that lands first: ticket 15 does the same sweep for motion, and works on a layout this ticket has already settled. It lands after the features because it needs every screen to exist first. The token layer established in ticket 02 is what should keep this a layout pass rather than a restyle — if this ticket needs new literal values, something earlier bypassed the tokens.

**Blocked by:** 12 — Rename, Leave and Spectator · 13 — Export the session

**Status:** ready-for-agent

- [ ] Every screen is usable at phone width with no horizontal page scrolling
- [ ] The whole Deck is reachable without pinching or zooming
- [ ] The table from ticket 06 stays readable on a narrow viewport, with every seat visible at once
- [ ] A revealed Round stays readable on a narrow viewport, with grouping and the highlighted extremes still legible
- [ ] Touch targets are large enough to hit reliably
- [ ] No literal colour, spacing, radius or duration was introduced anywhere during the pass
