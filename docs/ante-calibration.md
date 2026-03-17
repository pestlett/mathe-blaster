# Ante Target Calibration — Monte Carlo Analysis

This document records the findings of a Monte Carlo simulation study used to calibrate
run-mode ante score targets. Refer back here when adjusting targets or adding new
upgrade mechanics that affect score scaling.

**Simulation script:** `simulate-runmode.js` (project root)
**Last run:** 2025-03 — 2 000 simulated runs, 5 upgrade paths, 10 antes

---

## How the Simulation Works

`simulate-runmode.js` plays through run-mode purely in JavaScript — no browser, no canvas.
For each simulated answer it:

1. Samples a **lognormal response time** (median ~1.8 s, σ = 0.45 on the log scale) to
   model realistic child response times.
2. Assigns a **hot-zone hit** with ~35% probability (50% when `hotZoneBoost` active).
3. Runs the **exact scoring formula** from `js/main.js`: time bonus → quick bonus →
   streak multiplier → hot-zone ×1.5 → lucky bonus → global `scoreMultiplier`.
4. If `compoundGrowth` is active, multiplies `scoreMultiplier` by ×1.5 after every
   answer — the multiplier carries over between antes exactly as it does in the real game.
5. Applies a **~12% streak-reset chance per level** (models a missed object).

Each run plays until it fails an ante check or reaches the configured maximum ante.

---

## Upgrade Paths Modelled

Five representative paths were tested. Each path is a snapshot of which upgrades are
active at the start of each ante, mirroring realistic shop sequences given the coin economy
(~15–20 coins earned per ante).

| Path | Upgrades bought | Compound growth? |
|------|----------------|-----------------|
| **No upgrades** | Nothing | No |
| **Streak only** | streakBoost (free pick, ante 2) | No |
| **Mult stack** | streakBoost → quickBonus + hotZoneBoost → scoreMultSmall (×1.5 per ante) | No |
| **Compound (slow)** | streakBoost → quickBonus → compoundGrowth (bought after ante 3, 35 coins) | Yes, from ante 4 |
| **Compound (fast)** | streakBoost + quickBonus → compoundGrowth (bought after ante 2, requires saving) | Yes, from ante 3 |

---

## Score Distributions (no target applied)

Per-ante delta scores across 2 000 runs per path.
`scoreMultiplier` carries between antes — these numbers grow exponentially once
`compoundGrowth` is active.

### No upgrades
| Ante | p10 | p50 | p90 |
|------|-----|-----|-----|
| 1 | 1.2k | 1.3k | 1.4k |
| 2–4 | 1.2k | 1.3k | 1.4k |

No upgrade path produces flat ~1.2–1.4k per ante indefinitely.

### Streak only (streakBoost active from ante 2)
| Ante | p10 | p50 | p90 |
|------|-----|-----|-----|
| 1 | 1.2k | 1.3k | 1.4k |
| 2+ | 3.5k | 4.1k | 4.8k |

~3× improvement over no-upgrades; flat across all antes.

### Mult stack (scoreMultSmall added each ante)
| Ante | p10 | p50 | p90 | Active mult |
|------|-----|-----|-----|------------|
| 1 | 1.2k | 1.3k | 1.4k | ×1.0 |
| 2 | 2.4k | 2.7k | 2.9k | ×1.0 (streak) |
| 3 | 3.7k | 4.4k | 5.1k | ×1.0 + hotZone |
| 4 | 5.7k | 6.6k | 7.7k | ×1.5 |
| 5 | ~8k | ~10k | ~12k | ×2.25 |
| 6 | ~15k | ~19k | ~23k | ×4.5 |

Linear growth — doubles roughly every 2 antes. Caps out under 25k with realistic coin budgets.

### Compound (slow) — compoundGrowth from ante 4
| Ante | p10 | p50 | p90 |
|------|-----|-----|-----|
| 1 | 1.2k | 1.3k | 1.4k |
| 2 | 2.4k | 2.7k | 2.9k |
| 3 | 3.5k | 4.2k | 4.8k |
| 4 | 38M | 53M | 73M |
| 5 | 7.8T | 10.8T | 14.8T |
| 6 | 2.5E | 3.8E | 6.9E |
| 7 | 471Z | 699Z | 1.3Y |
| 8 | 103kY | 158kY | 264kY |
| 9 | 20GY | 30GY | 51GY |
| 10 | 3.9PY | 5.8PY | 9.8PY |

Each ante multiplies the previous ante's score by roughly **1.5³⁰ ≈ 191,751×** (the
scoreMultiplier carry-over from 30 compound answers).

### Compound (fast) — compoundGrowth from ante 3
| Ante | p10 | p50 | p90 |
|------|-----|-----|-----|
| 1 | 1.2k | 1.3k | 1.4k |
| 2 | 3.5k | 4.2k | 4.8k |
| 3 | 38M | 53M | 73M |
| 4 | 12.9T | 19.2T | 35T |
| 5 | 2.6E | 3.8E | 6.5E |
| 6+ | ~191,751× the previous ante score |

