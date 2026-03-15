# localStorage Schema

## Storage Keys

| Key pattern | Used for |
|-------------|---------|
| `multiblaster_v1` | Legacy single-player data |
| `multiblaster_v1_${name}${age}` | Per-player profile (multi-profile) |

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
    extendedTablesUnlocked: boolean
  },

  run: {
    bestAnte:        number,
    runsCompleted:   number,
    unlockedUpgrades: string[],     // upgrade IDs unlocked via milestones
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
| `firstCorrect` | First ever correct answer |
| `streak3` | Streak of 3 |
| `streak5` | Streak of 5 |
| `streak10` | Streak of 10 |
| `level5` | Reach level 5 |
| `level10` | Reach level 10 |
| `accuracy90` | Session accuracy ≥ 90% |
| `score500` | Score ≥ 500 |
| `score1000` | Score ≥ 1000 |
| `noMiss` | Finish a game with 0 misses |
| `addFirst` | First correct addition |
| `subFirst` | First correct subtraction |

### Social / daily
| ID | Condition |
|----|-----------|
| `playStreak3` | 3 consecutive days played |
| `playStreak7` | 7 consecutive days played |
| `challengeWin` | Beat a challenger's score |

### Table achievements (multiply)
| ID | Condition |
|----|-----------|
| `table2` … `table10` | All 10 facts for that table: cleanCorrect ≥ 1 |

### Table achievements (divide)
| ID | Condition |
|----|-----------|
| `div2` … `div10` | All 10 division facts for that table: cleanCorrect ≥ 1 |

### Milestone
| ID | Condition |
|----|-----------|
| `klasseKomplett` | All multiply tables 2–10 + all divide tables 2–10 + addFirst + subFirst |

## Run Mode Unlock Milestones

These check `run.milestones.*` and `run.runsCompleted` to unlock upgrades:

| Upgrade | Unlock condition |
|---------|-----------------|
| `commutative` | 3 runs completed |
| `streakSlow` | max streak ≥ 8 |
| `reveal` | bosses defeated ≥ 5 |
| `lastChance` | 10 runs completed |
