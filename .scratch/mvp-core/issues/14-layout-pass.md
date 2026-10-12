# 14 — Layout pass

**What to build:** Every screen verified at every viewport somebody will actually estimate from, so that neither being away from a desk nor working in a window that is not full-screen excludes somebody from the estimate. This is the one cross-cutting layout ticket in the set: it adds no behaviour, it makes the behaviour that exists usable at a size it currently is not.

It is one of two cross-cutting passes, and the one that lands first: ticket 15 does the same sweep for motion, and works on a layout this ticket has already settled. It lands after the features because it needs every screen to exist first. The token layer established in ticket 02 is what should keep this a layout pass rather than a restyle — if this ticket needs new literal values, something earlier bypassed the tokens.

**It covers height as well as width, and that is the part that is easy to forget.** The obvious failure is a phone: a narrow viewport, horizontal scrolling, seats off the side. The failure this project actually has first is a laptop — the Room is a wide ellipse, so it spends its budget vertically, and a window that is not full-screen runs out of height long before it runs out of width. A pass that only resizes the browser narrow will miss it.

**Blocked by:** 12 — Rename, Leave and Spectator · 13 — Export the session

**Status:** ready-for-agent

- [ ] Every screen is usable at phone width with no horizontal page scrolling
- [ ] Every screen holds up in a laptop window that is not full-screen, measured against viewport height as well as width
- [ ] The table from ticket 06 stays readable at every viewport in range, with every seat visible at once and no two overlapping — which means the figure scales as a unit rather than keeping a fixed seat size
- [ ] On the entry screen the nickname panel and the table are visible together, since seeing who is already there while you type is what ticket 07 built that screen around
- [ ] The whole Deck is reachable without pinching or zooming
- [ ] A revealed Round stays readable on a narrow viewport, with grouping and the highlighted extremes still legible
- [ ] Touch targets are large enough to hit reliably
- [ ] No literal colour, spacing, radius or duration was introduced anywhere during the pass

## Notes

Two tickets have already measured most of this, and their numbers are the starting point rather than something to rediscover.

**Ticket 06 measured the table against seat count.** The table is `viewport − 128px` up to its 832px cap, and the smallest viewport each count needs is:

| Participants | 2–4    | 5–6    | 7      | 8–10   | 12     |
| ------------ | ------ | ------ | ------ | ------ | ------ |
| Needs        | ~360px | ~460px | ~525px | ~640px | ~790px |

So a dozen people need a nearly full-width desktop window and a typical six fit on a phone. Ticket 06 also searched the geometry and found that seat _width_ barely moves the binding constraint — which is vertical spacing at the flanks, where consecutive seats stack almost vertically — so a smaller seat is not the fix. Making the table _rounder_ buys far more than making it wider, which is why a future squeeze should spend its budget on the aspect constant rather than on the seat tokens.

**Ticket 07 measured the entry screen against window height.** At full size the table needs 683px of vertical space, the nickname panel is 401px, and a 945px laptop window therefore has room for one or the other but not both. The inversion is worth knowing before starting: a phone shows the panel and the whole table, and a laptop shows the panel and the top of the table, because a phone's table is small enough to fit underneath.

Ticket 07 considered three ways out and deliberately left all three to this ticket, because each one is a decision about the Room rather than about the entry screen:

- **Cap the table narrower on the entry screen.** Fits a laptop, but makes seats overlap at counts that currently do not — trading a layout problem for one that looks like a bug.
- **Put the panel beside the table.** Needs the Room to be wider than `--measure-wide`, which changes the Room everywhere, not just on arrival.
- **Put the panel in the middle of the table,** where ticket 08's Round lives. The nicest composition of the three, and impossible at phone width, where the ellipse's middle is about 116px across.

The ring comes from one aspect constant and the seat metrics are four tokens, so nothing in the code is in the way of any of them.

**What this ticket should probably conclude** — though it is the ticket's call to make, not this note's — is that the table scales as one figure. Both the phone case and the laptop case are the same shape of problem, a fixed seat size inside a container that shrank, and one fix that scales the whole figure answers both. Two separate fixes, one per viewport, would mean touching the same geometry twice and leaving a breakpoint between them for somebody to fall through.
