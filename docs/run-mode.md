# Run Mode

Run mode is a roguelike layer on top of the standard game. Enabled via
`settings.runMode = true`.

## Structure

```
Ante 1
  ├── Level 1
  ├── Level 2
  └── Level 3 → Ante check → Upgrade picker → Ante 2
Ante 2
  ├── Level 4
  ├── Level 5 (boss)
  └── Level 6 → Ante check → Upgrade picker → Ante 3
...
```

Every 3 levels: check if player scored enough points, then offer an upgrade.
Fail the ante check → run ends (regardless of remaining lives).

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

## Synergies

When both upgrades in a pair are active, additional effects apply:

| Pair | Type | Effect |
|------|------|--------|
| `chain` + `luckyBonus` | positive | Chain kills count toward lucky counter |
| `streakBoost` + `quickBonus` | positive | Fast answers on streak: +30 pts instead of +20 |
| `hotZoneBoost` + `reveal` | positive | Revealed object in hot zone: ×2 instead of ×1.5 |
| `slowAll` + `quickBonus` | negative | Quick-answer window halves to 0.75s |
| `streakSlow` + `slowAll` | negative | Streak-slow duration shrinks from 5s to 2s |

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

Adjacency is computed by `getAdjacencyBonuses(upgrades)` in `upgrades.js` and
stored in `state.adjacencyBonuses` (a `Set` of flag strings).

## State Flags (on game state)

All upgrade flags live on `state` and default to off. `apply(state)` mutates them:

```js
state.chainAnswer       // boolean
state.streakBoost       // boolean
state.shieldCharges     // number (stackable)
state.speedMult         // number (1.0 base, 0.75 per slowAll stack)
state.bombCharges       // number (stackable)
state.hotZoneBoost      // boolean
state.luckyBonus        // boolean
state.luckyBonusCounter // number (0–4, resets at 5)
state.quickBonus        // boolean
state.commutativePair   // boolean
state.streakSlow        // boolean
state.streakSlowTimer   // number
state.streakSlowDuration // number (5s default, modified by synergy)
state.revealOnHotZone   // boolean
state.lastChanceAvailable // boolean
state.lastChanceUsed    // boolean
```

## Adding a New Upgrade

See `docs/adding-features.md` → "New Upgrade Checklist".
