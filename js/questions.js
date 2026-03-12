// questions.js - weighted question generation

const Questions = (() => {
  // Build a weighted pool of question pairs
  function buildPool(minTable, maxTable, stats, excludeAnswers = []) {
    const pool = [];
    for (let a = minTable; a <= maxTable; a++) {
      for (let b = minTable; b <= maxTable; b++) {
        const key = `${a}x${b}`;
        const s = stats[key];
        let weight = 1;
        if (s && s.attempts > 0) {
          const acc = s.correct / s.attempts;
          const avgTime = s.totalTimeMs / s.attempts;
          if (acc < 0.6 || avgTime > 8000) weight = 3;
        }
        // Avoid duplicates currently on screen
        if (excludeAnswers.includes(a * b) && weight < 3) continue;
        for (let w = 0; w < weight; w++) {
          pool.push({ a, b, answer: a * b, key, display: `${a} × ${b}` });
        }
      }
    }
    return pool;
  }

  function pick(minTable, maxTable, stats, excludeAnswers = []) {
    const pool = buildPool(minTable, maxTable, stats, excludeAnswers);
    if (pool.length === 0) {
      // fallback: pick any
      const a = Math.floor(Math.random() * (maxTable - minTable + 1)) + minTable;
      const b = Math.floor(Math.random() * (maxTable - minTable + 1)) + minTable;
      return { a, b, answer: a * b, key: `${a}x${b}`, display: `${a} × ${b}` };
    }
    return pool[Math.floor(Math.random() * pool.length)];
  }

  return { pick };
})();
