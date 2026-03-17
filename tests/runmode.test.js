'use strict';

const {
  anteTarget,
  getAnteProgressSnapshot,
  getAntePerilState,
  getAnteMusicState,
} = require('../js/runmode.js');

describe('run mode ante helpers', () => {
  test('anteTarget scales with higher antes', () => {
    expect(anteTarget(1)).toBe(150);
    expect(anteTarget(2)).toBe(350);
    expect(anteTarget(4)).toBe(50000);
    expect(anteTarget(5)).toBe(500000);
    expect(anteTarget(7)).toBe(50000000);
  });

  test('getAnteProgressSnapshot measures score gained within the current ante', () => {
    const snapshot = getAnteProgressSnapshot({
      currentAnte: 2,
      level: 5,
      score: 610,
      anteStartScore: 400,
    });

    expect(snapshot.ante).toBe(2);
    expect(snapshot.targetScore).toBe(350);
    expect(snapshot.scoreGained).toBe(210);
    expect(snapshot.remainingScore).toBe(140);
    expect(snapshot.levelsCompleted).toBe(1);
    expect(snapshot.levelsRemaining).toBe(2);
    expect(snapshot.progressPercent).toBe(60);
  });

  test('marks early-ante pace trouble as tense or urgent', () => {
    const tense = getAnteProgressSnapshot({
      currentAnte: 2,
      level: 5,
      score: 490,
      anteStartScore: 400,
    });
    const urgent = getAnteProgressSnapshot({
      currentAnte: 2,
      level: 5,
      score: 450,
      anteStartScore: 400,
    });

    expect(getAntePerilState(tense)).toBe('tense');
    expect(getAntePerilState(urgent)).toBe('urgent');
  });

  test('tightens peril thresholds on the final ante level', () => {
    const calm = getAnteProgressSnapshot({
      currentAnte: 3,
      level: 6,
      score: 1085,
      anteStartScore: 500,
    });
    const tense = getAnteProgressSnapshot({
      currentAnte: 3,
      level: 6,
      score: 970,
      anteStartScore: 500,
    });
    const urgent = getAnteProgressSnapshot({
      currentAnte: 3,
      level: 6,
      score: 820,
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
      score: 60000,
      anteStartScore: 0,
    });

    expect(getAntePerilState(cleared)).toBe('cleared');
    expect(getAnteMusicState(cleared)).toBe('calm');
  });
});
