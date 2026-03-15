# Game Settings Reference

Complete reference for the `settings` object passed to `startGame(settings)` in `main.js`.

## Full Shape

```js
{
  // Player identity
  name:             string,           // display name, used for localStorage key
  age:              number | null,     // used to gate Klasse 3 content in UI

  // Visuals / audio
  theme:            'space' | 'ocean' | 'sky' | 'cats',

  // Question range
  minTable:         number,           // 1–20, smallest table/operand
  maxTable:         number,           // 1–20, largest table/operand
  addSubRange:      100 | 1000,       // max value for add/subtract operands

  // Operation
  operation:        'multiply' | 'divide' | 'add' | 'subtract',  // primary (legacy)
  operations:       string[],         // mixed mode; overrides operation if present

  // Klasse 3 modifiers
  zehner:           boolean,          // ×10/÷10/×100/÷100 focus
  halbschriftlich:  boolean,          // single-digit × multi-digit

  // Difficulty
  difficulty:       'easy' | 'medium' | 'hard',
  hintThreshold:    1 | 2 | 3 | 4 | 5,   // wrong answers before dot-grid hint

  // Game modes
  practiceMode:     boolean,          // unlimited lives, no time pressure
  isDaily:          boolean,          // daily challenge (uses seeded RNG)
  runMode:          boolean,          // roguelike ante/upgrade mode
  tutorialMode:     boolean,          // guided scripted tutorial (no stat persistence)
  isChallenge:      boolean,          // social challenge (requires seed + challengerScore)

  // Challenge / daily
  seed:             number,           // optional; makes RNG deterministic
  challengerScore:  number | null,    // score to beat in challenge mode

  // Voice
  triggerWord:      string,           // voice trigger word ('' = use default fire commands)
}
```

## Defaults (applied in startGame if missing)

| Field | Default |
|-------|---------|
| `operations` | `[operation]` |
| `addSubRange` | `100` |
| `zehner` | `false` |
| `halbschriftlich` | `false` |
| `hintThreshold` | `3` |
| `practiceMode` | `false` |
| `isDaily` | `false` |
| `runMode` | `false` |
| `tutorialMode` | `false` |
| `isChallenge` | `false` |

## Difficulty Parameters

Defined in `main.js` as `DIFFICULTY`:

| Difficulty | maxObjects | baseSpeed (px/s) | maxSpeed (px/s) | lives |
|------------|-----------|-----------------|----------------|-------|
| `easy` | 2 | 55 | 120 | 5 |
| `medium` | 3 | 70 | 160 | 4 |
| `hard` | 4 | 90 | 210 | 3 |

Speed increases per level: `baseSpeed × (1 + SPEED_INCREASE_PER_LEVEL × (level-1))`
where `SPEED_INCREASE_PER_LEVEL = 0.18`. Capped at `maxSpeed`.

## Common Settings Combinations

### Standard Klasse 2 (times tables)
```js
{ operation: 'multiply', minTable: 2, maxTable: 10, difficulty: 'medium' }
```

### Mixed Klasse 3
```js
{ operations: ['multiply', 'divide', 'add', 'subtract'],
  minTable: 2, maxTable: 10, addSubRange: 1000, difficulty: 'hard' }
```

### Zehner practice
```js
{ operation: 'multiply', minTable: 2, maxTable: 9,
  zehner: true, difficulty: 'easy' }
```

### Halbschriftlich
```js
{ operation: 'multiply', minTable: 2, maxTable: 9,
  halbschriftlich: true, difficulty: 'medium' }
```

### Run Mode
```js
{ operation: 'multiply', minTable: 2, maxTable: 10,
  difficulty: 'medium', runMode: true }
```

### Daily Challenge
```js
{ operation: 'multiply', minTable: 2, maxTable: 10,
  difficulty: 'medium', isDaily: true, seed: 20250315 }
```

### Guided Tutorial
```js
{ operation: 'multiply', minTable: 2, maxTable: 5,
  difficulty: 'easy', tutorialMode: true, seed: 20260315 }
```
