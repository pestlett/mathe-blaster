// tests/questions.test.js
// Unit tests for Questions module — pool building, weighting, exclusions

const { makeContext, loadModule } = require('./helpers/context');

function makeQCtx() {
  const ctx = makeContext();
  loadModule(ctx, 'questions.js');
  return ctx;
}

// ── buildPool via pick ─────────────────────────────────────────────────────
// We test buildPool indirectly through pick(), which uses it internally.
// We expose buildPool by reading Questions.pick many times and checking
// distribution, or by calling the internal function directly via a test shim.

// For direct pool inspection we patch the Questions module source to export
// buildPool in the test context:
const vm   = require('vm');
const fs   = require('fs');
const path = require('path');

function makeQCtxWithBuildPool() {
  const ctx = makeContext();
  let src = fs.readFileSync(path.resolve(__dirname, '../js/questions.js'), 'utf8');
  // Expose buildPool on the returned object
  src = src.replace(
    'return { pick };',
    'return { pick, _buildPool: buildPool };'
  );
  src = src.replace(/^(?:const|let)\s+([A-Z][A-Za-z0-9_]*)\s*=/m, 'var $1 =');
  vm.runInContext(src, ctx);
  return ctx;
}

describe('Questions.pick — basic', () => {
  let ctx;
  beforeEach(() => { ctx = makeQCtx(); });

  test('returns an object with question, answer, key, display', () => {
    const q = ctx.Questions.pick(2, 5, {});
    expect(q).toHaveProperty('answer');
    expect(q).toHaveProperty('key');
    expect(q).toHaveProperty('display');
    expect(typeof q.answer).toBe('number');
  });

  test('answer is within expected range for 2–5 tables', () => {
    for (let i = 0; i < 50; i++) {
      const q = ctx.Questions.pick(2, 5, {});
      expect(q.answer).toBeGreaterThanOrEqual(2);
      expect(q.answer).toBeLessThanOrEqual(25);
    }
  });

  test('key matches a×b format', () => {
    const q = ctx.Questions.pick(3, 3, {});
    expect(q.key).toMatch(/^\d+x\d+$/);
  });
});

describe('Questions — single table mode', () => {
  let ctx;
  beforeEach(() => { ctx = makeQCtxWithBuildPool(); });

  test('single table 6×: pairs against 1–12, not just 6×6', () => {
    const pool = ctx.Questions._buildPool(6, 6, {}, [], []);
    const keys = new Set(pool.map(q => q.key));
    // Should include 6x1, 6x2, ..., 6x12
    expect(keys.has('6x1')).toBe(true);
    expect(keys.has('6x7')).toBe(true);
    expect(keys.has('6x12')).toBe(true);
  });

  test('single table 6×: does NOT include 7×anything', () => {
    const pool = ctx.Questions._buildPool(6, 6, {}, [], []);
    const hasOtherTable = pool.some(q => q.a !== 6);
    expect(hasOtherTable).toBe(false);
  });
});

describe('Questions — exclusions', () => {
  let ctx;
  beforeEach(() => { ctx = makeQCtxWithBuildPool(); });

  test('excludeAnswers removes questions with that answer', () => {
    // Exclude answer 12 (e.g. 3×4, 4×3, 2×6, 6×2, 1×12, 12×1)
    const pool = ctx.Questions._buildPool(1, 5, {}, [12], []);
    const has12 = pool.some(q => q.answer === 12);
    expect(has12).toBe(false);
  });
});