Compound fast is exactly one ante's worth of compound growth ahead of compound slow
(ratio ≈ 191,751× at every ante from ante 4 onward).

### Notation used in this document
| Symbol | Value |
|--------|-------|
| k | 10³ |
| M | 10⁶ |
| G | 10⁹ |
| T | 10¹² |
| P (Peta) | 10¹⁵ |
| E (Exa) | 10¹⁸ |
| Z (Zetta) | 10²¹ |
| Y (Yotta) | 10²⁴ |
| GY | 10³³ |
| PY | 10³⁹ |

---

## Analysis of Current Targets

Current targets (as of the simulation run): 150 / 350 / 650 / 50k / 500k / 5M / 50M / 500M / 5G / 50G

### Findings

| Ante | Target | No-upg median | ×Needed (no upg) | Verdict |
|------|--------|--------------|-----------------|---------|
| 1 | 150 | 1.3k | 0.1× | Trivially easy — p10 score is 8× above target |
| 2 | 350 | 1.3k | 0.3× | Trivially easy |
| 3 | 650 | 1.3k | 0.5× | Trivially easy — even p1 score exceeds target |
| 4 | 50k | 1.3k | **37×** | Impossible without compound growth |
| 5+ | 500k–50G | 1.3k | 371×–37k× | Impossible without compound growth |

**Problem 1 — Antes 1–3 are vestigial.**
100% of every upgrade path passes them. A player would have to actively ignore the game to fail.
The targets serve no gameplay function.

**Problem 2 — The jump from ante 3 to ante 4 is a vertical cliff (77× step).**
There is no intermediate difficulty where a player with linear upgrades (scoreMultSmall/Large stacks)
faces meaningful challenge. Mult stack's best ante 4 score is ~6.7k vs a 50k target — 7× short.

**Problem 3 — Antes 5–10 targets are irrelevant for compound players.**
Compound slow players score 38–73M at ante 4 vs a 50k target. The targets never catch up to
compound growth's exponential trajectory. From ante 4 onward, 100% of compound runs pass every
current target, removing all tension from the late game.

---

## Proposed Balanced Targets

### Design intent

| Ante | Goal |
|------|------|
| 1–2 | True "training wheels" — any play style passes, including distracted children |
| 3 | Reward deliberate play — needs at least streak+quick combo |
| 4 | **Compound gate** — `compoundGrowth` is required; all linear builds eliminated |
| 5–10 | Steady ~10% attrition per ante for compound-slow players; real tension |
| All | Compound-fast path (aggressively buy compound at ante 2 shop) is near-invincible — reward for optimal play |

### Proposed target values

| Ante | Target | Scientific |
|------|--------|-----------|
| 1 | **700** | 7 × 10² |
| 2 | **1 500** | 1.5 × 10³ |
| 3 | **3 500** | 3.5 × 10³ |
| 4 | **30 000 000** | 3 × 10⁷ |
| 5 | **8 000 000 000 000** | 8 × 10¹² |
| 6 | **3 000 000 000 000 000 000** | 3 × 10¹⁸ |
| 7 | **500 000 000 000 000 000 000 000** | 5 × 10²³ |
| 8 | **100 000 000 000 000 000 000 000 000 000** | 10²⁹ |
| 9 | **2 × 10³⁴** | 2 × 10³⁴ |
| 10 | **4 × 10³⁹** | 4 × 10³⁹ |

Ante 4 target (30M) is set at roughly the p25 of compound-slow scores (38M p10, 53M p50),
giving ~75% pass rate — hard but survivable.
Antes 5–10 targets are each set at roughly the p25–30 of compound-slow scores at that ante,
maintaining consistent ~70–80% pass rate per ante for compound-slow players.

### Survival curves under proposed targets

| Ante | No upg | Streak | Mult stack | Compound slow | Compound fast |
|------|--------|--------|------------|--------------|--------------|
| 1 | 100% | 100% | 100% | 100% | 100% |
| 2 | 1% | 100% | 100% | 100% | 100% |
| 3 | 0% | 91% | 96% | 91% | 100% |
| 4 | — | 0% | 0% | 90% | 100% |
| 5 | — | — | — | 79% | 100% |
| 6 | — | — | — | 61% | 100% |
| 7 | — | — | — | 54% | 100% |
| 8 | — | — | — | 49% | 100% |
| 9 | — | — | — | 44% | 100% |
| 10 | — | — | — | 39% | 100% |

"Survival" = cumulative % of all runs that passed this ante (not just reached it).

**Key properties of this curve:**

- Ante 2 kills no-upgrade runs cleanly — removes trivial passes from antes 1–3.
- Ante 3 acts as a skill gate (~91% pass) rather than a free skip.
- Ante 4 is the mandatory upgrade gate — compound growth is the only path through.
- Antes 5–10 create steady attrition (~10% of compound-slow runs eliminated per ante),
  so only the best ~39% of compound-slow runs reach ante 10.
