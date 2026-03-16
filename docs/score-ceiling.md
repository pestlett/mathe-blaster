# Mathe Blaster! — Score Ceiling Analysis

This document covers how to access each game mode, the full scoring formula, and the theoretical maximum score achievable per answer with an optimal upgrade stack.

---

## Accessing the Two Modes

From the home screen you will see two game-start buttons:

| Button | Mode | Description |
|--------|------|-------------|
| **"Let's Go!"** | **Standard Mode** | Default. No upgrades, no coins, no ante targets. Powerups spawn during play (scoreStar, shield, freeze, lifeup, lightning, magnet, bomb). Goal: learn the tables and beat boss levels. |
| **"⚔ Run Mode"** | **Run Mode** | Roguelite. Coin economy, 4–6 upgrade slots, ante score targets. Upgrade builds matter. |

Standard Mode is always available — no unlock needed. Run Mode appears directly below the main start button on desktop/laptop (a mobile hint note recommends a keyboard for Run Mode).

---

## The Scoring Formula

Every correct answer passes through this chain in order (`js/main.js`):

```
base (10)
  + time bonus     (+10 if <3 s, +5 if <6 s)
  + quick bonus    (+20, or +30 with streakBoost synergy, if <1.5 s)
  × streak mult    (×1.5 / ×2 / ×3 / ×4 at streak 3/5/8 with streakBoost)
  × hot-zone mult  (×1.5 normally; ×2 with hotZoneBoost+reveal; ×2.5 adjacent)
  + echoStreak     (streak mult applied again as flat bonus in hot zone)
  + replayHotZone  (hot-zone delta added a second time)
  × lucky          (×2–5 every 5th answer, or every 3rd with luckyFrequency)
  × echoLucky      (second ×2–5 roll)
  × replayLucky×N  (N extra rolls of ×2–5, each also echoed)
  × scoreStar      (×3 — active ~every 35 s)
  ─────────────────────────────────────────────
  × scoreMultiplier   → finalPts
  + finalPts again    (if multiBooster / divideBooster / addBooster / subtractBooster)
  + finalPts × N      (replayScore adds finalPts N more times)
```

The **global `scoreMultiplier`** is the most powerful lever because it scales everything before it. Every upgrade that raises it compounds with the next.

---

## scoreMultiplier Growth Paths

### Bought upgrades (immediate, Run Mode shop)

| Stack | Multiplier |
|-------|-----------|
| `scoreMultSmall` × 1 | ×1.5 |
| `scoreMultSmall` × 3 | ×3.375 |
| `scoreMultLarge` × 1 | ×2 |
| `scoreMultSmall` × 3 + `scoreMultLarge` × 2 | **×13.5** |

### Per-answer growth (`compoundGrowth`)

With the `compoundGrowth` + `scoreMultPerfect` synergy the multiplier grows **×1.04 per answer**:

| Answers answered | Multiplier (starting from ×13.5) |
|-----------------|----------------------------------|
| 50              | ~98× |
| 100             | ~672× |
| 150             | ~4,600× |
| 200             | **~34,400×** |

> **Cap note:** `scoreMultPerfect` caps `scoreMultiplier` at ×12 (×8 without `hotZoneBoost`). If you've already bought enough small/large multipliers to exceed this cap, `scoreMultPerfect` does nothing — `compoundGrowth` carries you past it on its own.

---

## Ceiling Calculation at Answer 200

Using the optimal all-in Run Mode build (all upgrades stacked via multiple shop visits):

**Build:**
`compoundGrowth` · `scoreMultPerfect` · `streakBoost` · `hotZoneBoost` · `reveal` (adj_hotReveal) · `echoStreak` · `replayHotZone` · `quickBonus` · `luckyBonus` · `luckyFrequency` · `echoLucky` (adj_echoLucky) · `replayLucky` × 2 · `scoreMultSmall` × 3 · `scoreMultLarge` × 2 · `replayScore` × 3 · `multiBooster`

**scoreMultiplier at answer 200:** ≈ 34,400×

**Pre-multiplier pts on a max lucky trigger answer (scoreStar active, all rolls ×5):**

| Step | pts |
|------|-----|
| Base 10 + time bonus (+10) + quick bonus (+30) | 50 |
| × streak ×4 (8+ streak, streakBoost) | 200 |
| × hot zone ×2.5 (adj_hotReveal + reveal) | 500 |
| + echoStreak (200 × (4−1)) | 1,100 |
| + replayHotZone (200 × (2.5−1)) | 1,400 |
| × lucky ×5 | 7,000 |
| × echoLucky ×5 | 35,000 |
| × replayLucky #1 ×5, echo ×5 | 875,000 |
| × replayLucky #2 ×5, echo ×5 | **21,875,000** |
| × scoreStar ×3 | **65,625,000** |

```
finalPts = 65,625,000 × 34,400 ≈ 2.26 × 10¹²

Total added to score (main + multiBooster + 3 × replayScore):
  5 × 2.26 × 10¹² ≈ 1.1 × 10¹³
```

---

## Realistic Score Per Answer

| Scenario | Approximate score added |
|----------|------------------------|
| Regular answer (no lucky, no scoreStar) | ~2 × 10⁸ |
| Average lucky trigger (×3.5 avg per roll, no scoreStar) | ~4 × 10¹¹ |
| Average lucky trigger + scoreStar | ~10¹² |
| Max lucky trigger (all ×5) + scoreStar | **~10¹³** |

**1 × 10¹⁰ per answer** is routinely achievable on lucky trigger answers from around answer 150 onwards. The practical ceiling is **10¹²–10¹³** on best-case lucky+scoreStar turns.

---

## Which Builds Reach the Ceiling

| Build | Max realistic per answer | Notes |
|-------|--------------------------|-------|
| Build 1 — Compound Avalanche | **10¹²–10¹³** | Best overall ceiling; compoundGrowth drives scoreMultiplier to 34k+ |
| Build 2 — Lucky Cascade | 10¹¹–10¹² | cascadeMult grows scoreMultiplier additively (+0.6/trigger); lower ceiling but more consistent burst |
| Build 3 — Replay Storm | 10⁹–10¹⁰ | replayScore multiplies output 4× but lacks lucky burst |
| Build 4 — Chain Reaction | 10⁸–10⁹ | Wide reach (many kills) but low per-answer ceiling |
| Build 5 — Operation Specialist | 10⁸–10⁹ | Consistent doubling; scales well in early antes |

Build 1 + elements of Build 2 (adding `luckyBonus`, `echoLucky`, `replayLucky` to the Compound Avalanche core) is the theoretical maximum configuration. All these upgrades are Run Mode only — Standard Mode has no upgrades.

---

## Probability Note on Lucky Burst Answers

Each lucky roll is uniform ×2–5 (four outcomes). For N rolls all landing ×5:

| Rolls (build) | P(all ×5) | Expected multiplier |
|---------------|-----------|---------------------|
| 1 (luckyBonus only) | 25% | ×3.5 |
| 2 (+ echoLucky) | 6.25% | ×12.25 |
| 4 (+ echoLucky + replayLucky ×1 + echo) | 0.39% | ×150 |
| 6 (+ replayLucky ×2 + echoes) | 0.024% | ~×1,838 |

The all-×5 scenario (6 rolls, probability 1-in-4096) produces the 10¹³ ceiling. The average 6-roll outcome (all ×3.5) produces ~10¹²; both are well above 10¹⁰.
