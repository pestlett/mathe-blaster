# Adding Features — Checklists

When making any of these changes, update the relevant doc(s) in `docs/` in the
same commit. CLAUDE.md enforces this.

---

## New Operation

A new operation (e.g. `fractions`, `powers`) requires changes in:

1. **`js/questions.js`**
   - Add a new branch in `buildPool()` for the operation ID
   - Define the question key format (e.g. `${a}f${b}`)
   - Ensure `display` string is correct
   - Add it to the `_weight()` base-weight lookup if different from default

2. **`js/progress.js`**
   - Add stat key format to any format-sensitive code
   - Add achievement IDs for the new operation (e.g. `fractionFirst`)
   - Add to `klasseKomplett` achievement check if it belongs to the curriculum
   - Add to `checkAchievements()` logic

3. **`js/i18n.js`**
   - Add operation name string in all 3 languages (EN / DE / ES)
   - Add example string (shown in onboarding)
   - Add any new HUD or result strings

4. **`js/ui.js`**
   - Add an operation button to the onboarding screen HTML (`index.html`)
   - Add the operation to the `selectedOperations` toggle logic
   - Handle visibility of the table range vs. number range selectors
   - Show/hide Zehner/Halbschriftlich toggles if relevant

5. **`index.html`**
   - Add the operation button element with correct `data-i18n` attributes

6. **`js/main.js`**
   - Ensure the `operations` array handling covers the new operation in `startGame()`
   - If the operation changes scoring logic, update the answer handler

7. **`tests/questions.test.js`**
   - Add pool-building tests for the new operation
   - Test edge cases (carry/borrow equivalent, range filtering, etc.)

8. **`tests/progress.test.js`**
   - Add achievement unlock tests for the new operation

9. **`docs/operations.md`**
   - Add to the operations table
   - Document the key format
   - Document any new settings flags

---

## New Theme

A new visual theme (e.g. `forest`, `city`) requires changes in:

1. **`js/themes.js`**
   - Add a `render_<theme>(ctx, w, h, t)` function
   - Add decorative object state in `init(theme, w, h)`
   - Add a `particleColorForTheme` entry
   - Add to the `render()` dispatcher

2. **`js/audio.js`**
   - Add **all 6 layer sequences** (`melody`, `bass`, `harmony`, `boss`, `hopeful`, `run`) to `SEQUENCES[theme]` — each with `notes`, `tempo`, `type`, and `gain`
   - Add SFX variants for `fire`, `correct`, `wrong`, `lifeLost`, `levelUp`, `freeze` to `SFX[theme]`
   - The adaptive music system (`scheduleLoop`, `setMusicState`, etc.) picks up new themes automatically — no other changes needed in the music logic

3. **`js/upgrades.js`**
   - Add theme-specific names for all 12 upgrades (the `names` and `desc` objects)

4. **`js/i18n.js`**
   - Add theme display name in all 3 languages

5. **`js/ui.js`**
   - Add the theme button to the onboarding theme switcher
   - Add to `selectedTheme` toggle logic

6. **`index.html`**
   - Add the theme button element

7. **`js/progress.js`**
   - The `theme` field in sessions is free-text; no schema change needed, but
     verify the new ID doesn't conflict with existing saved data

8. **`docs/architecture.md`**
   - Add to the themes table

---

## New Upgrade

A new run-mode upgrade requires changes in:

1. **`js/upgrades.js`**
   - Add an entry to `UPGRADES` array with: `id`, `icon`, `tier`, `names`
     (for all themes), `desc` (for all themes), `apply(state)` function
   - If `tier: 'start'`, add ID to `STARTING_UPGRADE_IDS`
   - If `tier: 'unlock'`, add ID to `UNLOCK_UPGRADE_IDS`
   - Add any synergies to `SYNERGIES`
   - Add any adjacency bonuses to `ADJACENCY`

2. **`js/main.js`**
   - Initialise the upgrade's state flag(s) in `startGame()` (in the "Upgrade flags" block)
   - Add the runtime behaviour in the answer handler or update loop

3. **`js/progress.js`**
   - If `tier: 'unlock'`, add its unlock check to `checkRunMilestones()`

4. **`js/i18n.js`**
   - No change needed if upgrade names are defined in `upgrades.js` per-theme
   - Add any new HUD labels or picker UI strings if needed

5. **`tests/upgrades.test.js`**
   - Add apply() test
   - Add synergy/adjacency tests if applicable

6. **`docs/run-mode.md`**
   - Add to the upgrades table (starting or unlockable)
   - Add synergies and adjacency entries if applicable
   - Add state flag to the state flags table

---

## New Achievement

1. **`js/progress.js`**
   - Add ID to the achievements schema comment (documentation only)
   - Add unlock condition to `checkAchievements()`
   - If it needs a lifetime counter, add to `lifetime` object

2. **`js/i18n.js`**
   - Add achievement title and description strings in all 3 languages

3. **`js/ui.js`**
   - Achievements render from the achievements object automatically — only
     add special UI if the achievement needs a custom display

4. **`tests/progress.test.js`**
   - Add unlock condition test

5. **`docs/storage-schema.md`**
   - Add to the Achievement IDs table

---

## New i18n String

1. **`js/i18n.js`**
   - Add the key to `STRINGS.en`, `STRINGS.de`, AND `STRINGS.es`
   - Use the `/check-i18n` slash command to verify all 3 languages have it

2. **`index.html`** (if a static element)
   - Add `data-i18n="yourKey"` attribute to the element

3. Verify with `npm test` (i18n.test.js checks key consistency)

---

## New Screen

1. **`index.html`**
   - Add a `<div id="screen-<name>" class="screen">` element

2. **`js/ui.js`**
   - Add show/hide logic using `showScreen('screen-<name>')`
   - Wire up any buttons/events

3. **`style.css`**
   - Add styles for the new screen

4. **`js/i18n.js`**
   - Add any screen-specific strings

5. **`docs/architecture.md`**
   - Add to the Screen IDs table in the UI section

---

## Guided Tutorial / Scripted Demo

1. **`js/main.js`**
   - Decide whether the feature reuses `startGame(settings)` with a mode flag
     (e.g. `tutorialMode`) or needs a separate flow
   - Disable normal spawns / stat writes if the tutorial is scripted rather than
     a real scored run
   - Block player input during fully automated demo segments, then explicitly
     hand control back
   - If the feature is player-facing (power-up, control, HUD affordance, boss
     behaviour, new screen callout, etc.), add or update a tutorial beat so the
     feature is actually shown in the guided tutorial

2. **`js/ui.js` + `index.html` + `style.css`**
   - Add onboarding and replay entry points
   - Add any overlay / coach-mark UI needed for narration and objectives
   - For run-mode-only HUD/audio cues, update the run-mode demo narration so the
     player is told what the new signal means

3. **`js/progress.js`**
   - If completion should persist, store a lightweight lifetime flag/timestamp
     instead of writing fake sessions or mastery

4. **`js/i18n.js`**
   - Add all narration, CTA, and settings strings in EN / DE / ES

5. **`tests/`**
   - Add persistence tests for any tutorial-completion storage

6. **Docs**
   - Update `docs/game-settings.md` for new mode flags
   - Update `docs/storage-schema.md` for completion persistence
   - Update `docs/architecture.md` for the control flow
   - If a new feature must appear in the tutorial, note that requirement in the
     relevant feature doc/checklist too

---

## Docs-Only Changes

When the only change is to documentation:
- No test run required
- Commit message prefix: `docs:`
- Still push to trigger CI (deploy regenerates anyway)
