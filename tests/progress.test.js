// tests/progress.test.js
// Unit tests for Progress module — recordAttempt, masteredLevel, saveSession,
// achievement unlocking, isMostImproved, getDailyParams

const { makeContext, loadModule } = require('./helpers/context');

function makeProgressCtx() {
  const ctx = makeContext();
  loadModule(ctx, 'progress.js');
  return ctx;
}

describe('Progress.recordAttempt', () => {
  let ctx;
  beforeEach(() => { ctx = makeProgressCtx(); });

  test('first correct attempt creates entry with correct=1 attempts=1', () => {
    ctx.Progress.recordAttempt('3x4', true, 3000);
    const stats = ctx.Progress.getStats();
    expect(stats['3x4'].attempts).toBe(1);
    expect(stats['3x4'].correct).toBe(1);
    expect(stats['3x4'].masteredLevel).toBe(1);
  });

  test('first wrong attempt: attempts=1 correct=0 masteredLevel=0', () => {
    ctx.Progress.recordAttempt('3x4', false, 5000);
    const stats = ctx.Progress.getStats();
    expect(stats['3x4'].attempts).toBe(1);
    expect(stats['3x4'].correct).toBe(0);
    expect(stats['3x4'].masteredLevel).toBe(0);
  });

  test('masteredLevel increases on correct, capped at 5', () => {
    for (let i = 0; i < 7; i++) ctx.Progress.recordAttempt('5x6', true, 2000);
    const stats = ctx.Progress.getStats();
    expect(stats['5x6'].masteredLevel).toBe(5);
  });

  test('masteredLevel decreases on wrong, floor at 0', () => {
    ctx.Progress.recordAttempt('5x6', false, 2000);
    ctx.Progress.recordAttempt('5x6', false, 2000);
    const stats = ctx.Progress.getStats();
    expect(stats['5x6'].masteredLevel).toBe(0);
  });

  test('masteredLevel: correct then wrong', () => {
    ctx.Progress.recordAttempt('5x6', true, 2000);
    ctx.Progress.recordAttempt('5x6', true, 2000);
    ctx.Progress.recordAttempt('5x6', false, 2000);
    const stats = ctx.Progress.getStats();
    expect(stats['5x6'].masteredLevel).toBe(1); // 0+1+1-1
  });

  test('totalTimeMs accumulates', () => {
    ctx.Progress.recordAttempt('2x3', true, 1000);
    ctx.Progress.recordAttempt('2x3', true, 2000);
    const stats = ctx.Progress.getStats();
    expect(stats['2x3'].totalTimeMs).toBe(3000);
  });

  test('multiple keys tracked independently', () => {
    ctx.Progress.recordAttempt('2x3', true, 1000);
    ctx.Progress.recordAttempt('4x5', false, 2000);
    const stats = ctx.Progress.getStats();
    expect(stats['2x3'].correct).toBe(1);
    expect(stats['4x5'].correct).toBe(0);
  });
});

describe('Progress.saveSession and achievements', () => {
  let ctx;
  beforeEach(() => { ctx = makeProgressCtx(); });

  const baseSession = {
    score: 100, level: 2, accuracy: 0.8,
    theme: 'space', maxStreak: 2, bossesDefeated: 0, missCount: 1,
  };

  test('saves session and returns it in getSessions()', () => {
    ctx.Progress.saveSession(baseSession);
    const sessions = ctx.Progress.getSessions();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].score).toBe(100);
  });

  test('unlocks first_correct achievement on first session', () => {
    const unlocked = ctx.Progress.saveSession({ ...baseSession, accuracy: 0.75 });
    // totalCorrect = round(0.75 * 100) = 75 >= 1
    const ids = unlocked.map(a => a.id);
    expect(ids).toContain('first_correct');
  });

  test('unlocks streak_3 when maxStreak >= 3', () => {
    const unlocked = ctx.Progress.saveSession({ ...baseSession, maxStreak: 3 });
    expect(unlocked.map(a => a.id)).toContain('streak_3');
  });

  test('does NOT unlock streak_5 when maxStreak = 3', () => {
    const unlocked = ctx.Progress.saveSession({ ...baseSession, maxStreak: 3 });
    expect(unlocked.map(a => a.id)).not.toContain('streak_5');
  });

  test('unlocks accuracy_90 when bestAccuracy >= 0.9', () => {
    const unlocked = ctx.Progress.saveSession({ ...baseSession, accuracy: 0.95 });
    expect(unlocked.map(a => a.id)).toContain('accuracy_90');
  });

  test('unlocks no_miss when missCount === 0', () => {
    const unlocked = ctx.Progress.saveSession({ ...baseSession, missCount: 0 });
    expect(unlocked.map(a => a.id)).toContain('no_miss');
  });

  test('unlocks score_500 when score >= 500', () => {
    const unlocked = ctx.Progress.saveSession({ ...baseSession, score: 500 });
    expect(unlocked.map(a => a.id)).toContain('score_500');
  });

  test('unlocks sessions_5 after 5 sessions', () => {
    let unlocked = [];
    for (let i = 0; i < 5; i++) {
      unlocked = ctx.Progress.saveSession({ ...baseSession, accuracy: 0 });
    }
    expect(unlocked.map(a => a.id)).toContain('sessions_5');
  });

  test('same achievement not unlocked twice', () => {
    ctx.Progress.saveSession({ ...baseSession, score: 500 });
    const unlocked = ctx.Progress.saveSession({ ...baseSession, score: 600 });
    expect(unlocked.map(a => a.id)).not.toContain('score_500');
  });
});

describe('Progress.isMostImproved', () => {
  let ctx;
  beforeEach(() => { ctx = makeProgressCtx(); });

  const sess = (accuracy) => ({
    score: 100, level: 1, accuracy, theme: 'space',
    maxStreak: 0, bossesDefeated: 0, missCount: 1,
  });

  test('false with < 2 sessions', () => {
    expect(ctx.Progress.isMostImproved()).toBe(false);
  });

  test('true when last session accuracy is ≥10% higher', () => {
    ctx.Progress.saveSession(sess(0.6));
    ctx.Progress.saveSession(sess(0.75));
    expect(ctx.Progress.isMostImproved()).toBe(true);
  });

  test('false when improvement < 10%', () => {
    ctx.Progress.saveSession(sess(0.6));
    ctx.Progress.saveSession(sess(0.65));
    expect(ctx.Progress.isMostImproved()).toBe(false);
  });

  test('false when accuracy decreased', () => {
    ctx.Progress.saveSession(sess(0.8));
    ctx.Progress.saveSession(sess(0.7));
    expect(ctx.Progress.isMostImproved()).toBe(false);
  });
});

describe('Progress.getDailyParams', () => {
  let ctx;
  beforeEach(() => { ctx = makeProgressCtx(); });

  test('returns an object with table, difficulty, dateKey', () => {
    const params = ctx.Progress.getDailyParams();
    expect(params).toHaveProperty('table');
    expect(params).toHaveProperty('difficulty');
    expect(params).toHaveProperty('dateKey');
  });

  test('table is one of the expected values', () => {
    const { table } = ctx.Progress.getDailyParams();
    const valid = [2,3,4,5,6,7,8,9,10,11,12];
    expect(valid).toContain(table);
  });

  test('difficulty is one of easy/medium/hard', () => {
    const { difficulty } = ctx.Progress.getDailyParams();
    expect(['easy','medium','hard']).toContain(difficulty);
  });

  test('is deterministic for the same date', () => {
    const a = ctx.Progress.getDailyParams();
    const b = ctx.Progress.getDailyParams();
    expect(a).toEqual(b);
  });
});