describe('Questions — weight distribution', () => {
  let ctx;
  beforeEach(() => { ctx = makeQCtxWithBuildPool(); });

  test('wrong-queue questions get weight 16 (appear most)', () => {
    const wrongQueue = [{ key: '3x4' }];
    const pool = ctx.Questions._buildPool(1, 5, {}, [], wrongQueue);
    const count3x4 = pool.filter(q => q.key === '3x4').length;
    const count3x3 = pool.filter(q => q.key === '3x3').length; // normal weight 2
    expect(count3x4).toBe(16);
    expect(count3x3).toBe(2);
  });

  test('hard questions (low accuracy) get weight 6', () => {
    const stats = { '4x5': { attempts: 10, correct: 4, totalTimeMs: 50000, masteredLevel: 0 } };
    // acc = 0.4 < 0.6 → hard → weight 6
    const pool = ctx.Questions._buildPool(4, 5, stats, [], []);
    const count4x5 = pool.filter(q => q.key === '4x5').length;
    expect(count4x5).toBe(6);
  });

  test('hard questions (slow avg time > 8s) get weight 6', () => {
    const stats = { '4x5': { attempts: 5, correct: 5, totalTimeMs: 50000, masteredLevel: 0 } };
    // acc = 1.0 (fine) but avgTime = 10000ms > 8000 → hard
    const pool = ctx.Questions._buildPool(4, 5, stats, [], []);
    const count4x5 = pool.filter(q => q.key === '4x5').length;
    expect(count4x5).toBe(6);
  });

  test('mastered questions (masteredLevel >= 4) get weight 1', () => {
    const stats = { '4x5': { attempts: 20, correct: 20, totalTimeMs: 20000, masteredLevel: 4 } };
    const pool = ctx.Questions._buildPool(4, 5, stats, [], []);
    const count4x5 = pool.filter(q => q.key === '4x5').length;
    expect(count4x5).toBe(1);
  });

  test('comfortable questions (masteredLevel 2-3) get weight 2', () => {
    const stats = { '4x5': { attempts: 10, correct: 8, totalTimeMs: 30000, masteredLevel: 2 } };
    const pool = ctx.Questions._buildPool(4, 5, stats, [], []);
    const count4x5 = pool.filter(q => q.key === '4x5').length;
    expect(count4x5).toBe(2);
  });
});

describe('Questions.pick — fallback', () => {
  let ctx;
  beforeEach(() => { ctx = makeQCtxWithBuildPool(); });

  test('returns a question even when all excluded (fallback)', () => {
    // Exclude ALL answers for 2×2 to 2×2 range
    const q = ctx.Questions.pick(2, 2, {}, [4]);
    // Should fall back to any question, not crash
    expect(q).not.toBeNull();
    expect(q).toHaveProperty('answer');
  });
});

describe('Questions — addition carry filter', () => {
  let ctx;
  beforeEach(() => { ctx = makeQCtxWithBuildPool(); });

  test('easy (no carry): no question in pool has ones digits summing ≥ 10', () => {
    const pool = ctx.Questions._buildPool(1, 9, {}, [], [], 'add', { difficulty: 'easy' });
    const hasCarry = pool.some(q => (q.a % 10) + (q.b % 10) >= 10);
    expect(hasCarry).toBe(false);
  });

  test('hard (with carry): every question in pool has carry', () => {
    const pool = ctx.Questions._buildPool(1, 9, {}, [], [], 'add', { difficulty: 'hard' });
    expect(pool.length).toBeGreaterThan(0);
    const allHaveCarry = pool.every(q => (q.a % 10) + (q.b % 10) >= 10 ||
      Math.floor((q.a % 100) / 10) + Math.floor((q.b % 100) / 10) >= 10);
    expect(allHaveCarry).toBe(true);
  });

  test('medium (no difficulty): pool contains both carry and non-carry pairs', () => {
    const pool = ctx.Questions._buildPool(1, 9, {}, [], [], 'add', {});
    const hasCarry    = pool.some(q => (q.a % 10) + (q.b % 10) >= 10);
    const hasNoCarry  = pool.some(q => (q.a % 10) + (q.b % 10) < 10);
    expect(hasCarry).toBe(true);
    expect(hasNoCarry).toBe(true);
  });
});

