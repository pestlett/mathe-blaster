# Mathe Blaster! — Run Mode Strategy Guide

This document covers the strongest upgrade combinations for each game mode, how they interact with the scoring engine, and tips for navigating the run-mode shop.

---

## Scoring Basics

Every correct answer starts at **10 base points**, then passes through a chain of multipliers:

1. **Time bonus** (+10 pts if < 3 s, +5 pts if < 6 s)
2. **Quick bonus** (+20–30 pts if < 1.5 s)
3. **Streak multiplier** (up to ×4 at 8-streak)
4. **Hot-zone multiplier** (×1.5 to ×2.5)
5. **Lucky bonus** (×2–×5 trigger)
6. **Global score multiplier** (`scoreMultiplier`, starts at ×1)
7. **Replay score** (re-adds final points N extra times)
8. **Chain kills** (+50% per matching object destroyed)

The global multiplier is the most powerful lever — every upgrade that raises it makes every future answer worth more.

---

## Run Mode Builds

### Build 1 — Compound Avalanche *(Best overall)*

**Goal:** Drive the global `scoreMultiplier` to stratospheric levels via compound growth and hot-zone chains.

| Priority | Upgrade | Reason |
|----------|---------|--------|
| Core | `compoundGrowth` | ×1.02 → ×1.04 per answer (with synergy below) |
| Core | `scoreMultPerfect` | Every hot-zone answer adds ×1.2 to multiplier (cap ×12) |
| Core | `hotZoneBoost` | Widens hot zone from 24% to 45% — more triggers for `scoreMultPerfect` |
| Support | `scoreMultSmall` × 3 | ×1.5 stacked = ×3.375 on global multiplier |
| Support | `scoreMultLarge` × 2 | ×2 stacked = ×4 on global multiplier |
| Economy | `slotExpander` | Fit more multipliers in the slot budget |

**Key synergy:** `compoundGrowth` + `scoreMultPerfect` doubles the compound rate to ×1.04 per answer. After 100 correct answers the multiplier alone reaches ~54×. Combined with stacked `scoreMultSmall`/`scoreMultLarge`, late-game answers can exceed 10,000 pts each.

**Slot layout (6 slots):**
```
[compoundGrowth] [scoreMultPerfect] [hotZoneBoost] [scoreMultSmall] [scoreMultLarge] [scoreMultSmall]
```

**Tips:**
- Buy `hotZoneBoost` first — every hot-zone answer seeds the perfect multiplier early.
- Stack `scoreMultSmall` before `scoreMultLarge`; the small ones are cheaper and stack just as multiplicatively.
- Keep `reveal` if offered — it synergises with `hotZoneBoost` for ×2.5 multiplier on revealed answers.

---

### Build 2 — Lucky Cascade *(Best for burst score)*

**Goal:** Turn lucky triggers into permanent multiplier gains using `cascadeMult`.

| Priority | Upgrade | Reason |
|----------|---------|--------|
| Core | `luckyBonus` | Lucky fires every 5th (or 3rd) answer |
| Core | `cascadeMult` × 3 | Each lucky event: +0.6 to `scoreMultiplier` (with synergy) |
| Core | `luckyFrequency` | Drops lucky threshold from every 5 to every 3 answers |
| Amplifier | `echoLucky` | Fires a second lucky roll (×2–×5 with synergy) |
| Amplifier | `replayLucky` × 2 | Fires 2 extra lucky rolls per trigger |
| Economy | `starterBoost` × 2 | More coins per shop = more upgrades sooner |

**Key synergy:** `cascadeMult` + `luckyBonus` doubles the cascade increment (+0.6 per trigger). With `luckyFrequency` every 3rd answer triggers lucky — that is +0.6 to the global multiplier every 3 answers. After 30 answers the multiplier is ~+6.0 from cascades alone.

**Adjacency to set:**
- Place `cascadeMult` adjacent to `luckyBonus` (`adj_cascadeLucky`): every 3rd lucky trigger also awards +1 coin.
- Place `echoLucky` adjacent to `luckyBonus` (`adj_echoLucky`): echo roll goes uncapped (×2–×5) and fires immediately after the main popup.

**Slot layout (6 slots):**
```
[luckyBonus] [cascadeMult] [cascadeMult] [luckyFrequency] [echoLucky] [replayLucky]
```

