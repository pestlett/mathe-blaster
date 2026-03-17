# localStorage Schema

## Storage Keys

| Key pattern | Used for |
|-------------|---------|
| `multiblaster_v1` | Legacy single-player data |
| `multiblaster_v1_${name}_${age}` | Per-player profile (multi-profile) |

On first game with a named player, legacy data at `multiblaster_v1` is migrated
to the player-specific key automatically.

## Full Schema

```js
{
  player: {
    name: string
  },

  stats: {
    // keyed by question key: "7x8", "56d7", "47a35", "82s47"
    [key]: {
      attempts:     number,     // total answer attempts
      correct:      number,     // total correct answers
      totalTimeMs:  number,     // cumulative answer time (ms)
      lastSeen:     timestamp,
      masteredLevel: 0–5,       // see Mastery System below
      lastWrongAt:  timestamp,  // when this was last answered wrong
      cleanCorrect: number      // correct without hint, >10s since last wrong
    }
  },

  sessions: [
    {
      date:             ISO string,
      accuracy:         0–1,
      level:            number,
      score:            number,
      maxStreak:        number,
      bossesDefeated:   number,
      missCount:        number,
      theme:            'space'|'ocean'|'sky'|'cats',
      operation:        string,         // primary operation or 'mixed'
      isChallenge:      boolean,
      challengerScore:  number|null,
      minTable:         number,
      maxTable:         number,
      difficulty:       string,
      missedQuestions:  string[]        // keys of missed questions
    }
  ],

  achievements: {
    [id]: timestamp     // unix ms when unlocked; absent = not yet earned
  },

  lifetime: {
    totalCorrect:          number,
    maxLevel:              number,
    bestScore:             number,
    bestAccuracy:          0–1,
    maxStreak:             number,
    bossesDefeated:        number,
    sessionsPlayed:        number,
    flawlessGames:         number,
    challengeWins:         number,
    dayStreakCurrent:       number,
    dayStreakBest:          number,
    dayStreakLastDate:      'YYYY-M-D',
    extendedTablesUnlocked: boolean,
    tutorialCompletedAt:    ISO string | undefined
  },

  run: {
    bestAnte:        number,
    runsCompleted:   number,
    unlockedUpgrades: string[],     // upgrade IDs unlocked via milestones
    bestCoins:       number,        // highest coin balance reached in a single run
    shopBuysRecord:  number,        // most shop purchases in a single run (for shop_spree achievement)
    milestones: {
      bossesDefeated: number,
      runsCompleted:  number,
      maxStreak:      number
    }
  },

  dailyResults: {
    [dateKey]: sessionResult    // dateKey = "YYYY-M-D"
  },

  playerSettings: {
    age:          number,
    mode:         'normal'|'practice',
    diff:         'easy'|'medium'|'hard',
    hintThreshold: 1–5,
    triggerMode:  boolean,
    triggerWord:  string
  }
}
```

## Mastery System

`masteredLevel` (0–5) per question key drives the question weight:

| Level | Meaning | Weight |
|-------|---------|--------|
| 0 | Unseen / struggling | base |
| 1 | Some exposure | base |
| 2 | Improving | base |
| 3 | Comfortable | base |
| 4 | Strong | 1 (rarely shown) |
| 5 | Mastered | 1 (rarely shown) |

Incremented on correct answer (cap 5), decremented on wrong (floor 0).

`cleanCorrect` tracks answers given correctly without the hint dot-grid and
more than 10 seconds after the last wrong attempt. Table mastery achievement
requires all 10 facts in a table to have `cleanCorrect >= 1`.

## Achievement IDs

### Session achievements
| ID | Condition |
|----|-----------|
| `first_correct` | First ever correct answer |
| `streak_3` | Streak of 3 |
| `streak_5` | Streak of 5 |
| `streak_10` | Streak of 10 |
| `level_5` | Reach level 5 |
| `level_10` | Reach level 10 |
| `boss_slay` | Defeat the first boss round |
| `accuracy_90` | Session accuracy ≥ 90% |
| `score_500` | Score ≥ 500 |
| `score_1000` | Score ≥ 1,000 |
| `score_10k` | Score ≥ 10,000 |
| `score_100k` | Score ≥ 100,000 |
| `score_1m` | Score ≥ 1,000,000 |
| `score_100m` | Score ≥ 100,000,000 |
| `score_1b` | Score ≥ 1,000,000,000 |
| `score_100b` | Score ≥ 100,000,000,000 (1e11) — requires heavy run-mode upgrade stacking |
| `score_1q` | Score ≥ 1e15 (one quadrillion) — extreme run-mode play |
| `score_1sx` | Score ≥ 1e21 (one sextillion) — legendary |
| `no_miss` | Finish a game with 0 misses |
| `sessions_5` | Play 5 sessions |
| `add_first_correct` | First correct addition |
| `sub_first_correct` | First correct subtraction |

### Social / daily
| ID | Condition |
|----|-----------|
| `streak_days_3` | 3 consecutive days played |
| `streak_days_7` | 7 consecutive days played |
| `challenge_win` | Beat a challenger's score |

### Table achievements (multiply)
| ID | Condition |
|----|-----------|
| `table_2` … `table_10` | All 10 facts for that table: cleanCorrect ≥ 1 |

### Table achievements (divide)
| ID | Condition |
|----|-----------|
| `div_first_correct` | First correct division answer |
| `div_table_2` … `div_table_10` | All 10 division facts for that table: cleanCorrect ≥ 1 |

### Milestone
| ID | Condition |
|----|-----------|
| `klasse3_komplett` | All multiply tables 2–10 + all divide tables 2–10 + add & subtract attempted |

### Run Mode Achievements
| ID | Condition |
|----|-----------|
| `shop_spree` | Buy 3 upgrades from the shop in a single run (`run.shopBuysRecord >= 3`) |

## Run Mode Unlock Milestones

These check `run.milestones.*` and `run.runsCompleted` to unlock upgrades:

| Upgrade | Unlock condition |
|---------|-----------------|
| `commutative` | 3 runs completed |
| `streakSlow` | max streak ≥ 8 |
| `reveal` | bosses defeated ≥ 5 |
| `lastChance` | 10 runs completed |

## Tutorial Progress

- `lifetime.tutorialCompletedAt` is set once the guided tutorial is finished by
  beating its boss.
- Tutorial runs do **not** write session stats, mastery, achievements, or
  leaderboard entries; only the completion flag is persisted.