describe('Questions — subtraction borrow filter', () => {
  let ctx;
  beforeEach(() => { ctx = makeQCtxWithBuildPool(); });

  test('easy (no borrow): no question requires borrowing from ones column', () => {
    const pool = ctx.Questions._buildPool(1, 9, {}, [], [], 'subtract', { difficulty: 'easy' });
    const hasBorrow = pool.some(q => (q.a % 10) < (q.b % 10));
    expect(hasBorrow).toBe(false);
  });

  test('hard (with borrow): every question requires borrowing', () => {
    // Use 20× (single-table) so bRange=1..12; pairs like 20-1, 20-3 etc. need borrow (0 < 1/3)
    const pool = ctx.Questions._buildPool(20, 20, {}, [], [], 'subtract', { difficulty: 'hard' });
    expect(pool.length).toBeGreaterThan(0);
    const allHaveBorrow = pool.every(q => (q.a % 10) < (q.b % 10) ||
      Math.floor((q.a % 100) / 10) < Math.floor((q.b % 100) / 10));
    expect(allHaveBorrow).toBe(true);
  });

  test('pick() falls back to unfiltered pool when difficulty filter empties it', () => {
    // 5−5 is the only pair (1-range), no borrow possible → hard filter empties it → fallback
    const q = ctx.Questions.pick(5, 5, {}, [], [], 'subtract', { difficulty: 'hard' });
    expect(q).not.toBeNull();
    expect(q).toHaveProperty('answer');
  });
});

describe('Questions — Zehner mode (Phase 3)', () => {
  let ctx;
  beforeEach(() => { ctx = makeQCtxWithBuildPool(); });

  test('multiply Zehner easy: all b values are multiples of 10 (not 100)', () => {
    const pool = ctx.Questions._buildPool(2, 9, {}, [], [], 'multiply', { difficulty: 'easy', zehner: true });
    expect(pool.length).toBeGreaterThan(0);
    const allTens = pool.every(q => q.b % 10 === 0 && q.b < 100);
    expect(allTens).toBe(true);
  });

  test('multiply Zehner medium: includes both ×10 and ×100 pairs', () => {
    const pool = ctx.Questions._buildPool(2, 9, {}, [], [], 'multiply', { difficulty: 'medium', zehner: true });
    const hasTens     = pool.some(q => q.b >= 10  && q.b < 100);
    const hasHundreds = pool.some(q => q.b >= 100 && q.b < 1000);
    expect(hasTens).toBe(true);
    expect(hasHundreds).toBe(true);
  });

  test('multiply Zehner: answer equals a × b', () => {
    const pool = ctx.Questions._buildPool(3, 3, {}, [], [], 'multiply', { zehner: true });
    pool.forEach(q => expect(q.answer).toBe(q.a * q.b));
  });

  test('divide Zehner easy: quotient is a multiple of 10', () => {
    const pool = ctx.Questions._buildPool(2, 9, {}, [], [], 'divide', { difficulty: 'easy', zehner: true });
    expect(pool.length).toBeGreaterThan(0);
    // answer = quotient = b (a multiple of 10)
    const allTens = pool.every(q => q.answer % 10 === 0 && q.answer < 100);
    expect(allTens).toBe(true);
  });

  test('divide Zehner: display is dividend ÷ divisor format', () => {
    const pool = ctx.Questions._buildPool(4, 4, {}, [], [], 'divide', { zehner: true });
    pool.forEach(q => {
      expect(q.display).toMatch(/^\d+ ÷ \d+$/);
      expect(q.answer * 4).toBe(q.a); // answer × divisor = dividend
    });
  });

  test('non-zehner multiply unchanged', () => {
    const pool = ctx.Questions._buildPool(3, 3, {}, [], [], 'multiply', { zehner: false });
    // Single table 3: a is always 3, b ranges 1–12 (standard mode)
    const allA3 = pool.every(q => q.a === 3);
    const allSmallB = pool.every(q => q.b >= 1 && q.b <= 12);
    expect(allA3).toBe(true);
    expect(allSmallB).toBe(true);
  });
});

