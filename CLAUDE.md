# Mathe Blaster! — Development Guide

## Autonomous Decision-Making — Consult Agents Before Asking the User

**Before asking the user any question, first check whether an agent can answer it.**
The goal is to complete tasks without interrupting the user unless truly necessary.

| Question type | Agent to consult |
|--------------|-----------------|
| Is this PIKAS-compliant? | `pikas-validator` |
| What should the DE/ES translation be? | `i18n-translator` |
| Which files to update, how to name things, whether to add tests, is this in scope? | `project-advisor` |

Only escalate to the user when the question requires **product intent** that cannot be inferred from existing conventions, code patterns, or these docs (e.g. choosing between two product directions). Everything else should be answerable by an agent or by reading the codebase.

## Pedagogical Source of Truth — PIKAS
**All game design decisions follow the PIKAS framework** (German federal primary
school maths curriculum, Klassen 1–4). Before adding or changing any game
mechanic, content, or difficulty setting, read `docs/pikas.md`.

Key rule: *if a German Klasse 3 teacher wouldn't recognise it as appropriate
content, don't add it.*

## Working in a git worktree
**Always work in a git worktree** — never modify the main checkout directly.

1. `git pull origin main --rebase` — sync with latest `main` before creating the worktree
2. Create a worktree for your task: `git worktree add ../multiplication-<task-name> -b feat/<task-name>`
3. Do all work inside that worktree directory
4. **Periodically pull during long tasks**: run `git fetch origin main && git rebase origin/main` every few steps to stay current and catch conflicts early
5. When done, merge directly into `main` — **do not open pull requests or MRs**
6. After merging, clean up the branch:
   - Delete the local branch: `git branch -d feat/<task-name>`
   - Delete the remote branch: `git push origin --delete feat/<task-name>`
   - Remove the worktree: `git worktree remove ../multiplication-<task-name>`

## After every change
**Always commit and push when a task is complete.**
1. Run `git pull origin main --rebase` — pull latest `main` first and resolve any conflicts before pushing
2. Run `npm test` — do not commit if tests fail
3. Stage the changed files
4. Commit with a concise message (what changed and why)
5. Push directly to `main` — this triggers CI tests and deploys to GitHub Pages

## Documentation
**Keep `docs/` in sync with the code.** When a change affects game mechanics,
settings, storage schema, operations, upgrades, or achievements, update the
relevant doc file in the same commit.

| Change type | Doc(s) to update |
|-------------|-----------------|
| New operation or question type | `docs/operations.md` |
| New setting in startGame() | `docs/game-settings.md` |
| New localStorage field or achievement | `docs/storage-schema.md` |
| New upgrade, synergy, or ante target | `docs/run-mode.md` |
| New module, screen, or architectural pattern | `docs/architecture.md` |
| Any of the above | `docs/adding-features.md` (update the checklist) |

Use `/sync-docs` to audit docs against the codebase at any time.

## Guided Tutorial Coverage
**Any new player-facing feature must be considered for the guided tutorial.**
If you add or change a power-up, control scheme, HUD affordance, boss behaviour,
settings flow, help interaction, or other gameplay-facing mechanic:

1. Decide whether it should be shown in the guided tutorial
2. Update the tutorial sequence/copy when it should be taught to players
3. Update `docs/adding-features.md` (and any feature-specific doc) if the
   tutorial checklist needs to mention it

## Slash Commands
Project-specific commands are in `.claude/commands/`. Use them by name:

| Command | Purpose |
|---------|---------|
| `/new-operation` | Guided walkthrough for adding a math operation |
| `/new-theme` | Guided walkthrough for adding a visual theme |
| `/new-upgrade` | Guided walkthrough for adding a run-mode upgrade |
| `/new-achievement` | Guided walkthrough for adding an achievement |
| `/check-i18n` | Audit translations for missing keys across EN/DE/ES |
| `/sync-docs` | Check docs/ for staleness against current code |
| `/review-change` | Pre-implementation review of a proposed mechanic change |
| `/debug-voice` | Diagnose voice input problems |

## Agents
Specialist subagents are in `.claude/agents/`. They are invoked automatically
when relevant, or can be called explicitly:

