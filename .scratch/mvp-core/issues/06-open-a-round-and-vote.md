# 06 — Open a Round and cast a hidden Estimate

**What to build:** Someone titles a Round with the task being estimated, everyone picks a card from the Deck, and nobody can see anyone else's choice. The screen shows who has already voted and how many of the people present that is — but never what anybody picked.

**Blocked by:** 13 — The Room is a table

**Status:** ready-for-agent

- [ ] A Round can be opened with a title, and also without one for a quick unplanned vote
- [ ] The Deck is a constant in the shared package, so the values the screen offers and the values the API accepts cannot diverge
- [ ] An Estimate outside the Deck is rejected
- [ ] A Participant holds at most one Estimate per Round, enforced by the database rather than by application code
- [ ] Choosing again while the Round is open replaces the previous choice
- [ ] Before the Reveal, others can see that a Participant has voted but not what they voted
- [ ] The tally shows how many of the present Participants have voted
- [ ] The Deck and every Participant's voted state are seated into the table from ticket 13, rather than placed beside it
- [ ] Verified across two browsers: each sees the other's vote registered and still hidden