**Tips:**
- Prioritise `luckyFrequency` early — reducing the threshold from 5 to 3 roughly doubles your lucky income.
- `replayLucky` stacks: 2–3 stacks mean each trigger fires up to 4 rolls (original + 3 replays) × echo = 8 multipliers per 3 answers.
- Avoid `chain` in this build unless you also have `adj_chainLucky`; otherwise chain kills waste lucky counter ticks.

---

### Build 3 — Replay Storm *(Best for consistent late antes)*

**Goal:** Multiply each scored answer N+1 times with `replayScore` stacks.

| Priority | Upgrade | Reason |
|----------|---------|--------|
| Core | `replayScore` × 3 | Every answer scores 4× (original + 3 replays) |
| Core | `scoreMultLarge` × 2 | ×4 global multiplier on every replay too |
| Support | `streakBoost` | Up to ×4 streak multiplier, applied before replay |
| Support | `quickBonus` | +20–30 pts per fast answer, multiplied by replays |
| Defence | `slowAll` × 2 | Slower objects = more time to stay on streak |
| Economy | `compoundGrowth` | Each replay also raises compound multiplier |

**Key synergy:** `compoundGrowth` + `replayScore` adjacency (`adj_compoundReplay`): each replay adds ×1.01 to the compound growth rate on top of the base ×1.02 — with 3 replays the effective rate is ×1.05 per answer.

**Adjacency to set:**
- Place `streakBoost` adjacent to `quickBonus` (`adj_streakQuick`): keeps the quick-answer window at 1.5 s even alongside `slowAll` (avoids the negative synergy halving it).
- Place `compoundGrowth` adjacent to `replayScore` (`adj_compoundReplay`).

**Slot layout (5 slots):**
```
[replayScore] [replayScore] [replayScore] [scoreMultLarge] [compoundGrowth]
```

**Tips:**
- Avoid `slowAll` + `quickBonus` without `adj_streakQuick` — the negative synergy cuts the quick window in half.
- `replayScore` is expensive (32 coins each); use `starterBoost` to fund early stacks.
- Even a single `replayScore` doubles your effective score per answer — buy it as soon as coins allow.

---

### Build 4 — Chain Reaction *(Best for crowded screens)*

**Goal:** Destroy multiple objects per answer and amplify each kill.

| Priority | Upgrade | Reason |
|----------|---------|--------|
| Core | `chain` | Destroys all objects sharing an answer |
| Core | `commutative` | Answer 3×7 also destroys 7×3 — doubles chain targets |
| Core | `echoChain` | Each chain kill also destroys its commutative mirror |
| Amplifier | `replayChain` | Chain bonus fires twice per answer |
| Amplifier | `luckyBonus` | Chain kills count toward lucky counter |
| Amplifier | `scoreMultLarge` | Global multiplier applies to every chain kill |

**Key synergies:**
- `chain` + `luckyBonus`: chain kills advance the lucky counter. With `adj_chainLucky`, each kill gives 2 ticks — 3 chain kills on one answer fires a lucky roll immediately.
- `echoChain` + `chain`: echo kills score full 50% pts (same as normal chain kills).
- `replayChain` + `chain`: advances lucky counter again on the replay.

**Adjacency to set:**
- Place `chain` adjacent to `luckyBonus` (`adj_chainLucky`): 2 lucky ticks per kill.
- Place `echoChain` adjacent to `chain` (`adj_echoChain`): echo mirror kill counts as a full lucky tick.

**Slot layout (6 slots):**
```
[chain] [luckyBonus] [commutative] [echoChain] [replayChain] [scoreMultLarge]
```

**Tips:**
- Works best on × and ÷ operations where commutative pairs exist.
- The more objects on screen the better — avoid `slowAll` (fewer simultaneous objects) and prefer faster spawn rates.
- Add `multiBooster` or `divideBooster` if playing a single-operation run: each chain kill also fires the ×2 booster.

---

### Build 5 — Operation Specialist *(Best for single-operation runs)*

**Goal:** Stack the ×2 operation booster on top of every other multiplier for a consistent per-answer bonus.

