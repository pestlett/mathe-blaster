# PIKAS — Pedagogical Source of Truth

All game design decisions about **what is taught, in what order, at what
difficulty, and how questions are structured** must align with the PIKAS
framework (Pädagogische Interventionen bei Kindern mit Schwierigkeiten im
Arithmetikunterricht der Grundschule), the German federal primary school
mathematics curriculum used in Klassen 1–4.

This document is the authoritative reference for gameplay decisions.
When in doubt about a mechanic, ask: *does this match how PIKAS teaches it?*

---

## What PIKAS Is

PIKAS is the German government's primary school maths teaching framework
(dortmund.de/pikas), developed by TU Dortmund. It defines:
- The sequence in which operations are introduced
- The number ranges expected at each school year
- The mental strategies children should develop
- The distinction between rote recall and genuine understanding

---

## Curriculum Sequence

### Klasse 1 — Foundation
- Numbers 0–20
- Addition and subtraction within 20 (no carrying)
- Basic patterns: doubles, near-doubles, number bonds to 10

### Klasse 2 — Times Tables (Einmaleins)
- Multiplication as repeated addition
- All tables 1×1 to 10×10
- Division as the inverse of multiplication
- Commutativity: 3×7 = 7×3 (Tauschaufgaben)
- Division with remainder introduced at end of year

### Klasse 3 — Extension (Klasse 3 Komplett)
Operations are extended to larger number ranges:

| Content | German term | Range |
|---------|-------------|-------|
| Addition | Addition | up to 1000 |
| Subtraction | Subtraktion | up to 1000 |
| ×/÷ by multiples of 10 | Zehnerrechnen | 10–900 |
| Single × multi-digit | Halbschriftliches Rechnen | single × 2–3 digit |

### Klasse 4 — Written Algorithms
- Full written multiplication (schriftliche Multiplikation)
- Long division (schriftliche Division)
- Not yet in Mathe Blaster scope

---

## PIKAS Principles That Drive Game Design

### 1. Automatisation through varied practice
PIKAS emphasises that facts must become automatic (auswendig gewusst), but
through *understanding*, not just repetition. The spaced repetition system
(masteredLevel 0–5, wrongQueue weighting) directly implements this: facts
are practised until automatic, with struggling facts surfaced more often.

**Implication**: the weighting system must never allow a child to "skip" weak
facts. wrongQueue weight (16×) and the accuracy-based boost (6× below 60%)
must remain significantly higher than mastered facts (1×).

### 2. Operation-inverse pairing (Umkehraufgaben)
PIKAS teaches × and ÷ as inseparable inverses. A child who knows 7×8=56
should immediately know 56÷7=8. The `commutative` and future inverse-pair
upgrades reflect this.

**Implication**: when showing division facts, always use facts the child has
already seen in multiplication form. The divide pool builder
(`a × b) ÷ a`) enforces this.

### 3. Carry and borrow as explicit milestones
PIKAS treats regrouping (Übertrag / Zehnerübergang) as a distinct cognitive
step, not a side-effect. Children should first master non-regrouping facts
before tackling regrouping.

**Implication**: the `easy` difficulty filter (no carry/borrow) and `hard`
filter (carry/borrow only) are pedagogically correct, not arbitrary.
Never collapse these two into one pool.

### 4. Number range as a teaching variable
PIKAS does not mix number ranges arbitrarily. A Klasse 2 child works with
1–100; a Klasse 3 child with 1–1000. Mixing ranges inappropriately
undermines place-value understanding.

**Implication**: `addSubRange` must remain a discrete choice (100 or 1000),
not a continuous slider. Do not default to 1000 for younger children.

### 5. Halbschriftliches Rechnen (semi-written method)
This is a Klasse 3 strategy where children break a multi-digit multiplication
into parts: 4×37 = 4×30 + 4×7. The game doesn't show working, but the
question pool (single × 2-3 digit) is scoped to numbers tractable by this
method.

**Implication**: halbschriftlich questions should stay within ranges where
mental decomposition is realistic. Hard mode extends to 3-digit multipliers;
do not extend beyond this without pedagogical justification.

### 6. Zehnerrechnen (multiples of ten)
Multiplying/dividing by multiples of 10 is a bridge between the Einmaleins
and the written algorithm. It uses the same facts but extends place value.
7×80 = 7×8 with a zero appended.

**Implication**: zehner mode is correctly scoped to {10,20,...,90} on easy
and adding {100,...,900} on hard. Do not include non-round numbers (e.g. 15,
25) in zehner mode — those belong to halbschriftlich.

---

## Question Design Rules (from PIKAS)

1. **Never present division facts the child hasn't seen in multiplication.**
   The divide pool must derive from the multiply pool.

2. **Operand order in × matters for understanding, not just recall.**
   3×7 (3 groups of 7) differs pedagogically from 7×3 (7 groups of 3).
   The `commutative` upgrade that destroys both is a *reward*, not a default,
   because PIKAS intentionally practises both directions.

3. **Carry/borrow must be explicit.** Easy = no regrouping. Hard = regrouping
   required. This is a hard boundary in the question filter, not a suggestion.

4. **Avoid trivial facts in isolation.** ×1, ×10, +0 are taught as rules, not
   as facts requiring repetition. The question pool correctly excludes or
   down-weights these.

5. **Wrong answers drive the next question, not just the score.**
   The wrongQueue system (16× weight) means a child who misses 7×8 will see
   it again very soon. This is deliberate PIKAS-aligned remediation.

---

## Scope Boundaries

| Feature | In scope | Out of scope |
|---------|----------|-------------|
| Tables | 1–10 (Klasse 2), extension to 12 or 20 optional | Beyond ×20 |
| Addition/subtraction | ≤ 100 (Kl.3), ≤ 1000 (Kl.3) | ≥ 10,000 |
| Halbschriftlich | single × 2-digit (easy), × 3-digit (hard) | single × 4-digit |
| Written algorithm | Not in game | Klasse 4 scope |
| Fractions | Not in game | Klasse 4 scope |
| Decimals | Not in game | Klasse 4 scope |

---

## When Adding New Content

Before adding any new question type, operation modifier, or number range, ask:
1. Which Klasse does this belong to in PIKAS?
2. What mental strategy does PIKAS expect children to use?
3. Does this fit within the existing `difficulty` axis (easy/medium/hard)?
4. Does it require a new setting flag, or can it be expressed with existing ones?
5. Would a German Klasse 3 teacher recognise this as appropriate content?

If the answer to #5 is no, do not add it.
