// questions.js - weighted question generation

const Questions = (() => {
  const OP_SYMBOL = { multiply: '×', divide: '÷', add: '+', subtract: '−' };

  function _weight(stats, key, wrongKeys) {
    if (wrongKeys.has(key)) return 16;
    const s = stats[key];
    if (s && s.attempts > 0) {
      const mastered = s.masteredLevel || 0;
      if (mastered >= 4) return 1;
      if (mastered >= 2) return 2;
      const acc = s.correct / s.attempts;
      const avgTime = s.totalTimeMs / s.attempts;
      return (acc < 0.6 || avgTime > 8000) ? 6 : 2;
    }
    return 2;
  }

  // Build a weighted pool of question pairs.
  // wrongQueue: array of {key} for questions missed this session — given 16× weight.
  // operation: 'multiply' | 'divide' | 'add' | 'subtract'
  function buildPool(minTable, maxTable, stats, excludeAnswers, wrongQueue, operation = 'multiply') {
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
      for (let a = aRange.lo; a <= aRange.hi; a++) {
        if (a === 0) continue;
        for (let b = bRange.lo; b <= bRange.hi; b++) {
          const dividend = a * b;
          const answer   = b;
          const key      = `${dividend}d${a}`;
          if (excludeAnswers.includes(answer)) continue;
          const w = _weight(stats, key, wrongKeys);
          for (let i = 0; i < w; i++) {
            pool.push({ a: dividend, b: a, answer, key, display: `${dividend} ÷ ${a}` });
          }
        }
      }
    } else if (operation === 'add') {
      for (let a = aRange.lo; a <= aRange.hi; a++) {
        for (let b = bRange.lo; b <= bRange.hi; b++) {
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
      for (let a = aRange.lo; a <= aRange.hi; a++) {
        for (let b = bRange.lo; b <= bRange.hi; b++) {
          if (b > a) continue; // no negatives in Klasse 3
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

  function pick(minTable, maxTable, stats, excludeAnswers = [], wrongQueue = [], operation = 'multiply') {
    const pool = buildPool(minTable, maxTable, stats, excludeAnswers, wrongQueue, operation);
    if (pool.length === 0) {
      return _fallback(minTable, maxTable, operation);
    }
    return pool[Math.floor(Math.random() * pool.length)];
  }

  return { pick };
})();
