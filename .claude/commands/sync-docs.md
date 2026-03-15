Audit all documentation in docs/ against the actual codebase and update anything stale.

Read all docs files:
- docs/architecture.md
- docs/operations.md
- docs/game-settings.md
- docs/storage-schema.md
- docs/run-mode.md
- docs/adding-features.md

Then read the source files they describe:
- js/main.js (state object, DIFFICULTY constants, scoring, level logic)
- js/questions.js (buildPool, _weight, question key formats)
- js/progress.js (storage schema, achievements, mastery system)
- js/upgrades.js (UPGRADES array, SYNERGIES, ADJACENCY)
- js/themes.js (available themes)
- js/audio.js (available themes/SFX)
- js/i18n.js (supported languages)

For each doc file, identify:
1. Any constants that have changed value (speeds, thresholds, counts)
2. Any new operations, themes, upgrades, achievements, or settings not yet documented
3. Any removed features still mentioned in docs
4. Any file paths or module names that have changed

Report the full list of discrepancies, then fix them. Commit with message "docs: sync with current codebase".
