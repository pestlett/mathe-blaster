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

Coins are earned for **skilled play** — not every answer. This keeps the economy tighter and purchases meaningful.

| Source | Coins |
|--------|-------|
| Hot-zone correct answer | +1 |
| 5-streak milestone | +2 |
| Ante cleared | +5 |
| Level 2★ | +1 |
| Level 3★ | +2 |
| `starterBoost` upgrade (per stack) | +3 extra per ante |
| `coinOnPerfect` upgrade | +1 extra per hot-zone answer |
| `coinOnStreak` upgrade | +1 extra per streak milestone |
| `coinOnStar` upgrade | double star coins (2★ → +2, 3★ → +4) |
| `adj_multStack` adjacency bonus | +1 extra per ante |
| `adj_cascadeLucky` adjacency bonus | +1 per 3rd lucky trigger |

Typical per-ante earnings: **12–18 coins** (3 levels, ~30 answers, ~30% hot zone hits, 1–2 streak milestones).

### Shop Mechanics

- **3 upgrade cards** drawn from the full pool (start + unlock + shop tiers) using **rarity-weighted sampling**
- **Buy**: costs coins shown on the card; **unlimited purchases** per visit (limited by slot count and coins)
- **Slot limit**: active upgrades capped at `state.maxUpgradeSlots` (default 4); buy `slotExpander` to increase
- **Free pick**: the very first ante (ante 1→2) grants one free pick
- **Sell**: any owned upgrade can be sold for its `sellValue` (coins returned immediately)
- **Reroll**: costs 8 coins, draws 3 fresh cards; flat cost (doesn't increase)
- **Done**: close shop without buying (sells still apply)

### Rarity System

Every upgrade has a `rarity` field that controls how often it appears in shop draws.

| Rarity | Weight | Frequency | Visual |
|--------|--------|-----------|--------|
| `common` | 6 | ~60% of draws | No badge |
| `uncommon` | 3 | ~30% of draws | Teal badge + teal card border |
| `rare` | 1 | ~10% of draws | Gold badge + gold card border + glow |

Weighted sampling is done without replacement within a single shop draw, so three cards can still include multiple rarities. Common upgrades include all 8 start-tier upgrades, echo upgrades, op boosters, and starterBoost. Rare upgrades include `scoreMultLarge`, `coinOnStar`, `compoundGrowth`, and `surge`.

## Ante Score Targets

```
Ante 1:    150 pts
Ante 2:    350 pts
Ante 3:    650 pts
Ante 4:  50,000 pts
Ante 5+: 50,000 × 10^(ante-4) pts
```

Score is measured from the start of each ante (delta score, not total).

## Ante Feedback

- The HUD shows a dedicated ante card with the **current ante score** versus the
  **target score** (for example `84 / 350`).
- The ante card fills as score is earned and changes colour when the run is
  comfortably on pace, slipping behind, or close to failing.
- When a new ante begins, the card animates so the new target is easy to spot
  before the shop opens.
- Run-mode music now uses the same ante pacing signal:
  - **calm** when the player is on pace
  - **tense** when they are falling behind
  - **urgent** when the current ante is close to failing

Lives, bosses, freeze, and hopeful pickups still override this when they are
more important than ante pressure.

## Upgrades

36 upgrades total: 8 available from the start, 4 unlocked via milestones, 24 shop-tier.

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

All upgrades have `price`, `sellValue`, and `operations` fields. Shop-tier upgrades are
only available through the shop (never in `drawUpgrades` for legacy free picks).
Prices are set high enough that a 10–15 level run funds 2–4 carefully chosen upgrades.

**Starting/unlock tier:**

| ID | Price | Sell | Operations |
|----|-------|------|------------|
| `chain` | 10 | 5 | all |
| `streakBoost` | 10 | 5 | all |
| `shield` | 7 | 3 | all (stackable) |
| `slowAll` | 9 | 4 | all (stackable) |
| `bomb` | 7 | 3 | all (stackable) |
| `hotZoneBoost` | 10 | 5 | all |
| `luckyBonus` | 12 | 6 | all |
| `quickBonus` | 9 | 4 | all |
| `commutative` | 14 | 7 | ×, ÷ |
| `streakSlow` | 12 | 6 | all |
| `reveal` | 12 | 6 | all |
| `lastChance` | 16 | 8 | all |

**Shop tier (all available in shop regardless of milestones):**

| ID | Price | Sell | Stackable | Operations |
|----|-------|------|-----------|------------|
| `scoreMultSmall` | 22 | 11 | ✓ | all |
| `scoreMultLarge` | 38 | 19 | ✓ | all |
| `scoreMultPerfect` | 28 | 14 | — | all |
| `echoLucky` | 25 | 12 | — | all |
| `echoChain` | 22 | 11 | — | ×, ÷ |
| `echoStreak` | 20 | 10 | — | all |
| `starterBoost` | 15 | 7 | ✓ | all |
| `coinOnStreak` | 18 | 9 | — | all |
| `coinOnPerfect` | 20 | 10 | — | all |
| `coinOnStar` | 30 | 15 | — | all |
| `replayScore` | 32 | 16 | ✓ | all |
| `replayLucky` | 25 | 12 | ✓ | all |
| `replayChain` | 20 | 10 | — | ×, ÷ |
| `replayHotZone` | 22 | 11 | — | all |
| `replayStreak` | 18 | 9 | — | all |
| `slotExpander` | 25 | 12 | ✓ | all |
| `multiBooster` | 18 | 9 | — | × only |
| `divideBooster` | 18 | 9 | — | ÷ only |
| `addBooster` | 14 | 7 | — | + only |
| `subtractBooster` | 14 | 7 | — | − only |
| `cascadeMult` | 30 | 15 | ✓ | all |
| `compoundGrowth` | 35 | 17 | — | all |
| `luckyFrequency` | 26 | 13 | — | all |
| `surge` ⭐ rare | 50 | 25 | — | all |

### Shop Upgrade Effects

**Multipliers** — scale all score earned this run:

| ID | Effect |
|----|--------|
| `scoreMultSmall` | ×1.5 all score. Each stack multiplies again (×2.25, ×3.375…) |
| `scoreMultLarge` | ×2 all score. Stacks multiplicatively |
| `scoreMultPerfect` | Each hot-zone answer ramps `scoreMultiplier` ×1.2 (cap ×8; raised to ×12 with `hotZoneBoost`) |

**Operation Boosters** — double score for a specific operation:

| ID | Effect |
|----|--------|
| `multiBooster` | × answers score ×2 (awards `finalPts` a second time). No effect on other ops |
| `divideBooster` | ÷ answers score ×2. No effect on other ops |
| `addBooster` | + answers score ×2. No effect on other ops |
| `subtractBooster` | − answers score ×2. No effect on other ops |

**Exponential Mechanics** — compound score into the millions and billions:

| ID | Effect |
|----|--------|
| `cascadeMult` | Each Lucky Bonus permanently raises `scoreMultiplier` by +0.3 per stack. With synergy (adj): +0.6 |
| `compoundGrowth` | `scoreMultiplier` grows ×1.5 after every correct answer. With synergy: ×2.25 |
| `luckyFrequency` | Lucky Bonus threshold reduced from every 5 answers to every 3 |
| `surge` ⭐ **rare** | One-time activation: immediately multiplies `scoreMultiplier` by ×3. Most powerful single purchase in the shop — buy it whenever it appears |

**Slot Expander:**

| ID | Effect |
|----|--------|
| `slotExpander` | `state.maxUpgradeSlots` +1 (default 4; max limited by `stackable` application) |

**Echoes** — cause a specific effect to fire again:

| ID | Effect |
|----|--------|
| `echoLucky` | Lucky Bonus fires a second time (echo capped ×3; synergy with `luckyBonus` uncaps to ×5) |
| `echoChain` | Each chain kill also destroys the commutative mirror fact if on screen |
| `echoStreak` | Hot-zone answers: streak multiplier bonus applied a second time as a flat addition |
| `starterBoost` | +3 coins at the start of each shop visit. Stacks |
| `coinOnStreak` | +1 extra coin at every streak milestone (on top of the base +2) |
| `coinOnPerfect` | +1 extra coin for every hot-zone answer (doubles the hot-zone drip) |
| `coinOnStar` | Star rating coins doubled: 2★ → +2 coins, 3★ → +4 coins |

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
| `multiBooster` + `scoreMultSmall` | positive | × questions get ×1.5 extra on top of the ×2 booster |
| `cascadeMult` + `luckyBonus` | positive | Lucky cascade adds ×0.6 instead of ×0.3 per stack |
| `compoundGrowth` + `scoreMultPerfect` | positive | Compound growth rate doubles (×2.25 per answer) |
| `luckyFrequency` + `replayLucky` | positive | More frequent lucky rolls create more replay opportunities |
| `addBooster` + `subtractBooster` | positive | Arithmetic mastery: +10 flat pts on every +/− answer |

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
| `cascadeMult` + `luckyBonus` | `adj_cascadeLucky` | Every 3rd lucky trigger awards +1 coin |
| `compoundGrowth` + `replayScore` | `adj_compoundReplay` | Each replay also adds ×1.1 compound growth |
| `multiBooster` + `divideBooster` | `adj_opMasters` | × and ÷ answers also fire a lucky tick |

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
state.coinOnStreak       // boolean — +1 coin at each streak milestone
state.coinOnPerfect      // boolean — +1 extra coin per hot-zone answer
state.coinOnStar         // boolean — star rating coins doubled
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
// Slot system
state.maxUpgradeSlots    // number (default 4, +1 per slotExpander)
// Operation boosters
state.multiBooster       // boolean
state.divideBooster      // boolean
state.addBooster         // boolean
state.subtractBooster    // boolean
// Exponential mechanics
state.cascadeMultCount   // number (stacks of cascadeMult owned)
state.compoundGrowth     // boolean (grows scoreMultiplier ×1.5 each correct answer)
state.luckyFrequency     // boolean (lucky threshold 5 → 3)
```

## HUD Upgrade Strip

When in run mode, active upgrades are displayed as emoji pips in `#hud-upgrades`
below the level/tables row. When an upgrade effect fires, `UI.flashUpgrade(id)`
triggers a CSS pulse animation (`upgradePipFlash`) on the corresponding pip.

## Run Mode Demo

A fully automated, scripted demo run is available via the **"Watch Run Mode Demo"**
button on the main menu. It shows players what a well-built upgrade stack looks like,
ending with a score in the billions.

### Activation

```js
startRunDemo();
// → startGame({ runMode: true, runDemoMode: true, seed: RUN_DEMO_SEED })
```

The `runDemoMode: true` flag suppresses:
- Auto-spawning (demo controls all objects)
- Boss rounds
- Progress/mastery recording
- Voice recognition
- Ante-fail checks (demo never fails an ante)

### Scripted Shop Sequence

Six shops are scripted via `DEMO_SHOP_SCRIPT`. Each entry specifies forced card
options, which card to auto-pick, and a narration i18n key:

| Shop | Options shown | Pick | Purpose |
|------|--------------|------|---------|
| 1 | luckyBonus, streakBoost, hotZoneBoost | luckyBonus | Seed lucky triggers |
| 2 | cascadeMult, compoundGrowth, scoreMultSmall | cascadeMult | Start exponential cascade |
| 3 | compoundGrowth, scoreMultLarge, echoLucky | compoundGrowth | Add compound multiplier growth |
| 4 | slotExpander, scoreMultLarge, luckyFrequency | slotExpander | Open 5th slot for remaining picks |
| 5 | scoreMultLarge, replayScore, luckyFrequency | scoreMultLarge | ×2 global multiplier |
| 6 | replayScore, luckyFrequency, echoLucky | replayScore | Double all base scoring |

After the 6th shop, the demo enters **turbo phase**: `state.scoreMultiplier × 500`
to simulate an extended optimised run, then rapid auto-answering until the score
reaches 5 billion points.

### i18n Keys

| Key | Usage |
|-----|-------|
| `runDemoBtnLabel` | Main menu button label |
| `runDemoOverlayTitle` | Overlay heading |
| `runDemoPreparing` | "Preparing demo…" message |
| `runDemoIntro` | Opening narration |
| `runDemoAnte1` | Before ante 1 narration |
| `runDemoShop1`–`runDemoShop6` | Per-shop narration |
| `runDemoAfterShop1` | Post-shop 1 narration |
| `runDemoAfterShop2` | Post-shop 2 narration |
| `runDemoTurboTitle` | Turbo phase heading |
| `runDemoTurboIntro` | Turbo phase narration |
| `runDemoComplete` | Completion narration |
| `runDemoCompleteTitle` | Completion heading |

### Entry Point

`window.RunDemoRun` is exposed for E2E test instrumentation (mirrors the
`window.TutorialRun` pattern).

## Adding a New Upgrade

See `docs/adding-features.md` → "New Upgrade Checklist".
