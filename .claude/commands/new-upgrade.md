Walk me through adding a new run-mode upgrade to Mathe Blaster.

First ask me:
1. What does the upgrade do mechanically?
2. Is it a starting upgrade (always available) or unlockable (requires a milestone)?
3. If unlockable, what milestone unlocks it?
4. Is it stackable?
5. Does it interact (positively or negatively) with any existing upgrades?

Then read the following files:
- js/upgrades.js (full file — see UPGRADES array, SYNERGIES, ADJACENCY, STARTING_UPGRADE_IDS, UNLOCK_UPGRADE_IDS)
- js/main.js (the "Upgrade flags" block in startGame, the answer handler where flags are read)
- js/progress.js (checkRunMilestones if unlockable)
- docs/run-mode.md

Then implement the upgrade:
1. Add the entry to UPGRADES with id, icon, tier, stackable (if true), names for all 4 themes (space/ocean/sky/cats), desc for all 4 themes, and apply(state) function
2. Add ID to STARTING_UPGRADE_IDS or UNLOCK_UPGRADE_IDS
3. Add any SYNERGIES entries
4. Add any ADJACENCY entries
5. Initialise the state flag in startGame() (in the "Upgrade flags" block)
6. Add the runtime behaviour in the answer handler or update loop in main.js
7. If unlockable, add the milestone check in progress.js checkRunMilestones()
8. Add tests to tests/upgrades.test.js
9. Update docs/run-mode.md (upgrades table, synergies, state flags)

Run npm test. Then commit.
