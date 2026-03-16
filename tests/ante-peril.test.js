// tests/ante-peril.test.js
// Tests for ante score targets and peril threshold calculations
'use strict';

// anteTarget() — extracted from js/main.js (must stay in sync)
function anteTarget(ante) {
  const base = [0, 150, 350, 650, 1050];
  if (ante <= 4) return base[ante] || 0;
  return 1050 + (ante - 4) * 450;
}

// Peril calculation — mirrors updateAntePeril() in js/main.js
function calcAntePeril(level, score, anteStartScore, anteTargetVal) {
  if (!anteTargetVal || anteTargetVal <= 0) return 'none';
  const gained = score - (anteStartScore || 0);
  const progress = gained / anteTargetVal;
  const levelInAnte = (level - 1) % 3;
  if (levelInAnte === 0) {
    return 'none';
  } else if (levelInAnte === 1) {
    if (progress < 0.10)      return 'danger';
    else if (progress < 0.30) return 'behind';
    else                       return 'none';
  } else {
    if (progress < 0.40)      return 'danger';
    else if (progress < 0.70) return 'behind';
    else                       return 'none';
  }
}

// ── anteTarget() ─────────────────────────────────────────────────

describe('anteTarget', () => {
  test('ante 0 returns 0', () => {
    expect(anteTarget(0)).toBe(0);
  });

  test('ante 1 returns 150', () => {
    expect(anteTarget(1)).toBe(150);
  });

  test('ante 2 returns 350', () => {
    expect(anteTarget(2)).toBe(350);
  });

  test('ante 3 returns 650', () => {
    expect(anteTarget(3)).toBe(650);
  });

  test('ante 4 returns 1050', () => {
    expect(anteTarget(4)).toBe(1050);
  });

  test('ante 5 uses linear formula', () => {
    expect(anteTarget(5)).toBe(1050 + 450);
  });

  test('ante 6 uses linear formula', () => {
    expect(anteTarget(6)).toBe(1050 + 2 * 450);
  });

  test('targets increase monotonically', () => {
    for (let a = 1; a <= 10; a++) {
      expect(anteTarget(a + 1)).toBeGreaterThan(anteTarget(a));
    }
  });
});

// ── calcAntePeril() ──────────────────────────────────────────────

describe('calcAntePeril', () => {
  const target = 300;

  describe('level 1 of ante (levelInAnte=0)', () => {
    test('always returns none regardless of progress', () => {
      expect(calcAntePeril(1, 0, 0, target)).toBe('none');
      expect(calcAntePeril(4, 0, 0, target)).toBe('none');
      expect(calcAntePeril(7, 0, 0, target)).toBe('none');
    });
  });

  describe('level 2 of ante (levelInAnte=1)', () => {
    test('danger when progress < 10%', () => {
      // 9% of 300 = 27
      expect(calcAntePeril(2, 27, 0, target)).toBe('danger');
      expect(calcAntePeril(2, 0, 0, target)).toBe('danger');
    });

    test('behind when 10% <= progress < 30%', () => {
      // 10% of 300 = 30
      expect(calcAntePeril(2, 30, 0, target)).toBe('behind');
      // 29% of 300 = 87
      expect(calcAntePeril(2, 87, 0, target)).toBe('behind');
    });

    test('none when progress >= 30%', () => {
      // 30% of 300 = 90
      expect(calcAntePeril(2, 90, 0, target)).toBe('none');
      expect(calcAntePeril(2, 200, 0, target)).toBe('none');
    });

    test('boundary at exactly 10%', () => {
      expect(calcAntePeril(2, 30, 0, target)).toBe('behind');
    });

    test('boundary just below 10%', () => {
      expect(calcAntePeril(2, 29, 0, target)).toBe('danger');
    });
  });

  describe('level 3 of ante (levelInAnte=2)', () => {
    test('danger when progress < 40%', () => {
      // 39% of 300 = 117
      expect(calcAntePeril(3, 117, 0, target)).toBe('danger');
      expect(calcAntePeril(3, 0, 0, target)).toBe('danger');
    });

    test('behind when 40% <= progress < 70%', () => {
      // 40% of 300 = 120
      expect(calcAntePeril(3, 120, 0, target)).toBe('behind');
      // 69% of 300 = 207
      expect(calcAntePeril(3, 207, 0, target)).toBe('behind');
    });

    test('none when progress >= 70%', () => {
      // 70% of 300 = 210
      expect(calcAntePeril(3, 210, 0, target)).toBe('none');
      expect(calcAntePeril(3, 300, 0, target)).toBe('none');
    });

    test('boundary at exactly 40%', () => {
      expect(calcAntePeril(3, 120, 0, target)).toBe('behind');
    });

    test('boundary just below 40%', () => {
      expect(calcAntePeril(3, 119, 0, target)).toBe('danger');
    });

    test('boundary at exactly 70%', () => {
      expect(calcAntePeril(3, 210, 0, target)).toBe('none');
    });

    test('boundary just below 70%', () => {
      expect(calcAntePeril(3, 209, 0, target)).toBe('behind');
    });
  });

  describe('uses anteStartScore as offset', () => {
    test('progress is delta, not absolute', () => {
      // anteStartScore=500, score=527, target=300 → gained=27 → 9% → danger (level 2)
      expect(calcAntePeril(2, 527, 500, target)).toBe('danger');
      // anteStartScore=500, score=590, target=300 → gained=90 → 30% → none (level 2)
      expect(calcAntePeril(2, 590, 500, target)).toBe('none');
    });
  });

  describe('edge cases', () => {
    test('zero target returns none', () => {
      expect(calcAntePeril(2, 50, 0, 0)).toBe('none');
    });

    test('negative target returns none', () => {
      expect(calcAntePeril(2, 50, 0, -100)).toBe('none');
    });

    test('null target returns none', () => {
      expect(calcAntePeril(2, 50, 0, null)).toBe('none');
    });

    test('progress > 100% is none', () => {
      expect(calcAntePeril(3, 400, 0, target)).toBe('none');
    });
  });
});
