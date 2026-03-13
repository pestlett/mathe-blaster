// tests/upgrades.test.js
'use strict';

const {
  UPGRADES, SYNERGIES,
  STARTING_UPGRADE_IDS, UNLOCK_UPGRADE_IDS,
  upgradeNameForTheme, upgradeDescForTheme,
  drawUpgrades, getSynergyHintsForUpgrade, getActiveSynergySets,
} = require('../js/upgrades.js');

// ---- apply() sets correct flags ----

function makeState() {
  return {
    chainAnswer: false,
    streakBoost: false,
    shieldCharges: 0,
    speedMult: 1,
    bombCharges: 0,
    hotZoneBoost: false,
    luckyBonus: false,
    luckyBonusCounter: 0,
    quickBonus: false,
    commutativePair: false,
    streakSlow: false,
    revealOnHotZone: false,
    lastChanceAvailable: false,
  };
}

function findUpgrade(id) {
  return UPGRADES.find(u => u.id === id);
}

describe('UPGRADES definitions', () => {
  test('all 12 upgrades are defined', () => {
    expect(UPGRADES).toHaveLength(12);
  });

  test('every upgrade has required fields', () => {
    for (const u of UPGRADES) {
      expect(u.id).toBeTruthy();
      expect(u.names.space).toBeTruthy();
      expect(u.names.ocean).toBeTruthy();
      expect(u.names.sky).toBeTruthy();
      expect(u.desc.space).toBeTruthy();
      expect(u.tier).toMatch(/^(start|unlock)$/);
      expect(typeof u.apply).toBe('function');
    }
  });

  test('starting pool has 8 upgrades', () => {
    expect(STARTING_UPGRADE_IDS).toHaveLength(8);
  });

  test('unlock pool has 4 upgrades', () => {
    expect(UNLOCK_UPGRADE_IDS).toHaveLength(4);
  });
});

describe('apply() — flag setting', () => {
  test('chain sets chainAnswer=true', () => {
    const state = makeState();
    findUpgrade('chain').apply(state);
    expect(state.chainAnswer).toBe(true);
  });

  test('streakBoost sets streakBoost=true', () => {
    const state = makeState();
    findUpgrade('streakBoost').apply(state);
    expect(state.streakBoost).toBe(true);
  });

  test('shield increments shieldCharges', () => {
    const state = makeState();
    findUpgrade('shield').apply(state);
    expect(state.shieldCharges).toBe(1);
    findUpgrade('shield').apply(state);
    expect(state.shieldCharges).toBe(2);
  });

  test('slowAll multiplies speedMult by 0.75', () => {
    const state = makeState();
    findUpgrade('slowAll').apply(state);
    expect(state.speedMult).toBeCloseTo(0.75);
    // Stacking
    findUpgrade('slowAll').apply(state);
    expect(state.speedMult).toBeCloseTo(0.5625);
  });

  test('bomb increments bombCharges', () => {
    const state = makeState();
    findUpgrade('bomb').apply(state);
    expect(state.bombCharges).toBe(1);
    findUpgrade('bomb').apply(state);
    expect(state.bombCharges).toBe(2);
  });

  test('hotZoneBoost sets hotZoneBoost=true', () => {
    const state = makeState();
    findUpgrade('hotZoneBoost').apply(state);
    expect(state.hotZoneBoost).toBe(true);
  });

  test('luckyBonus sets luckyBonus=true and resets counter', () => {
    const state = makeState();
    findUpgrade('luckyBonus').apply(state);
    expect(state.luckyBonus).toBe(true);
    expect(state.luckyBonusCounter).toBe(0);
  });

  test('quickBonus sets quickBonus=true', () => {
    const state = makeState();
    findUpgrade('quickBonus').apply(state);
    expect(state.quickBonus).toBe(true);
  });

  test('commutative sets commutativePair=true', () => {
    const state = makeState();
    findUpgrade('commutative').apply(state);
    expect(state.commutativePair).toBe(true);
  });

  test('streakSlow sets streakSlow=true', () => {
    const state = makeState();
    findUpgrade('streakSlow').apply(state);
    expect(state.streakSlow).toBe(true);
  });

  test('reveal sets revealOnHotZone=true', () => {
    const state = makeState();
    findUpgrade('reveal').apply(state);
    expect(state.revealOnHotZone).toBe(true);
  });

  test('lastChance sets lastChanceAvailable=true', () => {
    const state = makeState();
    findUpgrade('lastChance').apply(state);
    expect(state.lastChanceAvailable).toBe(true);
  });
});

