# 04 — Join a Room with a nickname

**What to build:** Someone opens a Room link, types a nickname, and is in the Room seeing who else is there. No account, no sign-up, and no private browsing window.

Reloading the page keeps them as themselves — same nickname, same place in the list, no duplicate.

Joining is also the first thing in the project that **changes** a Room rather than creating one, so the revision rule becomes testable here. Ticket 02 established that a Room cannot exist without a revision; this is where it starts moving, and where the rule that nothing writes without bumping it gets enforced for every write that follows.

**Blocked by:** 02 — Create a Room and share its link

**Status:** ready-for-agent

- [ ] Opening a Room link without an identity asks for a nickname
- [ ] Joining issues an opaque token, held in browser storage scoped to that Room
- [ ] The token travels in an `Authorization` header and never in a cookie
- [ ] A token issued for one Room is rejected by every other Room
- [ ] Reloading preserves identity — the same nickname, no second entry in the list
- [ ] A nickname already in use in that Room produces a warning but does not block joining
- [ ] A single snapshot read returns everything needed to draw the Room, including its revision
- [ ] Every mutation to a Room's data bumps that Room's revision inside the same transaction as the mutation itself, so nothing can write without bumping — carried over from ticket 02, which had no mutation to govern
- [ ] No screen assembles Room state from more than one call
