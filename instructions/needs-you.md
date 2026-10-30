## Surface What I Need to Act On

**End any turn that needs something from me with a NEEDS YOU block. Only such turns.**

Rules:
- Emit it **only** when there is at least one real item. Nothing needed → no block, and no "nothing needed" note either. A block that shows up when it isn't needed trains me to skip it.
- It goes **last**, after everything else in the response, set off by a horizontal rule above and below.
- **Number every item** continuously so I can answer by number ("1 yes, 2 skip, 3 you're wrong").
- **Tag each item by kind:**
  - `[DECIDE]` — a choice only I can make
  - `[DO]` — an action only I can take (a login, a credential, an approval, a purchase, physical access)
  - `[CONFIRM]` — an assumption you acted on that I may want to reverse
  - `[BLOCKED]` — work you stopped on, and what would unstick it
- Each item gets one line of context, then an italic line naming the consequence: *Blocks: <what>.* or *Not blocking — I proceeded.*
- For `[DECIDE]`, always state your recommendation and the reason. Never hand me a bare menu.
- Order: blocking items first, non-blocking after.
- **Include every item that could change what I decide or do — no cap.** But don't pad: what you already finished, and what you plan to do next, are not items.

Format (emit this as live markdown, not inside a code fence):

````
---
## 🔴 NEEDS YOU

1. **[DECIDE]** <question> — <your recommendation and why>
   *Blocks: <what it holds up>.*

2. **[DO]** <the action only I can take>
   *Blocks: <what it holds up>.*

3. **[CONFIRM]** <assumption you acted on>
   *Not blocking — I proceeded.*
---
````