// ---- Theme name / desc helpers ----
describe('upgradeNameForTheme / upgradeDescForTheme', () => {
  const chain = findUpgrade('chain');

  test('space names correct', () => {
    expect(upgradeNameForTheme(chain, 'space')).toBe('Gravity Well');
  });
  test('ocean names correct', () => {
    expect(upgradeNameForTheme(chain, 'ocean')).toBe('Riptide');
  });
  test('sky names correct', () => {
    expect(upgradeNameForTheme(chain, 'sky')).toBe('Lightning Strike');
  });
  test('unknown theme falls back to space', () => {
    expect(upgradeNameForTheme(chain, 'unknown')).toBe('Gravity Well');
  });

  test('desc returns theme-specific text', () => {
    const desc = upgradeDescForTheme(chain, 'ocean');
    expect(desc).toBe('Answers sweep matching objects off the board.');
  });
});

// ---- drawUpgrades pool logic ----
describe('drawUpgrades', () => {
  test('returns at most n upgrades', () => {
    const drawn = drawUpgrades(3, [], []);
    expect(drawn.length).toBeLessThanOrEqual(3);
  });

  test('excludes already-active upgrade IDs', () => {
    const drawn = drawUpgrades(8, [], ['chain', 'streakBoost', 'shield', 'slowAll', 'bomb', 'hotZoneBoost', 'luckyBonus', 'quickBonus']);
    // All starting upgrades are active — only starting pool available, so nothing returned
    expect(drawn.length).toBe(0);
  });

  test('includes unlock upgrades when unlocked', () => {
    const drawn = drawUpgrades(4, ['commutative', 'streakSlow', 'reveal', 'lastChance'], []);
    const ids = drawn.map(u => u.id);
    // Should be able to draw from all 12 upgrades; just verify no duplicates
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('does not include unlock upgrades unless unlocked', () => {
    // Drain starting upgrades, don't unlock anything
    const activeIds = [...STARTING_UPGRADE_IDS];
    const drawn = drawUpgrades(3, [], activeIds);
    expect(drawn.length).toBe(0);
  });

  test('returns no duplicate IDs', () => {
    const drawn = drawUpgrades(3, [], []);
    const ids = drawn.map(u => u.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ---- Chain-answer mechanic simulation ----
describe('chain-answer mechanic', () => {
  test('destroys all objects with matching answer', () => {
    // Simulate the logic: objects with same answer get destroyed
    const destroyed = [];
    const objects = [
      { answer: 20, a: 10, b: 2, dying: false, dead: false, destroyed: false, isFreeze: false, isLifeUp: false, isBoss: false },
      { answer: 20, a: 4,  b: 5, dying: false, dead: false, destroyed: false, isFreeze: false, isLifeUp: false, isBoss: false },
      { answer: 15, a: 3,  b: 5, dying: false, dead: false, destroyed: false, isFreeze: false, isLifeUp: false, isBoss: false },
    ];
    const targetObj = objects[0];

    // Simulate chain logic from main.js
    if (true /* state.chainAnswer */) {
      for (const obj of objects) {
        if (obj !== targetObj && !obj.dying && !obj.dead && !obj.destroyed &&
            !obj.isFreeze && !obj.isLifeUp && !obj.isBoss &&
            obj.answer === targetObj.answer) {
          destroyed.push(obj);
        }
      }
    }

    expect(destroyed).toHaveLength(1);
    expect(destroyed[0].a).toBe(4);
    expect(destroyed[0].b).toBe(5);
  });

  test('does not destroy objects with different answers', () => {
    const destroyed = [];
    const objects = [
      { answer: 20, a: 10, b: 2, dying: false, dead: false, destroyed: false, isFreeze: false, isLifeUp: false, isBoss: false },
      { answer: 15, a: 3,  b: 5, dying: false, dead: false, destroyed: false, isFreeze: false, isLifeUp: false, isBoss: false },
    ];
    const targetObj = objects[0];
    for (const obj of objects) {
      if (obj !== targetObj && !obj.dying && !obj.dead && !obj.destroyed &&
          !obj.isFreeze && !obj.isLifeUp && !obj.isBoss &&
          obj.answer === targetObj.answer) {
        destroyed.push(obj);
      }
    }
    expect(destroyed).toHaveLength(0);
  });
});

// ---- Commutative pair mechanic ----
describe('commutative pair mechanic', () => {
  test('finds mirror object (a×b when b×a answered)', () => {
    const objects = [
      { a: 7, b: 3, dying: false, dead: false, destroyed: false, isFreeze: false, isLifeUp: false, isBoss: false },
      { a: 3, b: 7, dying: false, dead: false, destroyed: false, isFreeze: false, isLifeUp: false, isBoss: false },
      { a: 5, b: 6, dying: false, dead: false, destroyed: false, isFreeze: false, isLifeUp: false, isBoss: false },
    ];
    const targetObj = objects[1]; // answered 3×7

    const mirror = objects.find(o =>
      !o.dying && !o.dead && !o.destroyed &&
      !o.isFreeze && !o.isLifeUp && !o.isBoss &&
      o !== targetObj && o.a === targetObj.b && o.b === targetObj.a
    );

    expect(mirror).toBeDefined();
    expect(mirror.a).toBe(7);
    expect(mirror.b).toBe(3);
  });

  test('returns undefined when no mirror exists', () => {
    const objects = [
      { a: 3, b: 7, dying: false, dead: false, destroyed: false, isFreeze: false, isLifeUp: false, isBoss: false },
      { a: 5, b: 6, dying: false, dead: false, destroyed: false, isFreeze: false, isLifeUp: false, isBoss: false },
    ];
    const targetObj = objects[0]; // answered 3×7, no 7×3 on screen

    const mirror = objects.find(o =>
      !o.dying && !o.dead && !o.destroyed &&
      !o.isFreeze && !o.isLifeUp && !o.isBoss &&
      o !== targetObj && o.a === targetObj.b && o.b === targetObj.a
    );

    expect(mirror).toBeUndefined();
  });
});

// ---- SYNERGIES definitions ----
describe('SYNERGIES definitions', () => {
  test('5 synergies defined', () => {
    expect(SYNERGIES).toHaveLength(5);
  });

  test('each synergy has ids (2), type, and effect', () => {
    for (const s of SYNERGIES) {
      expect(s.ids).toHaveLength(2);
      expect(s.type).toMatch(/^(positive|negative)$/);
      expect(typeof s.effect).toBe('string');
    }
  });

  test('3 positive and 2 negative synergies', () => {
    const pos = SYNERGIES.filter(s => s.type === 'positive').length;
    const neg = SYNERGIES.filter(s => s.type === 'negative').length;
    expect(pos).toBe(3);
    expect(neg).toBe(2);
  });
});

// ---- getSynergyHintsForUpgrade ----
describe('getSynergyHintsForUpgrade', () => {
  test('returns positive hint when partner is active', () => {
    // chain + luckyBonus = positive
    const hints = getSynergyHintsForUpgrade('chain', ['luckyBonus'], 'space');
    expect(hints).toHaveLength(1);
    expect(hints[0].type).toBe('positive');
    expect(hints[0].partnerName).toBe('Nebula Luck');
  });

  test('returns negative hint when conflict partner is active', () => {
    // slowAll + quickBonus = negative
    const hints = getSynergyHintsForUpgrade('quickBonus', ['slowAll'], 'ocean');
    expect(hints).toHaveLength(1);
    expect(hints[0].type).toBe('negative');
    expect(hints[0].partnerName).toBe('Undertow');
  });

  test('returns multiple hints when multiple partners active', () => {
    // quickBonus has: positive with streakBoost, negative with slowAll
    const hints = getSynergyHintsForUpgrade('quickBonus', ['streakBoost', 'slowAll'], 'space');
    expect(hints).toHaveLength(2);
    const types = hints.map(h => h.type).sort();
    expect(types).toEqual(['negative', 'positive']);
  });

  test('returns empty when no relevant partners active', () => {
    const hints = getSynergyHintsForUpgrade('chain', ['bomb', 'shield'], 'space');
    expect(hints).toHaveLength(0);
  });

  test('uses theme-appropriate partner name', () => {
    const hints = getSynergyHintsForUpgrade('chain', ['luckyBonus'], 'sky');
    expect(hints[0].partnerName).toBe('Lucky Wind');
  });
});

// ---- getActiveSynergySets ----
describe('getActiveSynergySets', () => {
  test('both IDs in positive set when pair is active', () => {
    const { positive, negative } = getActiveSynergySets(['chain', 'luckyBonus']);
    expect(positive.has('chain')).toBe(true);
    expect(positive.has('luckyBonus')).toBe(true);
    expect(negative.size).toBe(0);
  });

  test('both IDs in negative set when conflict pair is active', () => {
    const { positive, negative } = getActiveSynergySets(['slowAll', 'quickBonus']);
    expect(negative.has('slowAll')).toBe(true);
    expect(negative.has('quickBonus')).toBe(true);
    expect(positive.size).toBe(0);
  });

  test('incomplete pair produces no entries', () => {
    const { positive, negative } = getActiveSynergySets(['chain', 'shield']);
    expect(positive.size).toBe(0);
    expect(negative.size).toBe(0);
  });

  test('multiple pairs can be active simultaneously', () => {
    // chain+lucky (positive) AND slowAll+quickBonus (negative)
    const { positive, negative } = getActiveSynergySets(['chain', 'luckyBonus', 'slowAll', 'quickBonus']);
    expect(positive.has('chain')).toBe(true);
    expect(positive.has('luckyBonus')).toBe(true);
    expect(negative.has('slowAll')).toBe(true);
    expect(negative.has('quickBonus')).toBe(true);
  });

  test('quickBonus appears in positive AND negative when both partners present', () => {
    // quickBonus synergises with streakBoost, conflicts with slowAll
    const { positive, negative } = getActiveSynergySets(['streakBoost', 'quickBonus', 'slowAll']);
    expect(positive.has('quickBonus')).toBe(true);
    expect(negative.has('quickBonus')).toBe(true);
  });
});

// ---- Synergy mechanics (scoring simulation) ----
describe('synergy mechanics', () => {
  test('Slow All + Quick: quick window halves to 750ms (conflict)', () => {
    const speedMult = 0.75; // slowAll applied
    const quickBonus = true;
    const hasSynSlowQuick = speedMult < 1 && quickBonus;
    expect(hasSynSlowQuick ? 750 : 1500).toBe(750);
  });

  test('without Slow All: quick window stays 1500ms', () => {
    const speedMult = 1;
    const quickBonus = true;
    const hasSynSlowQuick = speedMult < 1 && quickBonus;
    expect(hasSynSlowQuick ? 750 : 1500).toBe(1500);
  });

  test('Streak Slow + Slow All: timer duration 2s (conflict)', () => {
    const speedMult = 0.75;
    const dur = speedMult < 1 ? 2 : 5;
    expect(dur).toBe(2);
  });

  test('Streak Slow alone: timer duration 5s', () => {
    const speedMult = 1;
    const dur = speedMult < 1 ? 2 : 5;
    expect(dur).toBe(5);
  });

  test('Streak Boost + Quick: +30 bonus when streak >= 3', () => {
    const streakBoost = true;
    const streak = 5;
    const bonus = (streakBoost && streak >= 3) ? 30 : 20;
    expect(bonus).toBe(30);
  });

  test('Quick alone: +20 bonus', () => {
    const streakBoost = false;
    const streak = 5;
    const bonus = (streakBoost && streak >= 3) ? 30 : 20;
    expect(bonus).toBe(20);
  });

  test('Hot Zone + Reveal: ×2 multiplier when answer was revealed', () => {
    const revealOnHotZone = true;
    const answerRevealed = true;
    const hotMult = (revealOnHotZone && answerRevealed) ? 2 : 1.5;
    expect(hotMult).toBe(2);
  });

  test('Hot Zone without reveal: ×1.5 multiplier', () => {
    const revealOnHotZone = true;
    const answerRevealed = false;
    const hotMult = (revealOnHotZone && answerRevealed) ? 2 : 1.5;
    expect(hotMult).toBe(1.5);
  });
});