describe('Questions — Halbschriftlich mode (Phase 6)', () => {
  let ctx;
  beforeEach(() => { ctx = makeQCtxWithBuildPool(); });

  test('easy: all b values are 2-digit (12–99)', () => {
    const pool = ctx.Questions._buildPool(2, 5, {}, [], [], 'multiply', { difficulty: 'easy', halbschriftlich: true });
    expect(pool.length).toBeGreaterThan(0);
    const allTwoDigit = pool.every(q => q.b >= 12 && q.b <= 99);
    expect(allTwoDigit).toBe(true);
  });

  test('medium: includes both 2-digit and 3-digit b values', () => {
    const pool = ctx.Questions._buildPool(3, 5, {}, [], [], 'multiply', { difficulty: 'medium', halbschriftlich: true });
    const hasTwoDigit   = pool.some(q => q.b >= 12  && q.b <= 99);
    const hasThreeDigit = pool.some(q => q.b >= 100 && q.b <= 999);
    expect(hasTwoDigit).toBe(true);
    expect(hasThreeDigit).toBe(true);
  });

  test('answer equals a × b', () => {
    const pool = ctx.Questions._buildPool(4, 4, {}, [], [], 'multiply', { halbschriftlich: true });
    pool.forEach(q => expect(q.answer).toBe(q.a * q.b));
  });

  test('key format is axb', () => {
    const pool = ctx.Questions._buildPool(3, 3, {}, [], [], 'multiply', { halbschriftlich: true });
    pool.forEach(q => expect(q.key).toMatch(/^\d+x\d+$/));
  });

  test('zehner and normal modes are unaffected', () => {
    const zehnerPool = ctx.Questions._buildPool(3, 5, {}, [], [], 'multiply', { zehner: true });
    const normalPool = ctx.Questions._buildPool(3, 5, {}, [], [], 'multiply', {});
    expect(zehnerPool.every(q => q.b % 10 === 0)).toBe(true);
    expect(normalPool.every(q => q.b >= 3 && q.b <= 5)).toBe(true);
  });
});

describe('Questions — large range sampling (Phase 5)', () => {
  let ctx;
  beforeEach(() => { ctx = makeQCtxWithBuildPool(); });

  test('add bis 100 easy: all pairs are multiples of 10', () => {
    const pool = ctx.Questions._buildPool(1, 99, {}, [], [], 'add', { difficulty: 'easy' });
    expect(pool.length).toBeGreaterThan(0);
    const allRound = pool.every(q => q.a % 10 === 0 && q.b % 10 === 0);
    expect(allRound).toBe(true);
  });

  test('add bis 100 hard: every pair has carry', () => {
    const pool = ctx.Questions._buildPool(1, 99, {}, [], [], 'add', { difficulty: 'hard' });
    expect(pool.length).toBeGreaterThan(0);
    const allCarry = pool.every(q => _hasCarryTest(q.a, q.b));
    expect(allCarry).toBe(true);
    function _hasCarryTest(a, b) {
      if ((a % 10) + (b % 10) >= 10) return true;
      if (Math.floor((a % 100) / 10) + Math.floor((b % 100) / 10) >= 10) return true;
      return false;
    }
  });

  test('add bis 1000 easy: all pairs are multiples of 100', () => {
    const pool = ctx.Questions._buildPool(1, 999, {}, [], [], 'add', { difficulty: 'easy' });
    expect(pool.length).toBeGreaterThan(0);
    const allRound = pool.every(q => q.a % 100 === 0 && q.b % 100 === 0);
    expect(allRound).toBe(true);
  });

  test('subtract bis 1000 hard: every pair has borrow', () => {
    const pool = ctx.Questions._buildPool(1, 999, {}, [], [], 'subtract', { difficulty: 'hard' });
    expect(pool.length).toBeGreaterThan(0);
    const allBorrow = pool.every(q => _hasBorrowTest(q.a, q.b));
    expect(allBorrow).toBe(true);
    function _hasBorrowTest(a, b) {
      if ((a % 10) < (b % 10)) return true;
      if (Math.floor((a % 100) / 10) < Math.floor((b % 100) / 10)) return true;
      return false;
    }
  });

  test('add bis 100 medium: pool contains diverse pairs', () => {
    const pool = ctx.Questions._buildPool(1, 99, {}, [], [], 'add', {});
    expect(pool.length).toBeGreaterThan(50);
    const unique = new Set(pool.map(q => q.key));
    expect(unique.size).toBeGreaterThan(30);
  });

  test('wrongQueue pairs always included with weight 16 in large range', () => {
    const wrongQueue = [{ key: '45a32' }];
    const pool = ctx.Questions._buildPool(1, 99, {}, [], wrongQueue, 'add', {});
    const count = pool.filter(q => q.key === '45a32').length;
    expect(count).toBe(16);
  });
});

