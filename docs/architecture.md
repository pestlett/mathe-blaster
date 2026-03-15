# Architecture Overview

## Module Map

```
index.html
  └── loads (in order): version.js, engine.js, audio.js, themes.js,
                         questions.js, objects.js, targeting.js, progress.js,
                         upgrades.js, i18n.js, voice.js, ui.js, main.js
```

All modules are IIFE-based globals (no bundler). They expose a single
capitalized object: `Engine`, `Audio`, `Themes`, `Questions`, `Objects`,
`Targeting`, `Progress`, `Voice`, `UI`, `I18n`.

## Data Flow

```
User picks settings (UI)
        │
        ▼
  startGame(settings)              ← main.js
        │
        ├── Questions.pick(...)    ← builds weighted pool, returns question obj
        ├── Objects.create(...)    ← spawns falling object with physics
        ├── Targeting.syncTarget() ← maintains arrow-key target
        │
        ▼
  Engine loop (rAF)
        │
        ├── update(dt)             ← advances physics, checks answers,
        │                             handles lives, level transitions
        └── render(ctx)            ← Themes.render() + Objects.draw() + HUD

Answer submitted
        │
        ├── Progress.recordAttempt()  ← updates mastery, stats
        ├── Progress.checkAchievements() ← awards badges
        └── UI.showCombo() / showLevelUp() / etc.

Guided tutorial start
        │
        ├── UI tutorial entry points     ← onboarding button before first completion,
        │                                  replay button in Settings afterwards
        ├── startGame({ tutorialMode })  ← main.js switches to scripted spawns
        ├── TutorialRun                  ← pauses for narration, injects demo objects,
        │                                  disables input, then hands control back
        └── Progress.markTutorialCompleted() ← stores one completion timestamp only

Game ends
        │
        └── Progress.saveSession()    ← persists full session record
```

## Module Responsibilities

| Module | Owns | Does NOT own |
|--------|------|-------------|
| `main.js` | Game state, update loop logic, answer handling | Rendering, DOM |
| `engine.js` | rAF loop, canvas sizing, delta time | Game logic |
| `questions.js` | Question pool building, weighting, RNG | State, scoring |
| `objects.js` | Object/particle physics, factory functions | Spawning schedule |
| `targeting.js` | Arrow-key target reference | Object physics |
| `themes.js` | Canvas background rendering per theme | UI elements |
| `audio.js` | Web Audio synthesis, SFX, music | Triggering (main.js calls play()) |
| `progress.js` | localStorage read/write, mastery, achievements | In-memory state |
| `upgrades.js` | Upgrade definitions, synergies, adjacency | Applying during play (main.js reads state flags) |
| `ui.js` | DOM screen management, HUD, overlays, onboarding | Canvas |
| `i18n.js` | String translations EN/DE/ES | UI rendering |
| `voice.js` | Speech recognition, echo suppression, word parsing | Game logic |

## Key Patterns

**IIFE modules with single export object**
```js
const Engine = (() => {
  // private state
  return { init, start, stop, pause, resume };
})();
```

**Callback-based events** — modules don't call each other directly; they call
provided callbacks. E.g. `Voice.init({ onNumber, onFire, onNext, ... })`.

**Seeded PRNG for reproducible challenges** — `Questions.mulberry32(seed)` returns
a function; pass it as the `rng` arg to `Questions.pick()` for daily challenges
and challenge-sharing.

**Scripted tutorial mode** — `startGame({ tutorialMode: true, seed })` reuses the
normal game loop, rendering, scoring, and answer handlers, but skips the regular
spawn schedule. `main.js` drives a deterministic tutorial sequence that pauses
for TTS narration, injects specific power-ups, blocks player input during the
demo portion, then unlocks normal input for the final practice round and boss.

**Object reference tracking** — `Targeting` stores a direct reference to the
object, not an index. This survives array mutations during spawning/removal.

**Upgrade flags on state** — upgrades mutate `state.*` flags at pick time
(e.g. `state.chainAnswer = true`). `main.js` reads these flags on every answer.
Upgrades don't hold their own runtime state.

## Spawning Schedule (main.js)

Objects spawn in `update()` when:
- `phase === 'PLAYING'`
- `objects.length < DIFFICULTY[diff].maxObjects`
- A minimum time gap has passed (`spawnCooldown`)

Boss spawns every 5 levels (level % 5 === 0 and not already spawned this level).
Freeze and Life-Up objects spawn based on RNG thresholds per frame.

In `tutorialMode`, these automatic spawns are disabled and replaced with scripted
spawns from `TutorialRun`.

## Scoring

```
Base points = answer * 10
Hot zone bonus = ×1.5 (×2 with reveal+hotZoneBoost adjacency)
Streak multiplier = 1 (no streak), 2 (3+), 3 (5+), 4 (8+) — streakBoost upgrade
Quick bonus = +20 pts if answered within 1.5s — quickBonus upgrade
Lucky bonus = ×2–×5 every 5th answer — luckyBonus upgrade
Chain kill = base points only (no hot zone / time bonus)
```

## Level Transitions

- 10 correct answers → level up
- Stars awarded: ≥90% accuracy = 3★, ≥70% = 2★, else 1★
- In run mode: every 3rd level triggers ante check → upgrade picker or run end
- Boss spawns at level 5, 10, 15, …

## Canvas Layout

The canvas fills the viewport. Key vertical zones (as fraction of height):

| Zone | Default | Wide (hotZoneBoost) |
|------|---------|---------------------|
| Hot zone top | 38% | 27.5% |
| Hot zone bottom | 62% | 72.5% |
| Crash line | ~88% | ~88% |
