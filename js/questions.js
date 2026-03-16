// questions.js - weighted question generation

const Questions = (() => {
  const OP_SYMBOL = { multiply: '×', divide: '÷', add: '+', subtract: '−' };

  // baseWeight: 2 for multiply/add/subtract, 3 for divide (harder cognitive load)
  function _weight(stats, key, wrongKeys, baseWeight = 2) {
    if (wrongKeys.has(key)) return 16;
    const s = stats[key];
    if (s && s.attempts > 0) {
      const mastered = s.masteredLevel || 0;
      if (mastered >= 4) return 1;
      if (mastered >= 2) return baseWeight;
      const acc = s.correct / s.attempts;
      const avgTime = s.totalTimeMs / s.attempts;
      return (acc < 0.6 || avgTime > 8000) ? 6 : baseWeight;
    }
    return baseWeight;
  }

  // Returns true if adding a+b requires carrying (ones or tens column overflows)
  function _hasCarry(a, b) {
    if ((a % 10) + (b % 10) >= 10) return true;
    const aTens = Math.floor((a % 100) / 10);
    const bTens = Math.floor((b % 100) / 10);
    if (aTens + bTens >= 10) return true;
    return false;
  }

  // Returns true if subtracting a-b requires borrowing (a >= b assumed)
  function _hasBorrow(a, b) {
    if ((a % 10) < (b % 10)) return true;
    const aTens = Math.floor((a % 100) / 10);
    const bTens = Math.floor((b % 100) / 10);
    if (aTens < bTens) return true;
    return false;
  }

  // Mulberry32: small, fast, seedable PRNG. Returns a function that produces [0,1).
  function mulberry32(seed) {
    return function() {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function _randInt(lo, hi, rng) {
    return lo + Math.floor((rng || Math.random)() * (hi - lo + 1));
  }

  // Generate structured random pairs for large add/subtract ranges.
  // roundMag: granularity for 'easy' mode (10 for ≤100, 100 for ≤1000)
  function _sampleAddPairs(lo, hi, difficulty, count, rng) {
    const roundMag = hi >= 200 ? 100 : 10;
    const pairs = [];
    const seen = new Set();
    let attempts = 0;
    while (pairs.length < count && attempts < count * 15) {
      attempts++;
      let a, b;
      if (difficulty === 'easy') {
        // Round multiples: both are pure multiples of roundMag within [0..hi]
        const maxStep = Math.floor(hi / roundMag);
        if (maxStep < 1) break;
        a = Math.floor((rng || Math.random)() * (maxStep + 1)) * roundMag;
        b = Math.floor((rng || Math.random)() * (maxStep + 1)) * roundMag;
      } else {
        a = _randInt(lo, hi, rng);
        b = _randInt(lo, hi, rng);
      }
      if (difficulty === 'easy'  &&  _hasCarry(a, b)) continue;
      if (difficulty === 'hard'  && !_hasCarry(a, b)) continue;
      const key = `${a}a${b}`;
      if (seen.has(key)) continue;
      seen.add(key);
      pairs.push({ a, b });
    }
    return pairs;
  }

  function _sampleSubPairs(lo, hi, difficulty, count, rng) {
    const roundMag = hi >= 200 ? 100 : 10;
    const pairs = [];
    const seen = new Set();
    let attempts = 0;
    while (pairs.length < count && attempts < count * 15) {
      attempts++;
      let a, b;
      if (difficulty === 'easy') {
        // Round multiples: both are pure multiples of roundMag within [0..hi]
        const maxStep = Math.floor(hi / roundMag);
        if (maxStep < 1) break;
        a = Math.floor((rng || Math.random)() * (maxStep + 1)) * roundMag;
        b = Math.floor((rng || Math.random)() * (maxStep + 1)) * roundMag;
      } else {
        a = _randInt(lo, hi, rng);
        b = _randInt(lo, hi, rng);
      }
      // no negatives: ensure a >= b
      if (a < b) { const tmp = a; a = b; b = tmp; }
      if (a === b && difficulty === 'hard') continue; // x-x=0 never has borrow
      if (difficulty === 'easy'  &&  _hasBorrow(a, b)) continue;
      if (difficulty === 'hard'  && !_hasBorrow(a, b)) continue;
      const key = `${a}s${b}`;
      if (seen.has(key)) continue;
      seen.add(key);
      pairs.push({ a, b });
    }
    return pairs;
  }

  // Build a weighted pool of question pairs.
  // wrongQueue: array of {key} for questions missed this session — given 16× weight.
  // operation: 'multiply' | 'divide' | 'add' | 'subtract'
  // opts.difficulty: 'easy' (no carry/borrow) | 'hard' (only carry/borrow) | anything else = all
  function buildPool(minTable, maxTable, stats, excludeAnswers, wrongQueue, operation = 'multiply', opts = {}, rng = null) {
    const wrongKeys = new Set(wrongQueue.map(q => q.key));
    const pool = [];

    // When a single table is selected, pair it against all multipliers 1–10
    // so the player practises the full table, not just e.g. 6×6.
    const aRange = { lo: minTable, hi: maxTable };
    const bRange = minTable === maxTable
      ? { lo: 1, hi: 10 }
      : { lo: minTable, hi: maxTable };

    if (operation === 'divide') {
      const { difficulty, zehner, halbschriftlich } = opts;
      if (zehner) {
        // Zehner division: (a × b) ÷ a = b, where b is a multiple of 10 or 100
        const tens = [10, 20, 30, 40, 50, 60, 70, 80, 90];
        const hundreds = [100, 200, 300, 400, 500, 600, 700, 800, 900];
        const bVals = difficulty === 'easy' ? tens : [...tens, ...hundreds];
        for (let a = aRange.lo; a <= aRange.hi; a++) {
          if (a === 0) continue;
          for (const b of bVals) {
            const dividend = a * b;
            const answer   = b;
            const key      = `${dividend}d${a}`;
            if (excludeAnswers.includes(answer)) continue;
            const w = _weight(stats, key, wrongKeys, 3);
            for (let i = 0; i < w; i++) {
              pool.push({ a: dividend, b: a, answer, key, display: `${dividend} ÷ ${a}` });
            }
          }
        }
      } else if (halbschriftlich) {
        // Halbschriftliche Division: (divisor × quotient) ÷ divisor = quotient
        // divisor = a (from table range), quotient is multi-digit (no remainder)
        // Easy: 2-digit quotient (12–99); Medium/Hard: 2-digit AND 3-digit (12–999)
        const hiQ = difficulty === 'easy' ? 99 : 999;
        const loQ = 12;
        for (let a = aRange.lo; a <= aRange.hi; a++) {
          if (a === 0) continue;
          const seen = new Set();
          const target = difficulty === 'easy' ? 18 : 24;
          let attempts = 0;
          while (seen.size < target && attempts < target * 20) {
            attempts++;
            const quotient = _randInt(loQ, hiQ, rng);
            if (seen.has(quotient)) continue;
            seen.add(quotient);
            const dividend = a * quotient;
            const answer   = quotient;
            const key      = `${dividend}d${a}`;
            if (excludeAnswers.includes(answer)) continue;
            const w = _weight(stats, key, wrongKeys, 3);
            for (let i = 0; i < w; i++) {
              pool.push({ a: dividend, b: a, answer, key, display: `${dividend} ÷ ${a}` });
            }
          }
        }
      } else {
        for (let a = aRange.lo; a <= aRange.hi; a++) {
          if (a === 0) continue;
          for (let b = bRange.lo; b <= bRange.hi; b++) {
            const dividend = a * b;
            const answer   = b;
            const key      = `${dividend}d${a}`;
            if (excludeAnswers.includes(answer)) continue;
            const w = _weight(stats, key, wrongKeys, 3);
            for (let i = 0; i < w; i++) {
              pool.push({ a: dividend, b: a, answer, key, display: `${dividend} ÷ ${a}` });
            }
          }
        }
      }
    } else if (operation === 'add') {
      const { difficulty } = opts;
      const lo = aRange.lo, hi = aRange.hi;
      if (hi > 20) {
        // Large range: always include wrongQueue pairs first
        for (const wq of wrongQueue) {
          const m = wq.key.match(/^(\d+)a(\d+)$/);
          if (!m) continue;
          const a = +m[1], b = +m[2];
          const answer = a + b;
          if (!excludeAnswers.includes(answer)) {
            for (let i = 0; i < 16; i++) pool.push({ a, b, answer, key: wq.key, display: `${a} + ${b}` });
          }
        }
        // Sample random pairs (skip wrongQueue keys — already added above with full weight)
        const sampled = _sampleAddPairs(lo, hi, difficulty, 250, rng);
        for (const { a, b } of sampled) {
          const answer = a + b;
          const key = `${a}a${b}`;
          if (wrongKeys.has(key)) continue;
          if (excludeAnswers.includes(answer)) continue;
          const w = _weight(stats, key, wrongKeys);
          for (let i = 0; i < w; i++) pool.push({ a, b, answer, key, display: `${a} + ${b}` });
        }
      } else {
        for (let a = aRange.lo; a <= aRange.hi; a++) {
          for (let b = bRange.lo; b <= bRange.hi; b++) {
            if (difficulty === 'easy' && _hasCarry(a, b)) continue;
            if (difficulty === 'hard' && !_hasCarry(a, b)) continue;
            const answer = a + b;
            const key    = `${a}a${b}`;
            if (excludeAnswers.includes(answer)) continue;
            const w = _weight(stats, key, wrongKeys);
            for (let i = 0; i < w; i++) {
              pool.push({ a, b, answer, key, display: `${a} + ${b}` });
            }
          }
        }
      }
    } else if (operation === 'subtract') {
      const { difficulty } = opts;
      const lo = aRange.lo, hi = aRange.hi;
      if (hi > 20) {
        // Large range: always include wrongQueue pairs first
        for (const wq of wrongQueue) {
          const m = wq.key.match(/^(\d+)s(\d+)$/);
          if (!m) continue;
          const a = +m[1], b = +m[2];
          const answer = a - b;
          if (!excludeAnswers.includes(answer)) {
            for (let i = 0; i < 16; i++) pool.push({ a, b, answer, key: wq.key, display: `${a} − ${b}` });
          }
        }
        // Sample random pairs (skip wrongQueue keys — already added above with full weight)
        const sampled = _sampleSubPairs(lo, hi, difficulty, 250, rng);
        for (const { a, b } of sampled) {
          const answer = a - b;
          const key = `${a}s${b}`;
          if (wrongKeys.has(key)) continue;
          if (excludeAnswers.includes(answer)) continue;
          const w = _weight(stats, key, wrongKeys);
          for (let i = 0; i < w; i++) pool.push({ a, b, answer, key, display: `${a} − ${b}` });
        }
      } else {
        for (let a = aRange.lo; a <= aRange.hi; a++) {
          for (let b = bRange.lo; b <= bRange.hi; b++) {
            if (b > a) continue;
            if (difficulty === 'easy' && _hasBorrow(a, b)) continue;
            if (difficulty === 'hard' && !_hasBorrow(a, b)) continue;
            const answer = a - b;
            const key    = `${a}s${b}`;
            if (excludeAnswers.includes(answer)) continue;
            const w = _weight(stats, key, wrongKeys);
            for (let i = 0; i < w; i++) {
              pool.push({ a, b, answer, key, display: `${a} − ${b}` });
            }
          }
        }
      }
    } else {
      // multiply (default or Zehner mode)
      const { difficulty, zehner, halbschriftlich } = opts;
      if (zehner) {
        // Zehner mode: one factor from table range, other is a multiple of 10 or 100
        const tens = [10, 20, 30, 40, 50, 60, 70, 80, 90];
        const hundreds = [100, 200, 300, 400, 500, 600, 700, 800, 900];
        const bVals = difficulty === 'easy' ? tens : [...tens, ...hundreds];
        for (let a = aRange.lo; a <= aRange.hi; a++) {
          for (const b of bVals) {
            const answer = a * b;
            const key    = `${a}x${b}`;
            if (excludeAnswers.includes(answer)) continue;
            const w = _weight(stats, key, wrongKeys);
            for (let i = 0; i < w; i++) {
              pool.push({ a, b, answer, key, display: `${a} × ${b}` });
            }
          }
        }
      } else if (halbschriftlich) {
        // Halbschriftliche Multiplikation: single digit (table range) × multi-digit
        // Easy: 2-digit multiplier (12–99); Medium/Hard: 2-digit AND 3-digit (12–999)
        const hiB = difficulty === 'easy' ? 99 : 999;
        const loB = 12;
        for (let a = aRange.lo; a <= aRange.hi; a++) {
          const seen = new Set();
          const target = difficulty === 'easy' ? 18 : 24;
          let attempts = 0;
          while (seen.size < target && attempts < target * 20) {
            attempts++;
            const b = _randInt(loB, hiB, rng);
            if (seen.has(b)) continue;
            seen.add(b);
            const answer = a * b;
            const key    = `${a}x${b}`;
            if (excludeAnswers.includes(answer)) continue;
            const w = _weight(stats, key, wrongKeys);
            for (let i = 0; i < w; i++) {
              pool.push({ a, b, answer, key, display: `${a} × ${b}` });
            }
          }
        }
      } else {
        for (let a = aRange.lo; a <= aRange.hi; a++) {
          for (let b = bRange.lo; b <= bRange.hi; b++) {
            const answer = a * b;
            const key    = `${a}x${b}`;
            if (excludeAnswers.includes(answer)) continue;
            const w = _weight(stats, key, wrongKeys);
            for (let i = 0; i < w; i++) {
              pool.push({ a, b, answer, key, display: `${a} × ${b}` });
            }
          }
        }
      }
    }

    return pool;
  }

  function _fallback(minTable, maxTable, operation, opts = {}, rng = null) {
    const rand = rng || Math.random;
    const a = Math.floor(rand() * (maxTable - minTable + 1)) + minTable;
    if (opts.zehner) {
      const bVals = opts.difficulty === 'easy'
        ? [10,20,30,40,50,60,70,80,90]
        : [10,20,30,40,50,60,70,80,90,100,200,300,400,500,600,700,800,900];
      const b = bVals[Math.floor(rand() * bVals.length)];
      if (operation === 'divide') {
        const dividend = a * b;
        return { a: dividend, b: a, answer: b, key: `${dividend}d${a}`, display: `${dividend} ÷ ${a}` };
      }
      return { a, b, answer: a * b, key: `${a}x${b}`, display: `${a} × ${b}` };
    }
    if (opts.halbschriftlich && operation === 'multiply') {
      const hiB = (opts.difficulty === 'easy') ? 99 : 999;
      const b = _randInt(12, hiB, rng);
      return { a, b, answer: a * b, key: `${a}x${b}`, display: `${a} × ${b}` };
    }
    if (opts.halbschriftlich && operation === 'divide') {
      const hiQ = (opts.difficulty === 'easy') ? 99 : 999;
      const quotient = _randInt(12, hiQ, rng);
      const dividend = a * quotient;
      return { a: dividend, b: a, answer: quotient, key: `${dividend}d${a}`, display: `${dividend} ÷ ${a}` };
    }
    if (operation === 'divide') {
      const b = Math.floor(rand() * 10) + 1;
      const dividend = a * b;
      return { a: dividend, b: a, answer: b, key: `${dividend}d${a}`, display: `${dividend} ÷ ${a}` };
    }
    if (operation === 'add') {
      const b = Math.floor(rand() * (maxTable - minTable + 1)) + minTable;
      return { a, b, answer: a + b, key: `${a}a${b}`, display: `${a} + ${b}` };
    }
    if (operation === 'subtract') {
      const b = Math.floor(rand() * (a - minTable + 1)) + minTable;
      const lo = Math.min(a, b), hi = Math.max(a, b);
      return { a: hi, b: lo, answer: hi - lo, key: `${hi}s${lo}`, display: `${hi} − ${lo}` };
    }
    // multiply
    const b = Math.floor(rand() * (maxTable - minTable + 1)) + minTable;
    return { a, b, answer: a * b, key: `${a}x${b}`, display: `${a} × ${b}` };
  }

  function pick(minTable, maxTable, stats, excludeAnswers = [], wrongQueue = [], operation = 'multiply', opts = {}, rng = null) {
    let pool = buildPool(minTable, maxTable, stats, excludeAnswers, wrongQueue, operation, opts, rng);
    // If difficulty filter leaves pool empty, retry without difficulty constraint
    if (pool.length === 0 && opts.difficulty) {
      pool = buildPool(minTable, maxTable, stats, excludeAnswers, wrongQueue, operation, { ...opts, difficulty: undefined }, rng);
    }
    if (pool.length === 0) {
      return _fallback(minTable, maxTable, operation, opts, rng);
    }
    return pool[Math.floor((rng || Math.random)() * pool.length)];
  }

  return { pick, mulberry32 };
})();
