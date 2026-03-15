Walk me through adding a new achievement to Mathe Blaster.

First ask me:
1. What is the achievement ID (short lowercase slug, e.g. `streak20`)?
2. What is the unlock condition (be specific — when exactly does it trigger)?
3. Does it need a new lifetime counter, or does it rely on existing session/lifetime data?

Then read:
- js/progress.js (checkAchievements function, lifetime object shape, existing achievement patterns)
- js/i18n.js (achievement title/description strings in en/de/es)
- docs/storage-schema.md (Achievement IDs table)

Then implement:
1. Add the unlock condition to checkAchievements() in progress.js — follow the existing pattern (check not already earned, check condition, call unlockAchievement(id))
2. If a new lifetime counter is needed, add it to the lifetime object initialisation in getProgress()
3. Add achievement title and description strings to i18n.js in all 3 languages (en, de, es) — find the achievements section in each language block
4. Add a test to tests/progress.test.js
5. Update docs/storage-schema.md Achievement IDs table

Run npm test. Then commit.
