# 06 — The Room is a table

**What to build:** The Room stops being a list of names and becomes a table the team sits around. Participants take seats as they arrive, the seating stays balanced whether two people showed up or ten, and the middle of the table is where the Round will happen.

Ticket 05 made the Room keep itself current; it currently expresses that as a `<ul>` that gets longer. The same facts — who is here, who just arrived, who dropped off — read completely differently as people appearing around a table, and that reading is the product. Somebody opening the link before the meeting starts should see the team assembling.

This lands before ticket 08 on purpose. The Deck, the voted state and the Reveal all need somewhere to live, and that somewhere is a seat. Building them against a list first would mean re-homing every one of them afterwards.

**It also establishes the motion vocabulary**, because this is the first screen with something worth animating. Durations and easings join the token layer the way colour did in ticket 02, so that tickets 08, 09 and 15 reach for a named curve rather than inventing one — and so that the motion pass later is a sweep rather than a reconciliation.

**Blocked by:** 05 — Live Room

**Status:** ready-for-agent

- [ ] Participants are seated around a table rather than listed in a column
- [ ] The seating stays balanced at any count the Room realistically holds, from one person to a dozen
- [ ] Somebody arriving takes a seat with motion that draws the eye to them
- [ ] Somebody dropping out of the activity window vacates their seat, and the remaining seats rebalance by moving rather than by snapping
- [ ] Your own seat is identifiable at a glance without reading the names
- [ ] Each seat has a place for the Estimate that ticket 08 will put there, so nothing has to be re-homed
- [ ] The middle of the table carries the Round's state, and says what it is waiting for while no Round exists
- [ ] The table is visible to somebody who has not joined yet, so the nickname form is answered next to a Room that is visibly filling up
- [ ] Duration and easing tokens live in `tokens.css` alongside the rest, and no component introduces a literal one
- [ ] Every animation is suppressed under `prefers-reduced-motion`, and the screen is still fully legible with it on
- [ ] Nothing animates on every poll — an unchanged Room is a still screen

## Notes

The shape comes from a planning-poker product the maintainer uses; it is a reference, not a thing to reproduce. What matters is seats around a table, filling in as people arrive.

Where this ticket says a motion should "draw the eye", taste decides — the criterion is that the arrival is noticeable without being disruptive to somebody mid-sentence, and that is a judgement to make on the real screen rather than a number to specify here.

Seating geometry is the one genuinely open question. An even distribution around an ellipse reads best at larger counts; two people facing each other across the table reads best at two. Whether that is one layout that degrades well or two layouts with a threshold between them is worth deciding at the keyboard, against both cases, rather than guessing here.

ADR 0004 governs: no literal colours, spacings, radii or durations in components. If the table needs values the token layer cannot express, that is a reason to extend the token layer, not to bypass it.
