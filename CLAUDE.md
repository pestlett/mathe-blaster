# Multiplication Blaster — Development Guide

## After every change
**Always commit and push when a task is complete.**
1. Run `npm test` — do not commit if tests fail
2. Stage the changed files
3. Commit with a concise message (what changed and why)
4. Push to `main` — this triggers CI tests and deploys to GitHub Pages

## Versioning
The game uses **semantic versioning** (`MAJOR.MINOR.PATCH`).

**PATCH is bumped automatically on every deploy by CI** — you never need to touch version numbers for normal changes.

| Manual bump | When |
|-------------|------|
| `MINOR` (0.**x**.0) | New feature or mechanic — update `package.json` before merging |
| `MAJOR` (**x**.0.0) | Major redesign — update `package.json` before merging |

**Do not edit `js/version.js` or `sw.js` for version changes** — CI overwrites them on every deploy. The deploy workflow:
1. Runs `npm version patch` → increments PATCH in `package.json`
2. Injects the new version into `js/version.js` and `sw.js`
3. Commits `chore: release vX.Y.Z` back to `main`
4. Deploys the site

This means concurrent feature branches never collide on version numbers.

The footer displays the version automatically from `js/version.js`.

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
