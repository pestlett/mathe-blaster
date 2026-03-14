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

describe('Progress.setPlayer — per-player isolation', () => {
  let ctx;
  beforeEach(() => { ctx = makeProgressCtx(); });

  test('data is isolated between players', () => {
    ctx.Progress.setPlayer('Emma', 7);
    ctx.Progress.recordAttempt('3x4', true, 1000);

    ctx.Progress.setPlayer('Dad', 40);
    const dadStats = ctx.Progress.getStats();
    expect(dadStats['3x4']).toBeUndefined();
  });

  test('switching back to same player restores their data', () => {
    ctx.Progress.setPlayer('Emma', 7);
    ctx.Progress.recordAttempt('3x4', true, 1000);

    ctx.Progress.setPlayer('Dad', 40);
    ctx.Progress.setPlayer('Emma', 7);
    const stats = ctx.Progress.getStats();
    expect(stats['3x4'].attempts).toBe(1);
  });

  test('legacy data migrated when player name matches', () => {
    // Seed legacy data with player name
    ctx.localStorage.setItem('multiblaster_v1', JSON.stringify({
      player: { name: 'Emma' },
      stats: { '5x6': { attempts: 3, correct: 2, totalTimeMs: 6000, lastSeen: 0, masteredLevel: 2 } },
      sessions: [],
      achievements: {},
      lifetime: {},
    }));
    ctx.Progress.setPlayer('Emma', 7);
    const stats = ctx.Progress.getStats();
    expect(stats['5x6'].attempts).toBe(3);
  });

  test('legacy data NOT migrated when player name differs', () => {
    ctx.localStorage.setItem('multiblaster_v1', JSON.stringify({
      player: { name: 'Emma' },
      stats: { '5x6': { attempts: 3, correct: 2, totalTimeMs: 6000, lastSeen: 0, masteredLevel: 2 } },
      sessions: [],
      achievements: {},
      lifetime: {},
    }));
    ctx.Progress.setPlayer('Dad', 40);
    const stats = ctx.Progress.getStats();
    expect(stats['5x6']).toBeUndefined();
  });
});

describe('Progress extended tables unlock', () => {
  let ctx;
  beforeEach(() => { ctx = makeProgressCtx(); ctx.Progress.setPlayer('Emma', 7); });

  test('isExtendedTablesUnlocked is false by default', () => {
    expect(ctx.Progress.isExtendedTablesUnlocked()).toBe(false);
  });

  test('unlockExtendedTables sets flag', () => {
    ctx.Progress.unlockExtendedTables();
    expect(ctx.Progress.isExtendedTablesUnlocked()).toBe(true);
  });

  test('calling unlockExtendedTables twice is idempotent', () => {
    ctx.Progress.unlockExtendedTables();
    ctx.Progress.unlockExtendedTables();
    expect(ctx.Progress.isExtendedTablesUnlocked()).toBe(true);
  });

  test('extended tables unlock is per-player', () => {
    ctx.Progress.setPlayer('Emma', 7);
    ctx.Progress.unlockExtendedTables();

    ctx.Progress.setPlayer('Dad', 40);
    expect(ctx.Progress.isExtendedTablesUnlocked()).toBe(false);
  });
});

describe('Klasse 3 Komplett achievement', () => {
  function makeFullStats() {
    const s = {};
    // × tables 2–10 (each needs at least 1 cleanCorrect)
    for (let a = 2; a <= 10; a++) {
      for (let b = 1; b <= 12; b++) {
        s[`${a}x${b}`] = { attempts: 1, correct: 1, cleanCorrect: 1, totalTimeMs: 3000, masteredLevel: 1 };
      }
    }
    // ÷ tables 2–10 (each divisor × quotients 1–12)
    for (let a = 2; a <= 10; a++) {
      for (let b = 1; b <= 12; b++) {
        s[`${a*b}d${a}`] = { attempts: 1, correct: 1, cleanCorrect: 1, totalTimeMs: 3000, masteredLevel: 1 };
      }
    }
    // one + and one −
    s['12a5'] = { attempts: 1, correct: 1, totalTimeMs: 2000, masteredLevel: 1 };
    s['17s5'] = { attempts: 1, correct: 1, totalTimeMs: 2000, masteredLevel: 1 };
    return s;
  }

  test('unlocks when all × and ÷ tables (2–10) done and + and − tried', () => {
    const ctx = makeProgressCtx();
    const ach = ctx.Progress.ACHIEVEMENTS.find(a => a.id === 'klasse3_komplett');
    expect(ach).toBeDefined();
    const s = makeFullStats();
    expect(ach.check({}, s)).toBe(true);
  });

  test('does not unlock when ÷ tables incomplete', () => {
    const ctx = makeProgressCtx();
    const ach = ctx.Progress.ACHIEVEMENTS.find(a => a.id === 'klasse3_komplett');
    const s = makeFullStats();
    // Remove a ÷ table fact
    delete s['12d2']; // remove one fact from ÷2 table
    expect(ach.check({}, s)).toBe(false);
  });

  test('does not unlock when + never tried', () => {
    const ctx = makeProgressCtx();
    const ach = ctx.Progress.ACHIEVEMENTS.find(a => a.id === 'klasse3_komplett');
    const s = makeFullStats();
    // Remove addition
    delete s['12a5'];
    expect(ach.check({}, s)).toBe(false);
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