| Priority | Upgrade | Reason |
|----------|---------|--------|
| Core | `multiBooster` OR `divideBooster` | ×2 on all answers of that type |
| Core | `addBooster` + `subtractBooster` | ×2 each + +10 flat pts synergy on every ± answer |
| Support | `replayScore` × 2 | The ×2 booster doubles BEFORE replay, so each replay is already big |
| Support | `streakBoost` | Stack streak on top of the booster |
| Support | `scoreMultSmall` × 2 | Global multiplier amplifies the already-doubled score |

**Key synergy:** `addBooster` + `subtractBooster`: playing a mixed add/subtract game, every answer earns +10 flat pts on top of the ×2 booster. Both boosters are cheap (14 coins each) and pair perfectly in mixed-operations mode.

**Adjacency to set:**
- Place `multiBooster` adjacent to `divideBooster` (`adj_opMasters`): × and ÷ answers each fire a lucky tick — turns every correct answer into a lucky counter advance.

**Tips:**
- `multiBooster` alone is 18 coins and doubles your score — buy it in Ante 1 shop every run.
- If using `divideBooster`, pair it with `commutative` and `chain` (see Build 4) to maximise division kills.
- `addBooster` + `subtractBooster` at 28 coins combined outperforms a single `scoreMultSmall` (22 coins) when playing mixed ± mode.

---

## Standard Mode Notes

Standard Mode (the default "Let's Go!" button) has **no upgrades, no coins, no slots, and no ante targets**. It is focused on learning the times tables and defeating boss levels (which spawn at levels 5, 10, 15, …).

Powerups spawn automatically during play:

| Powerup | Effect |
|---------|--------|
| Score Star (⭐) | Next correct answer scores ×3 |
| Shield | Absorbs the next missed object |
| Freeze | Slows all falling objects temporarily |
| Life Up | Restores one life |
| Lightning | Destroys all current objects |
| Magnet | Pulls all objects to centre |
| Bomb (Space key) | Destroys all objects on screen |

The full scoring formula (base 10 pts, time bonus, streak multiplier, hot-zone multiplier, score star) still applies — powerups are the only source of extra scoring leverage in this mode.

---

## Operation-Specific Tips

| Operation | Best boosters | Best secondary |
|-----------|--------------|----------------|
| × only | `multiBooster`, `chain`, `commutative` | `replayChain`, `streakBoost` |
| ÷ only | `divideBooster`, `chain`, `commutative` | `replayChain`, `reveal` |
| + only | `addBooster`, `streakBoost`, `quickBonus` | `replayScore`, `hotZoneBoost` |
| − only | `subtractBooster`, `streakBoost`, `quickBonus` | `replayScore`, `hotZoneBoost` |
| Mixed ±  | `addBooster` + `subtractBooster` (synergy) | `replayScore`, `streakBoost` |
| Mixed ×÷  | `multiBooster` + `divideBooster` + `adj_opMasters` | `chain`, `commutative` |

---

## Shop Strategy

### Ante 1 → 2 (first free pick)
Always choose one of: `chain`, `streakBoost`, or `hotZoneBoost`. These compound the most over a full run.

### Coins
- Typical earnings per ante: 12–18 coins (3 levels, ~30% hot-zone rate, 1–2 streak milestones).
- `starterBoost` (15 coins, max 3 stacks) pays for itself in 1 ante.
- Reroll (8 coins) is only worthwhile if your current three cards are all defensive (shields/bombs) and you have a clear build direction.

### Selling
Sell early defensive picks (`shield`, `bomb`) once the run is stable. A `shield` sells for 3 coins, a `bomb` for 3 coins — enough to fund a partial upgrade purchase. Never sell a multiplier upgrade mid-run.

### Slot pressure
Default 4 slots fills up fast. Buy `slotExpander` (25 coins) when you have 3–4 upgrades and a clear direction for a 5th — do not buy it speculatively in Ante 1.

---

## Ante Target Reference

| Ante | Delta score needed |
|------|--------------------|
| 1    | 150 pts            |
| 2    | 350 pts            |
| 3    | 650 pts            |
| 4    | 1 050 pts          |
| 5    | 1 500 pts          |
| 6    | 1 950 pts          |
| 7+   | 1 050 + (ante−4) × 450 pts |

Antes 5+ require late-game scaling. Build 1 (Compound Avalanche) and Build 2 (Lucky Cascade) are the only builds reliably capable of clearing Ante 7+.
