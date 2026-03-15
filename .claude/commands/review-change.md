Review a proposed game mechanic change for completeness before implementing.

First read docs/pikas.md — all content decisions must align with the PIKAS curriculum.

Ask me to describe the change in plain English (e.g. "add a timer bonus that gives extra points if the whole level is completed within 60 seconds").

Then think through all the systems this change touches and list:

1. **State** — what new fields need to go on `state` in main.js? Are they reset correctly in startGame()?
2. **Questions/Scoring** — does this change how points are calculated? Does it affect the question pool?
3. **Objects** — does this need a new object type (like freeze/life-up)? Or modify existing object behaviour?
4. **Progress/Storage** — does this generate stats that should be persisted? Does it need a new lifetime counter or achievement? Does the storage schema need updating?
5. **UI** — what new HUD elements, overlays, or screens are needed? What existing screens need updating?
6. **Audio** — what new sound effects are needed?
7. **i18n** — what new strings are needed in all 3 languages?
8. **Run mode** — could this interact with any upgrade? Should it be gated behind run mode or available always?
9. **Tests** — what new tests are needed?
10. **Docs** — which docs/ files need updating?

Present this as a clear implementation checklist, ordered by dependency (state → questions → objects → scoring → storage → UI → audio → i18n → tests → docs).

Ask if I want to proceed before writing any code.
