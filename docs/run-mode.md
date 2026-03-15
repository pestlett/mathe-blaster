# Run Mode

Run mode is a roguelike layer on top of the standard game. Enabled via
`settings.runMode = true`.

## Structure

```
Ante 1
  ├── Level 1
  ├── Level 2
  └── Level 3 → Ante check → Shop (buy/sell/reroll) → Ante 2
Ante 2
  ├── Level 4
  ├── Level 5 (boss)
  └── Level 6 → Ante check → Shop → Ante 3
...
```

Every 3 levels: check if player scored enough points, then open the shop.
Fail the ante check → run ends (regardless of remaining lives).

## Shop Economy

The shop replaces the old free upgrade picker. Upgrades now cost **coins**.

### Coin Earn Rates

| Source | Coins |
|--------|-------|
| Correct answer | +1 |
| Hot-zone correct | +1 extra |
| 5-streak milestone | +3 |
| Chain kill (per extra object) | +1 |
| Ante cleared | +5 |
| Level 2★ | +1 |
| Level 3★ | +2 |
| `starterBoost` upgrade (per stack) | +3 extra per ante |
| `adj_multStack` adjacency bonus | +1 extra per ante |

### Shop Mechanics

- **3 upgrade cards** drawn from the full pool (start + unlock + shop tiers)
- **Buy**: costs coins shown on the card; 1 purchase allowed per shop visit
- **Free pick**: the very first ante (ante 1→2) grants one free pick
- **Sell**: any owned upgrade can be sold for its `sellValue` (coins returned immediately)
- **Reroll**: costs 4 coins, draws 3 fresh cards; flat cost (doesn't increase)
- **Done**: close shop without buying (sells still apply)

## Ante Score Targets

```
Ante 1:  150 pts
Ante 2:  350 pts
Ante 3:  650 pts
Ante 4: 1050 pts
Ante 5+: 1050 + (ante-4) × 450 pts
```

Score is measured from the start of each ante (delta score, not total).

## Upgrades

12 upgrades total: 8 available from the start, 4 unlocked via milestones.

### Starting Upgrades (tier: 'start')

| ID | Icon | Effect |
|----|------|--------|
| `chain` | ⛓ | Correct answer destroys all objects sharing that answer |
| `streakBoost` | ✴ | Streak multipliers: 3+: ×2, 5+: ×3, 8+: ×4 |
| `shield` | 🛡 | Absorb next miss without losing a life (stackable) |
| `slowAll` | 🌀 | All objects fall at 75% speed (stackable, floor 40%) |
| `bomb` | 💣 | Press Space to destroy the lowest object (stackable) |
| `hotZoneBoost` | 🔥 | Hot zone widens from 24% to 45% of screen height |
| `luckyBonus` | 🍀 | Every 5th correct answer: random ×2–×5 multiplier |
| `quickBonus` | ⚡ | Answer within 1.5s: +20 bonus points |

### Unlockable Upgrades (tier: 'unlock')

| ID | Icon | Unlock condition | Effect |
|----|------|-----------------|--------|
| `commutative` | 🔁 | 3 runs completed | Answer 3×7 also destroys 7×3 |
| `streakSlow` | ❄ | max streak ≥ 8 | 5-streak: all objects at 60% for 5s |
| `reveal` | 👁 | 5 bosses defeated | Lowest object reveals answer for 1s on hot zone entry |
| `lastChance` | 💫 | 10 runs completed | 4th miss destroys all objects (once per run) |

Upgrade unlock status is persisted in `progress.run.unlockedUpgrades`.

### Shop Upgrade Pricing

All upgrades now have `price` and `sellValue` fields. Shop-tier upgrades are
only available through the shop (never in `drawUpgrades` for legacy free picks).

| ID | Price | Sell | Stackable |
|----|-------|------|-----------|
| `scoreMultSmall` | 10 | 5 | ✓ |
| `scoreMultLarge` | 16 | 9 | ✓ |
| `scoreMultPerfect` | 12 | 6 | — |
| `echoLucky` | 11 | 6 | — |
| `echoChain` | 10 | 5 | — |
| `echoStreak` | 9 | 5 | — |
| `starterBoost` | 7 | 4 | ✓ |
| `replayScore` | 14 | 7 | ✓ |
| `replayLucky` | 11 | 6 | ✓ |
| `replayChain` | 9 | 5 | — |
| `replayHotZone` | 10 | 5 | — |
| `replayStreak` | 8 | 4 | — |

### Shop Upgrade Effects

**Multipliers** — scale all score earned this run:

| ID | Effect |
|----|--------|
| `scoreMultSmall` | ×1.5 all score. Each stack multiplies again (×2.25, ×3.375…) |
| `scoreMultLarge` | ×2 all score. Stacks multiplicatively |
| `scoreMultPerfect` | Each hot-zone answer ramps `scoreMultiplier` ×1.2 (cap ×8; raised to ×12 with `hotZoneBoost`) |

**Echoes** — cause a specific effect to fire again:

| ID | Effect |
|----|--------|
| `echoLucky` | Lucky Bonus fires a second time (echo capped ×3; synergy with `luckyBonus` uncaps to ×5) |
| `echoChain` | Each chain kill also destroys the commutative mirror fact if on screen |
| `echoStreak` | Hot-zone answers: streak multiplier bonus applied a second time as a flat addition |
| `starterBoost` | +3 coins at the start of each shop visit. Stacks |

**Replays** — repeat a scoring action:

| ID | Effect |
|----|--------|
| `replayScore` | After main scoring, award `finalPts` again. Each stack adds one more replay |
| `replayLucky` | Lucky Bonus fires N extra times when triggered. Each stack adds one roll |
| `replayChain` | After chain kills, the chain bonus (pts × 0.5 × count) fires a second time |
| `replayHotZone` | Hot-zone answers apply the hot-zone multiplier a second time as a flat bonus |
| `replayStreak` | When a streak threshold is crossed (3/5/8), the current answer's `finalPts` are awarded again |

## Synergies

When both upgrades in a pair are active, additional effects apply:

| Pair | Type | Effect |
|------|------|--------|
| `chain` + `luckyBonus` | positive | Chain kills count toward lucky counter |
| `streakBoost` + `quickBonus` | positive | Fast answers on streak: +30 pts instead of +20 |
| `hotZoneBoost` + `reveal` | positive | Revealed object in hot zone: ×2 instead of ×1.5 |
| `slowAll` + `quickBonus` | negative | Quick-answer window halves to 0.75s |
| `streakSlow` + `slowAll` | negative | Streak-slow duration shrinks from 5s to 2s |
| `echoLucky` + `luckyBonus` | positive | Echo roll gets full ×2–×5 range instead of capped ×3 |
| `echoChain` + `chain` | positive | Echo chain kills also award 50% pts |
| `echoStreak` + `streakBoost` | positive | Echo streak bonus uses boosted multiplier values |
| `scoreMultLarge` + `scoreMultSmall` | positive | Stacked multipliers: +10 flat pts per answer |
| `scoreMultPerfect` + `hotZoneBoost` | positive | Perfect multiplier cap raised ×8→×12 |
| `echoLucky` + `chain` | negative | Echo lucky cannot fire on chain-triggered lucky events |
| `replayLucky` + `echoLucky` | positive | Echo fires on each replay lucky roll too |
| `replayChain` + `chain` | positive | Replay chain kills also advance the lucky counter |

## Adjacency Bonuses

Extra effects when two upgrades are **neighbours** in the upgrade bar. Players
can reorder upgrades between rounds to activate/deactivate these.

| Pair | Flag | Effect |
|------|------|--------|
| `chain` + `luckyBonus` | `adj_chainLucky` | Chain kills feed 2 lucky ticks |
| `streakBoost` + `quickBonus` | `adj_streakQuick` | Conflict suppressed — quick window stays 1.5s |
| `shield` + `bomb` | `adj_shieldBomb` | Each shield absorb refunds 1 bomb charge |
| `hotZoneBoost` + `reveal` | `adj_hotReveal` | Precision Lock multiplier: ×2.5 |
| `streakSlow` + `slowAll` | `adj_slowSlow` | Conflict partially offset — streak-slow lasts 3s |
| `echoLucky` + `luckyBonus` | `adj_echoLucky` | Echo roll uncapped (×2–×5) AND fires right after main popup |
| `scoreMultSmall` + `scoreMultLarge` | `adj_multStack` | +1 bonus coin per ante when both adjacent |
| `echoChain` + `chain` | `adj_echoChain` | Echo chain mirror kill counts as a full lucky tick |
| `echoStreak` + `quickBonus` | `adj_echoQuick` | Echo streak fires on any quick-bonus answer too |

Adjacency is computed by `getAdjacencyBonuses(upgrades)` in `upgrades.js` and
stored in `state.adjacencyBonuses` (a `Set` of flag strings).

## State Flags (on game state)

All upgrade flags live on `state` and default to off. `apply(state)` mutates them:

```js
state.chainAnswer        // boolean
state.streakBoost        // boolean
state.shieldCharges      // number (stackable)
state.speedMult          // number (1.0 base, 0.75 per slowAll stack)
state.bombCharges        // number (stackable)
state.hotZoneBoost       // boolean
state.luckyBonus         // boolean
state.luckyBonusCounter  // number (0–4, resets at 5)
state.quickBonus         // boolean
state.commutativePair    // boolean
state.streakSlow         // boolean
state.streakSlowTimer    // number
state.streakSlowDuration // number (5s default, modified by synergy)
state.revealOnHotZone    // boolean
state.lastChanceAvailable // boolean
state.lastChanceUsed     // boolean
// Shop economy
state.runCoins           // number — current coin balance
state.bonusCoinPerAnte   // number — bonus coins per ante (from starterBoost)
state.shopBuysThisRun    // number — count of shop purchases (for achievement)
// Score multiplier
state.scoreMultiplier    // number (1.0 base; multiplied by scoreMultSmall/Large)
state.perfectMultEnabled // boolean (from scoreMultPerfect)
// Echoes
state.echoLucky          // boolean
state.echoChain          // boolean
state.echoStreak         // boolean
// Replays
state.replayCount        // number — extra score replays (replayScore stacks)
state.replayLuckyCount   // number — extra lucky rolls (replayLucky stacks)
state.replayChain        // boolean
state.replayHotZone      // boolean
state.replayStreak       // boolean
```

## Adding a New Upgrade

See `docs/adding-features.md` → "New Upgrade Checklist".
