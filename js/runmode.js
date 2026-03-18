// runmode.js - shared helpers for run-mode ante pacing

(function(global) {
  function anteTarget(ante) {
    const targets = [0, 700, 1500, 3500, 3e4, 2.5e9, 8.75e12, 3.0625e16, 1.072e20, 3.75e23, 1.313e27];
    if (ante <= 10) return targets[ante] || 0;
    // Beyond ante 10: multiply by ~3500 per ante (matches late-game compound carry-over)
    let t = targets[10];
    for (let i = 10; i < ante; i++) t *= 3500;
    return t;
  }

  function clamp01(value) {
    return Math.max(0, Math.min(1, value));
  }

  function getAnteProgressSnapshot(state) {
    const ante = Math.max(1, Number(state?.currentAnte) || 1);
    const level = Math.max(1, Number(state?.level) || 1);
    const targetScore = anteTarget(ante);
    const scoreGained = Math.max(0, (Number(state?.score) || 0) - (Number(state?.anteStartScore) || 0));
    const remainingScore = Math.max(0, targetScore - scoreGained);
    const levelsCompleted = Math.max(0, Math.min(2, (level - 1) % 3));
    const levelsRemaining = Math.max(1, 3 - levelsCompleted);
    const progressRatio = targetScore > 0 ? clamp01(scoreGained / targetScore) : 1;

    return {
      ante,
      level,
      targetScore,
      scoreGained,
      remainingScore,
      levelsCompleted,
      levelsRemaining,
      progressRatio,
      progressPercent: Math.round(progressRatio * 100),
    };
  }

  function getAntePerilState(snapshot) {
    if (!snapshot || snapshot.targetScore <= 0) return 'calm';
    if (snapshot.scoreGained >= snapshot.targetScore) return 'cleared';

    if (snapshot.levelsCompleted >= 2) {
      if (snapshot.progressRatio < 0.55) return 'urgent';
      if (snapshot.progressRatio < 0.82) return 'tense';
      return 'calm';
    }

    if (snapshot.levelsCompleted === 1) {
      if (snapshot.progressRatio < 0.18) return 'urgent';
      if (snapshot.progressRatio < 0.30) return 'tense';
    }

    return 'calm';
  }

  function getAnteMusicState(snapshot) {
    const peril = getAntePerilState(snapshot);
    return peril === 'cleared' ? 'calm' : peril;
  }

  const api = {
    anteTarget,
    getAnteProgressSnapshot,
    getAntePerilState,
    getAnteMusicState,
  };

  global.RunMode = api;

  if (typeof module !== 'undefined') {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
