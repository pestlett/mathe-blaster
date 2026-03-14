# Multiplication Blaster — Development Guide

## After every change
**Always commit and push when a task is complete.**
1. Run `git pull origin main --rebase` — pull latest `main` first and resolve any conflicts before pushing
2. Run `npm test` — do not commit if tests fail
3. Stage the changed files
4. Commit with a concise message (what changed and why)
5. Push to `main` — this triggers CI tests and deploys to GitHub Pages

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

## File structure
| File | Purpose |
|------|---------|
| `index.html` | Single HTML shell |
| `style.css` | All styling |
| `js/version.js` | App version (injected by CI from `package.json`; update `package.json` instead) |
| `js/main.js` | State machine, entry point |
| `js/engine.js` | requestAnimationFrame game loop |
| `js/questions.js` | Weighted question pool |
| `js/objects.js` | Falling object logic + particles |
| `js/targeting.js` | Arrow-key snap targeting |
| `js/themes.js` | Space / Ocean / Sky canvas renderers |
| `js/audio.js` | Web Audio API synth music + SFX |
| `js/progress.js` | localStorage: stats, sessions, settings |
| `js/ui.js` | Screen management, HUD, overlays |
| `js/i18n.js` | EN / DE / ES translations |
| `js/voice.js` | Web Speech API voice input |
| `manifest.json` + `sw.js` | PWA / offline support |
| `tests/` | Jest unit tests |

## Tests
`npm test` — must pass before every commit. CI blocks deployment if they fail.