| Agent | Purpose |
|-------|---------|
| `pikas-validator` | Validates any proposed content or mechanic against the PIKAS curriculum — returns GO / NO-GO / GO WITH CONDITIONS |
| `i18n-translator` | Produces accurate DE + ES translations in the correct primary-school register, writes directly to `js/i18n.js` |
| `project-advisor` | Answers judgment calls about scope, naming, testing, documentation, and architecture so the user doesn't need to be interrupted |

## Versioning
The game uses **semantic versioning** (`MAJOR.MINOR.PATCH`).

**⚠️ Never manually edit version numbers** — not in `package.json`, `js/version.js`, or `sw.js`. CI handles all of this automatically on every deploy.

The deploy workflow (`deploy.yml`) does this on every push to `main`:
1. Runs `npm version patch` → increments PATCH in `package.json` (e.g. `0.7.1` → `0.7.2`)
2. Injects the new version into `js/version.js` and `sw.js`
3. Commits `chore: release vX.Y.Z` back to `main`
4. Deploys the site

The only exception is a deliberate MINOR or MAJOR bump (new feature set or redesign). In that case, manually update `package.json` **only** — CI will increment PATCH from that new baseline going forward.

| Manual bump | When | How |
|-------------|------|-----|
| `MINOR` (0.**x**.0) | New feature or mechanic | Edit `package.json` only, in the same commit as the feature |
| `MAJOR` (**x**.0.0) | Major redesign | Edit `package.json` only |

`js/version.js` and `sw.js` are **always** overwritten by CI — any manual changes to them will be lost on the next deploy.

## File Structure

### Source
| File | Purpose |
|------|---------|
| `index.html` | Single HTML shell — all screens live here as `<div class="screen">` |
| `style.css` | All styling |
| `js/version.js` | App version (injected by CI; edit `package.json` instead) |
| `js/main.js` | State machine, game loop callbacks, answer handling, scoring |
| `js/engine.js` | requestAnimationFrame loop, canvas sizing, delta time |
| `js/questions.js` | Weighted question pool builder, seeded RNG |
| `js/objects.js` | Falling object factory, boss/freeze/life-up, particles |
| `js/targeting.js` | Arrow-key snap targeting (reference-based, not index-based) |
| `js/themes.js` | Space / Ocean / Sky / Cats canvas background renderers |
| `js/audio.js` | Web Audio API synth music + SFX, one set per theme |
| `js/progress.js` | localStorage: stats, sessions, mastery, achievements, profiles |
| `js/upgrades.js` | Run-mode upgrade definitions, synergies, adjacency bonuses |
| `js/ui.js` | Screen management, HUD, overlays, onboarding form |
| `js/i18n.js` | EN / DE / ES translations |
| `js/voice.js` | Web Speech API: recognition, echo suppression, word parsing |
| `manifest.json` + `sw.js` | PWA / offline support |

### Tests
| File | Tests |
|------|-------|
| `tests/questions.test.js` | Pool building, weighting, carry/borrow logic |
| `tests/progress.test.js` | Storage schema, mastery, achievements, profiles |
| `tests/targeting.test.js` | Arrow-key targeting, reference tracking |
| `tests/voice.test.js` | Word mapping, number parsing |
| `tests/voice-processing.test.js` | Voice result processing pipeline |
| `tests/voicemode.test.js` | Voice interaction integration |
| `tests/objects.test.js` | Object creation, physics, particles |
| `tests/upgrades.test.js` | Upgrade apply(), synergies, adjacency |
| `tests/i18n.test.js` | Translation key consistency across languages |
| `tests/helpers/context.js` | DOM mocks / test setup |

### Docs
| File | Covers |
|------|--------|
| `docs/pikas.md` | **Pedagogical source of truth** — PIKAS curriculum, design rules, scope |
| `docs/architecture.md` | Module map, data flow, key patterns, scoring formula |
| `docs/operations.md` | All operations, question key formats, Pikas curriculum |
| `docs/game-settings.md` | Complete `startGame()` settings reference |
| `docs/storage-schema.md` | localStorage schema, mastery system, achievement IDs |
| `docs/run-mode.md` | Ante system, all upgrades, synergies, adjacency bonuses |
| `docs/adding-features.md` | Per-feature checklists (operation / theme / upgrade / achievement / i18n / screen) |

## Tests
`npm test` — must pass before every commit. CI blocks deployment if they fail.
