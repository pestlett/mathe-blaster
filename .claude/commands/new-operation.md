Walk me through adding a new math operation to Mathe Blaster.

First ask me: what is the operation name, its symbol, and a one-line description of how questions work (e.g. "a squared: a² where a is in minTable–maxTable range").

Then read the following files to understand the existing patterns before making any changes:
- js/questions.js (buildPool, _weight functions)
- js/progress.js (stats key format, checkAchievements, klasseKomplett)
- js/i18n.js (operation name strings in en/de/es)
- js/ui.js (initOnboarding, operation button logic)
- index.html (operation button elements)
- js/main.js (startGame settings handling)
- docs/operations.md

Then work through the full checklist from docs/adding-features.md "New Operation" section, making each change and explaining what you're doing and why. After all code changes, run npm test. If tests pass, update docs/operations.md to include the new operation. Then commit everything in a single commit.