- Compound-fast runs are effectively invincible through ante 10 — this is the
  reward for the player who commits to buying `compoundGrowth` after ante 2.

---

## Key Design Constraints

### 1. compoundGrowth is the only viable path to ante 4+

The simulation confirms that no combination of linear multipliers (`scoreMultSmall`,
`scoreMultLarge`) can accumulate enough multiplier in 3 shop visits to clear the ante 4 target.

With the full realistic coin budget and optimal linear buying:
- Ante 4 mult-stack median score: ~6.6k (target: 30M → gap of 4,500×)
- The maximum linear multiplier achievable in 3 shops: ~×4.5 (scoreMultSmall + 2× scoreMultLarge)
- Required: ×22 to clear 30M from a base of ~1.3k

`compoundGrowth` (×1.5 per answer) is the only realistic source of ×22+. Cost: 35 coins.
Earliest viable purchase: after ante 3 (accumulate ~50 coins across three antes).

### 2. compoundGrowth's ×1.5/answer rate dominates all other mechanics

Starting from `scoreMultiplier = 1.0` with 30 answers per ante:

```
Score per compound ante ≈ base_pts × Σ(1.5^i for i=0..29)
                        ≈ base_pts × (1.5^30 − 1) / 0.5
                        ≈ base_pts × 383,000
```

At ante 4 (first compound ante, base ~34 pts/answer):
`34 × 383,000 ≈ 13M` (simulation shows 38–73M because streakBoost/quickBonus raise base pts).

The carried-over `scoreMultiplier` at the start of each subsequent ante is `1.5^(30×N)` where
N is the number of antes with compound active. This means scores grow by a factor of ~192,000
per ante — no fixed ante target can remain challenging across more than ~2–3 antes of compound play.

### 3. Compound-fast vs compound-slow are separated by exactly one ante's growth

Compound-fast (compound from ante 3) is always ~192,000× ahead of compound-slow (ante 4)
at any given ante. This gap cannot be closed by target calibration — any target that challenges
compound-slow will be 192,000× below compound-fast scores.

### 4. NaN / Infinity is theoretically reachable

JavaScript's `Number.MAX_VALUE` is `~1.8 × 10^308`. With compound growth the `scoreMultiplier`
grows as `1.5^(30N)` after N compound antes. `scoreMultiplier` hits `MAX_VALUE` when:

```
30N × log₁₀(1.5) ≥ 308
N ≥ 308 / (30 × 0.176) ≈ 58 antes of compound growth
```

This means approximately **ante 62** (compound since ante 4) or **ante 61** (compound since
ante 3). Beyond that point, `scoreMultiplier` becomes `Infinity` and scores become `Infinity`.
With `cascadeMult` and `luckyBonus` adding to the multiplier additively, the rate increases
and Infinity can be reached somewhat earlier.

---

## Running the Simulation

```bash
node simulate-runmode.js [--runs N] [--antes N]
```

Default: 2 000 runs, 10 antes.

To test a modified target curve, edit the `balanced` array in `TARGET_CURVES` inside the
script. The curve is zero-indexed from ante 0 (always 0) through ante 10:

```js
balanced: [0, 700, 1500, 3500, 30e6, 8e12, 3e18, 500e21, 100e27, 20e33, 4e39],
//          ↑   ↑     ↑     ↑      ↑      ↑     ↑      ↑       ↑      ↑     ↑
//         a0  a1    a2    a3     a4     a5    a6     a7      a8     a9   a10
```

The simulation's upgrade paths (`PATH_COMPOUND`, `PATH_MULTSTACK`, etc.) are defined in the
same file and can be tuned to model new upgrade mechanics.

---

## Decisions Still Open

| Question | Notes |
|----------|-------|
| Should the ante 2 target kill no-upgrades? | Currently 1% survive to ante 2 under balanced curve. May be too harsh for first-time players who haven't touched the shop yet. Alternative: keep ante 2 target at 350 (current) and only raise ante 3+. |
| Should mult-stack have a longer runway? | Currently eliminated at ante 4. Would require reducing ante 4 target significantly (to ~5k) OR making linear multipliers cheaper/stronger. |
| Should compound-fast be challenged at ante 8+? | Currently 100% pass rate through ante 10. To add challenge, ante 8+ targets would need to be ~192,000× higher than current balanced targets (since compound-fast is always 192,000× ahead of compound-slow). |
| Ante 3 target: 3 500 vs lower | With streakBoost+quickBonus the median score is ~4.1k and p10 is ~3.5k. A 3 500 target creates ~10% fail rate. If this is too punishing for a child-facing game, consider 2 800–3 000. |
| How to display astronomical targets in the HUD? | Targets beyond 10⁹ (1B) need abbreviated display. Current fmtN() in the simulation shows Z/Y/etc. The game's HUD may need similar notation. |
