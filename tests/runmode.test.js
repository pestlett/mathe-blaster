'use strict';

const {
  anteTarget,
  getAnteProgressSnapshot,
  getAntePerilState,
  getAnteMusicState,
} = require('../js/runmode.js');

describe('run mode ante helpers', () => {
  test('anteTarget scales with higher antes', () => {
    expect(anteTarget(1)).toBe(700);
    expect(anteTarget(2)).toBe(1500);
    expect(anteTarget(4)).toBe(3e4);
    expect(anteTarget(5)).toBe(2.5e9);
    expect(anteTarget(7)).toBe(3.0625e16);
  });

  test('getAnteProgressSnapshot measures score gained within the current ante', () => {
    const snapshot = getAnteProgressSnapshot({
      currentAnte: 2,
      level: 5,
      score: 610,
      anteStartScore: 400,
    });

    expect(snapshot.ante).toBe(2);
    expect(snapshot.targetScore).toBe(1500);
    expect(snapshot.scoreGained).toBe(210);
    expect(snapshot.remainingScore).toBe(1290);
    expect(snapshot.levelsCompleted).toBe(1);
    expect(snapshot.levelsRemaining).toBe(2);
    expect(snapshot.progressPercent).toBe(14);
  });

  test('marks early-ante pace trouble as tense or urgent', () => {
    // ante 2 (target=1500), level 5 (levelsCompleted=1)
    // tense: 0.18 <= ratio < 0.30 → scoreGained 270..449
    const tense = getAnteProgressSnapshot({
      currentAnte: 2,
      level: 5,
      score: 800,
      anteStartScore: 400,
    });
    // urgent: ratio < 0.18 → scoreGained < 270
    const urgent = getAnteProgressSnapshot({
      currentAnte: 2,
      level: 5,
      score: 640,
      anteStartScore: 400,
    });

    expect(getAntePerilState(tense)).toBe('tense');
    expect(getAntePerilState(urgent)).toBe('urgent');
  });

  test('tightens peril thresholds on the final ante level', () => {
    // ante 3 (target=3500), level 6 (levelsCompleted=2)
    // calm: ratio >= 0.82 → scoreGained >= 2870
    const calm = getAnteProgressSnapshot({
      currentAnte: 3,
      level: 6,
      score: 3370,
      anteStartScore: 500,
    });
    // tense: 0.55 <= ratio < 0.82 → scoreGained 1925..2869
    const tense = getAnteProgressSnapshot({
      currentAnte: 3,
      level: 6,
      score: 2500,
      anteStartScore: 500,
    });
    // urgent: ratio < 0.55 → scoreGained < 1925
    const urgent = getAnteProgressSnapshot({
      currentAnte: 3,
      level: 6,
      score: 1800,
      anteStartScore: 500,
    });

    expect(getAntePerilState(calm)).toBe('calm');
    expect(getAntePerilState(tense)).toBe('tense');
    expect(getAntePerilState(urgent)).toBe('urgent');
  });

  test('treats cleared antes as visually complete but musically calm', () => {
    const cleared = getAnteProgressSnapshot({
      currentAnte: 4,
      level: 12,
      score: 6000000,
      anteStartScore: 0,
    });

    expect(getAntePerilState(cleared)).toBe('cleared');
    expect(getAnteMusicState(cleared)).toBe('calm');
  });
});
