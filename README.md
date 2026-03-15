# Multiplication Blaster 🚀

[![Tests](https://github.com/pestlett/multiplication-blaster/actions/workflows/tests.yml/badge.svg)](https://github.com/pestlett/multiplication-blaster/actions/workflows/tests.yml)
[![Deploy](https://github.com/pestlett/multiplication-blaster/actions/workflows/deploy.yml/badge.svg)](https://github.com/pestlett/multiplication-blaster/actions/workflows/deploy.yml)
[![Site](https://img.shields.io/website?url=https%3A%2F%2Fmathe.jewell-colicheo.com&label=site&up_message=online&down_message=offline)](https://mathe.jewell-colicheo.com)

A browser-based multiplication game made with love for **Emma Jewell Colicheo** by her Daddy — to help her have fun while getting great at her times tables. ❤️ 🐱

**[▶ Play now at mathe.jewell-colicheo.com](https://mathe.jewell-colicheo.com)**

---

## Features

### Gameplay
- Falling multiplication questions that you blast by typing or speaking the answer
- 3 themes: **Space**, **Ocean**, and **Sky**
- 3 difficulty levels: **Easy**, **Medium**, **Hard**
- **Normal** mode (lose lives when objects hit the bottom) and **Practice** mode (no lives, no pressure)
- Level progression — speed ramps up as you improve
- Streak and combo system for bonus points
- Special items: **Boss rounds**, **Freeze powerups**, and **Life-up hearts**

### Learning
- **Spaced repetition** — questions you get wrong come back more often
- **Hint system** — shows a dot-grid picture after a configurable number of wrong tries
- **Tables range** — pick 1×1 through 12×12, or focus on a single table
- **Daily Challenge** — a fresh challenge every day at a set table and difficulty

### Mobile & Voice
- **Voice input** via Web Speech API — just say the answer out loud
- Supports English, German, and Spanish
- **Swipe** left/right on the canvas to switch target
- Fully playable on phones and tablets — no install needed

### Progress & Stats
- **Leaderboard** tracking your best scores
- **Parent Dashboard** with accuracy charts broken down by times table
- **Achievements** to unlock as you improve
- All progress saved locally in the browser

---

## Tech

Plain HTML, CSS, and vanilla JavaScript — no build step, no dependencies. Open `index.html` directly or visit the link above.

| File | Purpose |
|------|---------|
| `js/main.js` | Game state machine |
| `js/engine.js` | requestAnimationFrame loop |
| `js/questions.js` | Weighted question pool + spaced repetition |
| `js/objects.js` | Falling objects and particles |
| `js/targeting.js` | Arrow-key / swipe target snapping |
| `js/themes.js` | Space / Ocean / Sky canvas renderers |
| `js/audio.js` | Web Audio API music and sound effects |
| `js/voice.js` | Web Speech API voice recognition |
| `js/progress.js` | localStorage persistence |
| `js/ui.js` | Screen management and HUD |
| `js/i18n.js` | Internationalisation (EN / DE / ES) |

---

Made with ❤️ & 🐱 for Emma Jewell Colicheo by her Daddy (and [Claude Code](https://claude.ai/claude-code))
