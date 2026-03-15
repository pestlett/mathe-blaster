Walk me through adding a new visual theme to Mathe Blaster.

First ask me: what is the theme name (ID must be lowercase, no spaces), and describe the visual style — what environment is it (e.g. forest, space station, underwater cave)? What colors should dominate?

Then read the following files to understand the existing patterns:
- js/themes.js (full file — see how space/ocean/sky/cats are structured)
- js/audio.js (music sequences and SFX objects per theme)
- js/upgrades.js (names and desc objects — these need entries for every theme)
- js/i18n.js (theme name strings)
- js/ui.js (theme switcher in initOnboarding)
- index.html (theme button elements)
- docs/architecture.md

Then implement the full theme by working through docs/adding-features.md "New Theme" section:
1. Create the canvas renderer in themes.js (background, animated decorative objects, particles)
2. Create the music sequence and SFX variants in audio.js
3. Add theme-specific upgrade names and descriptions in upgrades.js (all 12 upgrades)
4. Add the i18n display name in all 3 languages
5. Add the UI button and toggle logic
6. Update docs/architecture.md

Run npm test after all changes. Then commit everything.
