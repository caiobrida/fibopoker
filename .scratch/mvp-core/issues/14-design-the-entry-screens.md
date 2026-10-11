# 14 — Design the entry screens

**What to build:** The two screens standing between somebody and a Room — create a Room, and pick a nickname — currently look like a paragraph and an input centred on a dark page. They work, and ticket 04 proved they work, but they are the first and often only impression the product makes, and right now they make none.

The deal the product offers is unusually good: no account, no sign-up, no private window, a link that keeps working. A screen that states that in plain body text is underselling it. These two screens should look like somebody designed them.

**Blocked by:** 13 — The Room is a table

**Status:** ready-for-agent

- [ ] The create screen is composed rather than centred text, and what it promises — no account, no sign-up, no limit — is part of the design rather than a sentence under a heading
- [ ] Creating a Room is visibly the one thing to do on that screen
- [ ] The nickname screen treats choosing a name as an event, not as filling in a form field
- [ ] Somebody arriving at a Room link sees who is already there while they type, which is what ticket 13's table makes possible
- [ ] The transition from the nickname screen into the Room is animated rather than a swap, so taking a seat feels like entering
- [ ] Validation still comes from `nicknameSchema` in the shared package, and still reads as a sentence a person wrote
- [ ] The warning about a nickname already taken is designed rather than appended as a note
- [ ] Both screens hold up at phone width, since this is where somebody joining from their phone starts
- [ ] No literal colour, spacing, radius or duration is introduced

## Notes

This ticket is mostly taste, and the criteria above are deliberately about composition and hierarchy rather than about a particular look — there is no mockup, and inventing one in prose would be worse than deciding at the keyboard against the real screen.

Two constraints are not taste, though, and they bound it. ADR 0004 fixes the palette: near-monochrome low-saturation greys with one inverted near-white primary action, dark only. And whatever lands here has to survive ticket 12's phone-width pass, so a composition that only works wide is not finished.

What **not** to do: add a logo, a brand colour, an illustration library or a font that is not already in the token layer. The palette is deliberately quiet, and the way to make these screens good is composition, type scale, spacing and motion — not decoration bolted onto a design system that has no room for it.