describe('Questions — cross-operation picks', () => {
  test('pick works for all four operations independently', () => {
    const ctx = makeQCtx();
    const ops = ['multiply', 'divide', 'add', 'subtract'];
    for (const op of ops) {
      const q = ctx.Questions.pick(3, 6, {}, [], [], op, {});
      expect(q).not.toBeNull();
      expect(q).toHaveProperty('answer');
      expect(q).toHaveProperty('key');
    }
  });
});

describe('Questions — Halbschriftlich division (Phase 7)', () => {
  let ctx;
  beforeEach(() => { ctx = makeQCtxWithBuildPool(); });

  test('easy: all quotients are 2-digit (12–99)', () => {
    const pool = ctx.Questions._buildPool(2, 5, {}, [], [], 'divide', { difficulty: 'easy', halbschriftlich: true });
    expect(pool.length).toBeGreaterThan(0);
    const allTwoDigit = pool.every(q => q.answer >= 12 && q.answer <= 99);
    expect(allTwoDigit).toBe(true);
  });

  test('medium: includes both 2-digit and 3-digit quotients', () => {
    const pool = ctx.Questions._buildPool(3, 5, {}, [], [], 'divide', { difficulty: 'medium', halbschriftlich: true });
    const hasTwoDigit   = pool.some(q => q.answer >= 12  && q.answer <= 99);
    const hasThreeDigit = pool.some(q => q.answer >= 100 && q.answer <= 999);
    expect(hasTwoDigit).toBe(true);
    expect(hasThreeDigit).toBe(true);
  });

  test('dividend equals divisor × quotient (no remainder)', () => {
    const pool = ctx.Questions._buildPool(4, 4, {}, [], [], 'divide', { halbschriftlich: true });
    expect(pool.length).toBeGreaterThan(0);
    pool.forEach(q => {
      // q.a = dividend, q.b = divisor, q.answer = quotient
      expect(q.a).toBe(q.b * q.answer);
    });
  });

  test('key format is dividenddDivisor', () => {
    const pool = ctx.Questions._buildPool(3, 3, {}, [], [], 'divide', { halbschriftlich: true });
    pool.forEach(q => expect(q.key).toMatch(/^\d+d\d+$/));
  });

  test('display is "dividend ÷ divisor"', () => {
    const pool = ctx.Questions._buildPool(4, 4, {}, [], [], 'divide', { halbschriftlich: true });
    pool.forEach(q => expect(q.display).toMatch(/^\d+ ÷ \d+$/));
  });

  test('zehner divide mode unaffected', () => {
    const pool = ctx.Questions._buildPool(3, 5, {}, [], [], 'divide', { difficulty: 'easy', zehner: true });
    expect(pool.length).toBeGreaterThan(0);
    // In zehner divide easy, the answer (quotient) is a multiple of 10
    pool.forEach(q => expect(q.answer % 10).toBe(0));
  });
});
