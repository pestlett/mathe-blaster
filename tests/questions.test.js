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
