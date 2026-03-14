# Multiplication Blaster — Development Guide

## After every change
**Always commit and push when a task is complete.**
1. Run `npm test` — do not commit if tests fail
2. Stage the changed files
3. Commit with a concise message (what changed and why)
4. Push to `main` — this triggers CI tests and deploys to GitHub Pages

## Versioning
The game uses **semantic versioning** (`MAJOR.MINOR.PATCH`).

| Bump | When |
|------|------|
| `PATCH` (0.0.**x**) | Bug fix, copy change, style tweak |
| `MINOR` (0.**x**.0) | New feature or mechanic |
| `MAJOR` (**x**.0.0) | Major redesign or breaking change |

**`package.json` is the single source of truth for the version.**
CI automatically injects it into `js/version.js` and `sw.js` at deploy time.

**On every release, update ONE place only:**
- `package.json` — `"version": "x.y.z"`

Do **not** manually edit `js/version.js` or `sw.js` for version changes — CI overwrites them. Updating them locally is fine for dev convenience but has no effect on what gets deployed.

> **Why?** When multiple feature branches are in flight simultaneously, manually versioning in each branch causes collisions (two branches both picking the same version number). Centralising in `package.json` and letting CI inject it at build time means the deployed version always matches exactly what is in `package.json` on `main` at the time of deploy.

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
