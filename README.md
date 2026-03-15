# Mathe Blaster! 🚀

[![Tests](https://github.com/pestlett/mathe-blaster/actions/workflows/tests.yml/badge.svg)](https://github.com/pestlett/mathe-blaster/actions/workflows/tests.yml)
[![Deploy](https://github.com/pestlett/mathe-blaster/actions/workflows/deploy.yml/badge.svg)](https://github.com/pestlett/mathe-blaster/actions/workflows/deploy.yml)
[![Site](https://img.shields.io/website?url=https%3A%2F%2Fmathe.jewell-colicheo.com&label=site&up_message=online&down_message=offline)](https://mathe.jewell-colicheo.com)

A browser-based maths game made with love for **Emma Jewell Colicheo** by her Daddy — to help her have fun while getting great at her times tables. ❤️ 🐱

**[▶ Play now at mathe.jewell-colicheo.com](https://mathe.jewell-colicheo.com)**

---

## Features

### Gameplay
- Falling maths questions that you blast by typing or speaking the answer
- 4 themes: **Space**, **Ocean**, **Sky**, and **Cats** 🐱
- 3 difficulty levels: **Easy**, **Medium**, **Hard**
- **Normal** mode (lose lives when objects hit the bottom) and **Practice** mode (no lives, no pressure)
- Level progression — speed ramps up as you improve
- Streak and combo system for bonus points (×1.5 at 3, ×2 at 5, speed bonus for fast answers)
- Special items: **Boss rounds**, **Freeze powerups**, and **Life-up hearts**

### Operations
- **Multiplication** and **Division** — the kleines Einmaleins (1×1 to 10×10, PIKAS curriculum)
- **Addition** and **Subtraction** — up to 100 or 1,000
- **Tens Facts** (Zehnereinmaleins) — 3×40, 6×200, 120÷4
- **Expanded** (Halbschriftliches Rechnen) — single-digit × multi-digit up to 1,000
- **Mixed Practice** — ×/÷ together, +/− together, or all four operations at once

### Run Mode ⚔
A roguelike meta-layer on top of normal play:
- Every 3 levels the game pauses and offers **3 random upgrades** to choose from
- Meet the **Ante score target** each round or the run ends
- 12 upgrades with theme-specific names (e.g. Gravity Well / Riptide / Lightning Strike)
- Upgrade **synergies** (positive combos) and **conflicts** (negative interactions)
- **Adjacency bonuses** when specific upgrades sit next to each other in your bar
- Unlockable upgrades earned by reaching new Antes

### Learning
- **Spaced repetition** — questions you get wrong come back more often
- **Hint system** — shows a dot-grid picture after a configurable number of wrong tries
- **Daily Challenge** — a fixed table and difficulty that resets every day
- **Challenge a Friend** — share a seeded link; compare your scores head-to-head

### Profiles & Settings
- **Multiple player profiles** — each with their own name, age, and saved settings
- Settings modal (⚙️) for difficulty, mode, hint threshold, and voice trigger
- All settings persist per-profile across sessions

### Progress & Stats
- **Leaderboard** tracking your best scores
- **Performance Overview** with accuracy charts broken down by table
- **Mastery grid** showing which facts you've nailed and which need work
- **Play streak** — daily streak counter shown after 2+ consecutive days
- **40+ achievements** to unlock, including table mastery, streaks, Run Mode milestones, and beating friends in challenges
- All progress saved locally in the browser (no account needed)

### Mobile & Accessibility
- **Voice input** via Web Speech API — say the answer out loud
- **Swipe** left/right on the canvas to switch target
- Available in **English**, **German**, and **Spanish** (default: German)
- Fully playable on phones and tablets — no install needed, works offline (PWA)

---

## Tech

Plain HTML, CSS, and vanilla JavaScript — no build step, no framework, no dependencies. Open `index.html` directly or visit the link above.

| File | Purpose |
|------|---------|
| `js/main.js` | Game state machine |
| `js/engine.js` | requestAnimationFrame loop |
| `js/questions.js` | Weighted question pool + spaced repetition + seeded PRNG |
| `js/objects.js` | Falling objects and particles |
| `js/targeting.js` | Arrow-key / swipe target snapping |
| `js/themes.js` | Space / Ocean / Sky canvas renderers |
| `js/audio.js` | Web Audio API music and sound effects |
| `js/voice.js` | Web Speech API voice recognition |
| `js/progress.js` | localStorage persistence, achievements, profiles |
| `js/upgrades.js` | Run Mode upgrade definitions, synergies, adjacency bonuses |
| `js/ui.js` | Screen management, HUD, settings modal, upgrade picker |
| `js/i18n.js` | Internationalisation (EN / DE / ES) |

---

Made with ❤️ & 🐱 for Emma Jewell Colicheo by her Daddy (and [Claude Code](https://claude.ai/claude-code))
