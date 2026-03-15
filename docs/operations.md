# Operations & Content System

## Supported Operations

| ID | Symbol | Key format | Example key |
|----|--------|-----------|-------------|
| `multiply` | × | `${a}x${b}` | `7x8` |
| `divide` | ÷ | `${dividend}d${divisor}` | `56d7` |
| `add` | + | `${a}a${b}` | `47a35` |
| `subtract` | − | `${a}s${b}` | `82s47` |

The key is used throughout `progress.js` stats, mastery tracking, and
achievement checks. **Never change key format** without migrating saved data.

## Settings that Affect Question Generation

### Multiply / Divide

| Setting | Type | Effect |
|---------|------|--------|
| `minTable` | 1–20 | Smallest multiplier/divisor in pool |
| `maxTable` | 1–20 | Largest multiplier/divisor in pool |
| `zehner` | boolean | Restrict to ×10/÷10, ×100/÷100 (see below) |
| `halbschriftlich` | boolean | Single-digit × multi-digit (see below) |
| `difficulty` | easy/medium/hard | Affects Zehner/Halbschriftlich pool range |

### Add / Subtract

| Setting | Type | Effect |
|---------|------|--------|
| `addSubRange` | 100 or 1000 | Upper bound for operands |
| `difficulty` | easy/medium/hard | Carry/borrow filtering |
| `minTable` / `maxTable` | 1–20 | Maps to range selector UI only; not used in question generation |

### Mixed Mode

`settings.operations = ['multiply', 'divide', 'add', 'subtract']` (any subset).
`settings.operation` is kept for backward-compat but `operations` takes precedence.
Each pick randomly selects from active operations with equal weight.

## The Pikas Progression

Mathe Blaster follows the German Klasse 3 Pikas curriculum structure:

```
Klasse 2 (baseline)
  └── multiply/divide: tables 1×1 to 10×10

Klasse 3 extensions (all gated behind age/range selectors in onboarding)
  ├── add/subtract ≤ 100     (addSubRange=100)
  ├── add/subtract ≤ 1000    (addSubRange=1000)
  ├── Zehner (×/÷ 10s)       (zehner=true)
  │     easy:  × {10,20,...,90}
  │     hard:  × {10,...,90,100,...,900}
  └── Halbschriftlich (semi-written)  (halbschriftlich=true)
        easy:  single × 2-digit (12–99)
        hard:  single × 3-digit (12–999)
```

## Question Object Shape

```js
{
  a: number,          // left operand (or dividend for divide)
  b: number,          // right operand (or divisor for divide)
  answer: number,     // correct numeric answer
  key: string,        // unique ID for stats tracking
  display: string,    // human-readable: "7 × 8", "56 ÷ 7", "47 + 35"
  question: string    // same as display (alias used on objects)
}
```

## Weighting Logic

`Questions.pick()` builds a weighted pool each call:

| Condition | Weight |
|-----------|--------|
| In wrongQueue (recent miss) | 16 |
| masteredLevel ≥ 4 | 1 |
| masteredLevel 2–3 | base |
| accuracy < 60% OR avgTime > 8s | 6 |
| default | base (2 for ×+−, 3 for ÷) |

Division gets a higher base weight because it's harder and benefits from
more exposure. wrongQueue gets 16× to drive immediate spaced repetition.

## Carry / Borrow Filtering (Add/Subtract)

For ranges ≤ 20, carry/borrow is checked per question:
- **carry**: ones column addition ≥ 10 OR tens column addition ≥ 100
- **borrow**: ones digit of a < ones digit of b (requires regrouping)

`easy` difficulty: filters OUT carry/borrow questions
`hard` difficulty: filters IN only carry/borrow questions
other: all questions included

For ranges > 20, pairs are sampled randomly and filtered by the same logic.

## Adding a New Operation

See `docs/adding-features.md` → "New Operation Checklist".
