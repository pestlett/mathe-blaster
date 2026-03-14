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

  // Build a weighted pool of question pairs.
  // wrongQueue: array of {key} for questions missed this session — given 16× weight.
  // operation: 'multiply' | 'divide' | 'add' | 'subtract'
  // opts.difficulty: 'easy' (no carry/borrow) | 'hard' (only carry/borrow) | anything else = all
  function buildPool(minTable, maxTable, stats, excludeAnswers, wrongQueue, operation = 'multiply', opts = {}) {
    const wrongKeys = new Set(wrongQueue.map(q => q.key));
    const pool = [];

    // When a single table is selected, pair it against all multipliers 1–12
    // so the player practises the full table, not just e.g. 6×6.
    const aRange = { lo: minTable, hi: maxTable };
    const bRange = minTable === maxTable
      ? { lo: 1, hi: 12 }
      : { lo: minTable, hi: maxTable };

    if (operation === 'divide') {
      // Generate from valid multiplication pairs: (a×b) ÷ a = b
      // aRange controls the divisor; bRange controls the multiplier/quotient
      // Base weight 3: division requires more effort than multiplication
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
    } else if (operation === 'add') {
      const { difficulty } = opts;
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
    } else if (operation === 'subtract') {
      const { difficulty } = opts;
      for (let a = aRange.lo; a <= aRange.hi; a++) {
        for (let b = bRange.lo; b <= bRange.hi; b++) {
          if (b > a) continue; // no negatives in Klasse 3
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
    } else {
      // multiply (default)
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

    return pool;
  }

  function _fallback(minTable, maxTable, operation) {
    const a = Math.floor(Math.random() * (maxTable - minTable + 1)) + minTable;
    if (operation === 'divide') {
      const b = Math.floor(Math.random() * 12) + 1;
      const dividend = a * b;
      return { a: dividend, b: a, answer: b, key: `${dividend}d${a}`, display: `${dividend} ÷ ${a}` };
    }
    if (operation === 'add') {
      const b = Math.floor(Math.random() * (maxTable - minTable + 1)) + minTable;
      return { a, b, answer: a + b, key: `${a}a${b}`, display: `${a} + ${b}` };
    }
    if (operation === 'subtract') {
      const b = Math.floor(Math.random() * (a - minTable + 1)) + minTable;
      const lo = Math.min(a, b), hi = Math.max(a, b);
      return { a: hi, b: lo, answer: hi - lo, key: `${hi}s${lo}`, display: `${hi} − ${lo}` };
    }
    // multiply
    const b = Math.floor(Math.random() * (maxTable - minTable + 1)) + minTable;
    return { a, b, answer: a * b, key: `${a}x${b}`, display: `${a} × ${b}` };
  }

  function pick(minTable, maxTable, stats, excludeAnswers = [], wrongQueue = [], operation = 'multiply', opts = {}) {
    let pool = buildPool(minTable, maxTable, stats, excludeAnswers, wrongQueue, operation, opts);
    // If difficulty filter leaves pool empty, retry without difficulty constraint
    if (pool.length === 0 && opts.difficulty) {
      pool = buildPool(minTable, maxTable, stats, excludeAnswers, wrongQueue, operation, {});
    }
    if (pool.length === 0) {
      return _fallback(minTable, maxTable, operation);
    }
    return pool[Math.floor(Math.random() * pool.length)];
  }

  return { pick };
})();
