// questions.js - weighted question generation

const Questions = (() => {
  // Build a weighted pool of question pairs.
  // wrongQueue: array of {key} for questions missed this session — given 8× weight.
  function buildPool(minTable, maxTable, stats, excludeAnswers, wrongQueue) {
    const wrongKeys = new Set(wrongQueue.map(q => q.key));
    const pool = [];

    for (let a = minTable; a <= maxTable; a++) {
      for (let b = minTable; b <= maxTable; b++) {
        const answer = a * b;
        const key = `${a}x${b}`;

        // Never duplicate an answer already on screen
        if (excludeAnswers.includes(answer)) continue;

        // Determine weight (using integer multiples for pool slots)
        // Base weights: mastered=1, normal=2, hard=4, wrong-this-session=16
        let weight = 2;
        if (wrongKeys.has(key)) {
          weight = 16; // missed this session — bring it back often
        } else {
          const s = stats[key];
          if (s && s.attempts > 0) {
            const mastered = s.masteredLevel || 0;
            if (mastered >= 4) {
              weight = 1; // mastered — rare appearance (spaced repetition)
            } else if (mastered >= 2) {
              weight = 2; // comfortable
            } else {
              const acc = s.correct / s.attempts;
              const avgTime = s.totalTimeMs / s.attempts;
              weight = (acc < 0.6 || avgTime > 8000) ? 6 : 2; // hard vs normal
            }
          }
        }

        for (let w = 0; w < weight; w++) {
          pool.push({ a, b, answer, key, display: `${a} × ${b}` });
        }
      }
    }
    return pool;
  }

  function pick(minTable, maxTable, stats, excludeAnswers = [], wrongQueue = []) {
    const pool = buildPool(minTable, maxTable, stats, excludeAnswers, wrongQueue);
    if (pool.length === 0) {
      // fallback: pick any without exclusions
      const a = Math.floor(Math.random() * (maxTable - minTable + 1)) + minTable;
      const b = Math.floor(Math.random() * (maxTable - minTable + 1)) + minTable;
      return { a, b, answer: a * b, key: `${a}x${b}`, display: `${a} × ${b}` };
    }
    return pool[Math.floor(Math.random() * pool.length)];
  }

  return { pick };
})();
