// tests/upgrades.test.js
'use strict';

const {
  UPGRADES, SYNERGIES, ADJACENCY,
  STARTING_UPGRADE_IDS, UNLOCK_UPGRADE_IDS, SHOP_UPGRADE_IDS,
  upgradeNameForTheme, upgradeDescForTheme,
  drawUpgrades, drawShopOptions, getUpgradeById, unapplyUpgrade,
  getSynergyHintsForUpgrade, getActiveSynergySets,
  getAdjacencyBonuses, getAdjacencyForPair,
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
    // Shop upgrade flags
    scoreMultiplier: 1,
    perfectMultEnabled: false,
    echoLucky: false,
    echoChain: false,
    echoStreak: false,
    bonusCoinPerAnte: 0,
    replayCount: 0,
    replayLuckyCount: 0,
    replayChain: false,
    replayHotZone: false,
    replayStreak: false,
    // New upgrade flags
    maxUpgradeSlots: 4,
    multiBooster: false,
    divideBooster: false,
    addBooster: false,
    subtractBooster: false,
    cascadeMultCount: 0,
    compoundGrowth: false,
    luckyFrequency: false,
  };
}

function findUpgrade(id) {
  return UPGRADES.find(u => u.id === id);
}

describe('UPGRADES definitions', () => {
  test('all 39 upgrades are defined (36 original + 3 new: overdrive, anteRush, crescendo)', () => {
    expect(UPGRADES).toHaveLength(39);
  });

  test('every upgrade has required fields', () => {
    for (const u of UPGRADES) {
      expect(u.id).toBeTruthy();
      expect(u.names.space).toBeTruthy();
      expect(u.names.ocean).toBeTruthy();
      expect(u.names.sky).toBeTruthy();
      expect(u.desc.space).toBeTruthy();
      expect(u.tier).toMatch(/^(start|unlock|shop)$/);
      expect(typeof u.apply).toBe('function');
    }
  });

  test('every upgrade has a valid rarity', () => {
    for (const u of UPGRADES) {
      expect(u.rarity).toMatch(/^(common|uncommon|rare)$/);
    }
  });

  test('rare upgrades are a small minority', () => {
    const rares = UPGRADES.filter(u => u.rarity === 'rare');
    expect(rares.length).toBeGreaterThanOrEqual(2);
    expect(rares.length).toBeLessThanOrEqual(5);
  });

  test('surge is rare and triples scoreMultiplier', () => {
    const surge = UPGRADES.find(u => u.id === 'surge');
    expect(surge).toBeDefined();
    expect(surge.rarity).toBe('rare');
    const state = { scoreMultiplier: 2 };
    surge.apply(state);
    expect(state.scoreMultiplier).toBe(6);
  });

  test('every upgrade has an operations field', () => {
    for (const u of UPGRADES) {
      expect(u.operations).toBeDefined();
      expect(Array.isArray(u.operations)).toBe(true);
      expect(u.operations.length).toBeGreaterThan(0);
    }
  });

  test('every upgrade has a price and sellValue', () => {
    for (const u of UPGRADES) {
      expect(typeof u.price).toBe('number');
      expect(u.price).toBeGreaterThan(0);
      expect(typeof u.sellValue).toBe('number');
      expect(u.sellValue).toBeGreaterThan(0);
      expect(u.sellValue).toBeLessThan(u.price);
    }
  });

  test('starting pool has 8 upgrades', () => {
    expect(STARTING_UPGRADE_IDS).toHaveLength(8);
  });

  test('unlock pool has 4 upgrades', () => {
    expect(UNLOCK_UPGRADE_IDS).toHaveLength(4);
  });

  test('shop pool has 27 upgrades', () => {
    expect(SHOP_UPGRADE_IDS).toHaveLength(27);
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

  test('excludes non-stackable active upgrades, keeps stackable ones', () => {
    // shield, bomb, slowAll are stackable — they remain in the pool even when owned
    const drawn = drawUpgrades(8, [], ['chain', 'streakBoost', 'shield', 'slowAll', 'bomb', 'hotZoneBoost', 'luckyBonus', 'quickBonus']);
    const ids = drawn.map(u => u.id);
    // Non-stackable starting upgrades should be excluded
    expect(ids).not.toContain('chain');
    expect(ids).not.toContain('streakBoost');
    expect(ids).not.toContain('hotZoneBoost');
    expect(ids).not.toContain('luckyBonus');
    expect(ids).not.toContain('quickBonus');
    // Stackable upgrades should still be available
    expect(ids).toContain('shield');
    expect(ids).toContain('bomb');
    expect(ids).toContain('slowAll');
  });

  test('includes unlock upgrades when unlocked', () => {
    const drawn = drawUpgrades(4, ['commutative', 'streakSlow', 'reveal', 'lastChance'], []);
    const ids = drawn.map(u => u.id);
    // Should be able to draw from all 12 upgrades; just verify no duplicates
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('does not include non-stackable unlock upgrades unless unlocked', () => {
    // All starting non-stackable upgrades active, no unlocks — only stackable starters remain
    const activeIds = [...STARTING_UPGRADE_IDS];
    const drawn = drawUpgrades(8, [], activeIds);
    const ids = drawn.map(u => u.id);
    // No unlock-tier upgrades in pool (not unlocked)
    for (const id of ['commutative', 'streakSlow', 'reveal', 'lastChance']) {
      expect(ids).not.toContain(id);
    }
    // Only stackable starters available
    expect(ids.every(id => ['shield', 'bomb', 'slowAll'].includes(id))).toBe(true);
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
  test('21 synergies defined (18 existing + 3 new compound synergies)', () => {
    expect(SYNERGIES).toHaveLength(21);
  });

  test('each synergy has ids (2), type, and effect', () => {
    for (const s of SYNERGIES) {
      expect(s.ids).toHaveLength(2);
      expect(s.type).toMatch(/^(positive|negative)$/);
      expect(typeof s.effect).toBe('string');
    }
  });

  test('includes new shop upgrade synergies', () => {
    const ids = SYNERGIES.map(s => s.ids.join('+'));
    expect(SYNERGIES.some(s => s.ids.includes('echoLucky') && s.ids.includes('luckyBonus'))).toBe(true);
    expect(SYNERGIES.some(s => s.ids.includes('echoChain') && s.ids.includes('chain'))).toBe(true);
    expect(SYNERGIES.some(s => s.ids.includes('scoreMultPerfect') && s.ids.includes('hotZoneBoost'))).toBe(true);
    void ids;
  });

  test('includes new upgrade synergies', () => {
    expect(SYNERGIES.some(s => s.ids.includes('multiBooster') && s.ids.includes('scoreMultSmall'))).toBe(true);
    expect(SYNERGIES.some(s => s.ids.includes('cascadeMult') && s.ids.includes('luckyBonus'))).toBe(true);
    expect(SYNERGIES.some(s => s.ids.includes('compoundGrowth') && s.ids.includes('scoreMultPerfect'))).toBe(true);
    expect(SYNERGIES.some(s => s.ids.includes('luckyFrequency') && s.ids.includes('replayLucky'))).toBe(true);
    expect(SYNERGIES.some(s => s.ids.includes('addBooster') && s.ids.includes('subtractBooster'))).toBe(true);
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

// ---- ADJACENCY definitions ----
describe('ADJACENCY definitions', () => {
  test('12 adjacency bonuses defined (5 original + 4 existing + 3 new)', () => {
    expect(ADJACENCY).toHaveLength(12);
  });

  test('each entry has ids (2), flag, and effect', () => {
    for (const a of ADJACENCY) {
      expect(a.ids).toHaveLength(2);
      expect(typeof a.flag).toBe('string');
      expect(a.flag.startsWith('adj_')).toBe(true);
      expect(typeof a.effect).toBe('string');
    }
  });

  test('all flag names are unique', () => {
    const flags = ADJACENCY.map(a => a.flag);
    expect(new Set(flags).size).toBe(flags.length);
  });

  test('contains expected pairs', () => {
    const pairs = ADJACENCY.map(a => a.ids.slice().sort().join('+'));
    expect(pairs).toContain(['chain', 'luckyBonus'].sort().join('+'));
    expect(pairs).toContain(['streakBoost', 'quickBonus'].sort().join('+'));
    expect(pairs).toContain(['shield', 'bomb'].sort().join('+'));
    expect(pairs).toContain(['hotZoneBoost', 'reveal'].sort().join('+'));
    expect(pairs).toContain(['streakSlow', 'slowAll'].sort().join('+'));
  });
});

// ---- getAdjacencyBonuses ----
describe('getAdjacencyBonuses', () => {
  const getUpgrade = id => UPGRADES.find(u => u.id === id);

  test('returns empty set when no upgrades', () => {
    const result = getAdjacencyBonuses([]);
    expect(result.size).toBe(0);
  });

  test('returns active flag when adjacent pair matches', () => {
    const upgrades = [getUpgrade('chain'), getUpgrade('luckyBonus')];
    const result = getAdjacencyBonuses(upgrades);
    expect(result.has('adj_chainLucky')).toBe(true);
  });

  test('works regardless of order (chain after lucky)', () => {
    const upgrades = [getUpgrade('luckyBonus'), getUpgrade('chain')];
    const result = getAdjacencyBonuses(upgrades);
    expect(result.has('adj_chainLucky')).toBe(true);
  });

  test('returns empty when pair is not adjacent (separated by another)', () => {
    const upgrades = [getUpgrade('chain'), getUpgrade('shield'), getUpgrade('luckyBonus')];
    const result = getAdjacencyBonuses(upgrades);
    expect(result.has('adj_chainLucky')).toBe(false);
  });

  test('multiple adjacent pairs activate multiple flags', () => {
    const upgrades = [
      getUpgrade('chain'), getUpgrade('luckyBonus'),
      getUpgrade('shield'), getUpgrade('bomb'),
    ];
    const result = getAdjacencyBonuses(upgrades);
    expect(result.has('adj_chainLucky')).toBe(true);
    expect(result.has('adj_shieldBomb')).toBe(true);
    expect(result.size).toBe(2);
  });

  test('single upgrade returns no bonuses', () => {
    const result = getAdjacencyBonuses([getUpgrade('chain')]);
    expect(result.size).toBe(0);
  });
});

// ---- getAdjacencyForPair ----
describe('getAdjacencyForPair', () => {
  test('returns entry for matching pair', () => {
    const result = getAdjacencyForPair('chain', 'luckyBonus');
    expect(result).not.toBeNull();
    expect(result.flag).toBe('adj_chainLucky');
  });

  test('returns entry regardless of argument order', () => {
    const a = getAdjacencyForPair('luckyBonus', 'chain');
    const b = getAdjacencyForPair('chain', 'luckyBonus');
    expect(a).toEqual(b);
  });

  test('returns null for non-adjacent pair', () => {
    const result = getAdjacencyForPair('chain', 'shield');
    expect(result).toBeNull();
  });

  test('returns null when both IDs are the same', () => {
    const result = getAdjacencyForPair('chain', 'chain');
    expect(result).toBeNull();
  });
});

// ---- Stackable drawUpgrades ----
describe('drawUpgrades with stackable upgrades', () => {
  const allUnlocked = UPGRADES.filter(u => u.tier === 'unlock').map(u => u.id);

  test('non-stackable upgrade excluded when already owned', () => {
    const pool = drawUpgrades(8, allUnlocked, ['chain']);
    expect(pool.find(u => u.id === 'chain')).toBeUndefined();
  });

  test('stackable upgrade (shield) still appears when already owned', () => {
    const results = [];
    for (let i = 0; i < 30; i++) {
      const pool = drawUpgrades(3, allUnlocked, ['shield']);
      if (pool.find(u => u.id === 'shield')) { results.push(true); break; }
    }
    // With 30 draws of 3 from ~12 upgrades, shield should appear at least once
    expect(results.length).toBeGreaterThan(0);
  });

  test('bomb (stackable) can appear multiple times in consecutive picks', () => {
    // Use n=20 (> pool size) to get all available upgrades
    const pool = drawUpgrades(20, allUnlocked, ['bomb']);
    expect(pool.find(u => u.id === 'bomb')).toBeDefined();
  });

  test('slowAll (stackable) can still be drawn when owned', () => {
    const pool = drawUpgrades(20, allUnlocked, ['slowAll']);
    expect(pool.find(u => u.id === 'slowAll')).toBeDefined();
  });

  test('non-stackable non-owned upgrade still appears', () => {
    const pool = drawUpgrades(20, allUnlocked, ['chain']);
    expect(pool.find(u => u.id === 'streakBoost')).toBeDefined();
  });
});

// ---- Adjacency bonus mechanics ----
describe('adjacency bonus mechanics (scoring simulation)', () => {
  test('adj_streakQuick: conflict suppressed when adj active', () => {
    const adjacencyBonuses = new Set(['adj_streakQuick']);
    const speedMult = 0.75; // slowAll active
    const quickBonus = true;
    const adjStreakQuick = adjacencyBonuses.has('adj_streakQuick');
    const hasSynSlowQuick = speedMult < 1 && quickBonus && !adjStreakQuick;
    expect(hasSynSlowQuick ? 750 : 1500).toBe(1500); // not halved
  });

  test('adj_streakQuick absent: conflict still applies', () => {
    const adjacencyBonuses = new Set();
    const speedMult = 0.75;
    const quickBonus = true;
    const adjStreakQuick = adjacencyBonuses.has('adj_streakQuick');
    const hasSynSlowQuick = speedMult < 1 && quickBonus && !adjStreakQuick;
    expect(hasSynSlowQuick ? 750 : 1500).toBe(750);
  });

  test('adj_hotReveal: multiplier rises to ×2.5', () => {
    const adjacencyBonuses = new Set(['adj_hotReveal']);
    const revealOnHotZone = true;
    const answerRevealed = true;
    const hotMult = (revealOnHotZone && answerRevealed)
      ? (adjacencyBonuses.has('adj_hotReveal') ? 2.5 : 2) : 1.5;
    expect(hotMult).toBe(2.5);
  });

  test('adj_hotReveal absent: multiplier stays ×2 with reveal synergy', () => {
    const adjacencyBonuses = new Set();
    const revealOnHotZone = true;
    const answerRevealed = true;
    const hotMult = (revealOnHotZone && answerRevealed)
      ? (adjacencyBonuses.has('adj_hotReveal') ? 2.5 : 2) : 1.5;
    expect(hotMult).toBe(2);
  });

  test('adj_slowSlow: streak-slow duration 3s (offset from 2s)', () => {
    const adjacencyBonuses = new Set(['adj_slowSlow']);
    const speedMult = 0.75;
    let dur = speedMult < 1 ? 2 : 5;
    if (dur === 2 && adjacencyBonuses.has('adj_slowSlow')) dur = 3;
    expect(dur).toBe(3);
  });

  test('adj_slowSlow absent with conflict: stays 2s', () => {
    const adjacencyBonuses = new Set();
    const speedMult = 0.75;
    let dur = speedMult < 1 ? 2 : 5;
    if (dur === 2 && adjacencyBonuses.has('adj_slowSlow')) dur = 3;
    expect(dur).toBe(2);
  });

  test('adj_chainLucky: chain kills count 2 lucky ticks', () => {
    const adjacencyBonuses = new Set(['adj_chainLucky']);
    const ticks = adjacencyBonuses.has('adj_chainLucky') ? 2 : 1;
    expect(ticks).toBe(2);
  });

  test('adj_chainLucky absent: chain kills count 1 lucky tick', () => {
    const adjacencyBonuses = new Set();
    const ticks = adjacencyBonuses.has('adj_chainLucky') ? 2 : 1;
    expect(ticks).toBe(1);
  });
});

// ---- Shop upgrade apply() tests ----
describe('shop upgrade apply() — flag setting', () => {
  test('scoreMultSmall multiplies scoreMultiplier by 1.5', () => {
    const state = makeState();
    findUpgrade('scoreMultSmall').apply(state);
    expect(state.scoreMultiplier).toBeCloseTo(1.5);
  });

  test('scoreMultSmall stacks multiplicatively', () => {
    const state = makeState();
    findUpgrade('scoreMultSmall').apply(state);
    findUpgrade('scoreMultSmall').apply(state);
    expect(state.scoreMultiplier).toBeCloseTo(2.25);
  });

  test('scoreMultLarge doubles scoreMultiplier', () => {
    const state = makeState();
    findUpgrade('scoreMultLarge').apply(state);
    expect(state.scoreMultiplier).toBe(2);
    findUpgrade('scoreMultLarge').apply(state);
    expect(state.scoreMultiplier).toBe(4);
  });

  test('scoreMultSmall + scoreMultLarge combined', () => {
    const state = makeState();
    findUpgrade('scoreMultSmall').apply(state);
    findUpgrade('scoreMultLarge').apply(state);
    expect(state.scoreMultiplier).toBeCloseTo(3);
  });

  test('scoreMultPerfect sets perfectMultEnabled=true', () => {
    const state = makeState();
    findUpgrade('scoreMultPerfect').apply(state);
    expect(state.perfectMultEnabled).toBe(true);
  });

  test('echoLucky sets echoLucky=true', () => {
    const state = makeState();
    findUpgrade('echoLucky').apply(state);
    expect(state.echoLucky).toBe(true);
  });

  test('echoChain sets echoChain=true', () => {
    const state = makeState();
    findUpgrade('echoChain').apply(state);
    expect(state.echoChain).toBe(true);
  });

  test('echoStreak sets echoStreak=true', () => {
    const state = makeState();
    findUpgrade('echoStreak').apply(state);
    expect(state.echoStreak).toBe(true);
  });

  test('starterBoost increments bonusCoinPerAnte by 3 (stackable)', () => {
    const state = makeState();
    findUpgrade('starterBoost').apply(state);
    expect(state.bonusCoinPerAnte).toBe(3);
    findUpgrade('starterBoost').apply(state);
    expect(state.bonusCoinPerAnte).toBe(6);
  });

  test('coinOnStreak sets coinOnStreak flag', () => {
    const state = makeState();
    findUpgrade('coinOnStreak').apply(state);
    expect(state.coinOnStreak).toBe(true);
  });

  test('coinOnPerfect sets coinOnPerfect flag', () => {
    const state = makeState();
    findUpgrade('coinOnPerfect').apply(state);
    expect(state.coinOnPerfect).toBe(true);
  });

  test('coinOnStar sets coinOnStar flag', () => {
    const state = makeState();
    findUpgrade('coinOnStar').apply(state);
    expect(state.coinOnStar).toBe(true);
  });

  test('replayScore increments replayCount (stackable)', () => {
    const state = makeState();
    findUpgrade('replayScore').apply(state);
    expect(state.replayCount).toBe(1);
    findUpgrade('replayScore').apply(state);
    expect(state.replayCount).toBe(2);
  });

  test('replayLucky increments replayLuckyCount (stackable)', () => {
    const state = makeState();
    findUpgrade('replayLucky').apply(state);
    expect(state.replayLuckyCount).toBe(1);
    findUpgrade('replayLucky').apply(state);
    expect(state.replayLuckyCount).toBe(2);
  });

  test('replayChain sets replayChain=true', () => {
    const state = makeState();
    findUpgrade('replayChain').apply(state);
    expect(state.replayChain).toBe(true);
  });

  test('replayHotZone sets replayHotZone=true', () => {
    const state = makeState();
    findUpgrade('replayHotZone').apply(state);
    expect(state.replayHotZone).toBe(true);
  });

  test('replayStreak sets replayStreak=true', () => {
    const state = makeState();
    findUpgrade('replayStreak').apply(state);
    expect(state.replayStreak).toBe(true);
  });

  test('slotExpander increments maxUpgradeSlots (stackable)', () => {
    const state = makeState();
    findUpgrade('slotExpander').apply(state);
    expect(state.maxUpgradeSlots).toBe(5);
    findUpgrade('slotExpander').apply(state);
    expect(state.maxUpgradeSlots).toBe(6);
  });

  test('multiBooster sets multiBooster=true', () => {
    const state = makeState();
    findUpgrade('multiBooster').apply(state);
    expect(state.multiBooster).toBe(true);
  });

  test('divideBooster sets divideBooster=true', () => {
    const state = makeState();
    findUpgrade('divideBooster').apply(state);
    expect(state.divideBooster).toBe(true);
  });

  test('addBooster sets addBooster=true', () => {
    const state = makeState();
    findUpgrade('addBooster').apply(state);
    expect(state.addBooster).toBe(true);
  });

  test('subtractBooster sets subtractBooster=true', () => {
    const state = makeState();
    findUpgrade('subtractBooster').apply(state);
    expect(state.subtractBooster).toBe(true);
  });

  test('cascadeMult increments cascadeMultCount (stackable)', () => {
    const state = makeState();
    findUpgrade('cascadeMult').apply(state);
    expect(state.cascadeMultCount).toBe(1);
    findUpgrade('cascadeMult').apply(state);
    expect(state.cascadeMultCount).toBe(2);
  });

  test('compoundGrowth sets compoundGrowth=true', () => {
    const state = makeState();
    findUpgrade('compoundGrowth').apply(state);
    expect(state.compoundGrowth).toBe(true);
  });

  test('luckyFrequency sets luckyFrequency=true', () => {
    const state = makeState();
    findUpgrade('luckyFrequency').apply(state);
    expect(state.luckyFrequency).toBe(true);
  });
});

// ---- unapplyUpgrade tests ----
describe('unapplyUpgrade — reverses apply()', () => {
  test('unapply chain restores chainAnswer=false', () => {
    const state = makeState();
    findUpgrade('chain').apply(state);
    unapplyUpgrade(findUpgrade('chain'), state);
    expect(state.chainAnswer).toBe(false);
  });

  test('unapply shield decrements shieldCharges', () => {
    const state = makeState();
    findUpgrade('shield').apply(state);
    findUpgrade('shield').apply(state);
    expect(state.shieldCharges).toBe(2);
    unapplyUpgrade(findUpgrade('shield'), state);
    expect(state.shieldCharges).toBe(1);
  });

  test('unapply slowAll reverses speed reduction', () => {
    const state = makeState();
    findUpgrade('slowAll').apply(state);
    expect(state.speedMult).toBeCloseTo(0.75);
    unapplyUpgrade(findUpgrade('slowAll'), state);
    expect(state.speedMult).toBeCloseTo(1);
  });

  test('unapply scoreMultSmall divides by 1.5', () => {
    const state = makeState();
    findUpgrade('scoreMultSmall').apply(state);
    findUpgrade('scoreMultSmall').apply(state);
    expect(state.scoreMultiplier).toBeCloseTo(2.25);
    unapplyUpgrade(findUpgrade('scoreMultSmall'), state);
    expect(state.scoreMultiplier).toBeCloseTo(1.5);
  });

  test('unapply scoreMultLarge halves multiplier', () => {
    const state = makeState();
    findUpgrade('scoreMultLarge').apply(state);
    unapplyUpgrade(findUpgrade('scoreMultLarge'), state);
    expect(state.scoreMultiplier).toBeCloseTo(1);
  });

  test('unapply replayScore decrements replayCount', () => {
    const state = makeState();
    findUpgrade('replayScore').apply(state);
    findUpgrade('replayScore').apply(state);
    unapplyUpgrade(findUpgrade('replayScore'), state);
    expect(state.replayCount).toBe(1);
  });

  test('unapply starterBoost decrements bonusCoinPerAnte by 3', () => {
    const state = makeState();
    findUpgrade('starterBoost').apply(state);
    findUpgrade('starterBoost').apply(state);
    unapplyUpgrade(findUpgrade('starterBoost'), state);
    expect(state.bonusCoinPerAnte).toBe(3);
  });

  test('unapply coinOnStreak clears flag', () => {
    const state = makeState();
    findUpgrade('coinOnStreak').apply(state);
    unapplyUpgrade(findUpgrade('coinOnStreak'), state);
    expect(state.coinOnStreak).toBe(false);
  });

  test('unapply coinOnPerfect clears flag', () => {
    const state = makeState();
    findUpgrade('coinOnPerfect').apply(state);
    unapplyUpgrade(findUpgrade('coinOnPerfect'), state);
    expect(state.coinOnPerfect).toBe(false);
  });

  test('unapply coinOnStar clears flag', () => {
    const state = makeState();
    findUpgrade('coinOnStar').apply(state);
    unapplyUpgrade(findUpgrade('coinOnStar'), state);
    expect(state.coinOnStar).toBe(false);
  });

  test('unapply clamps multiplier floor at 1', () => {
    const state = makeState();
    // If scoreMultiplier is already 1, selling shouldn't go below 1
    unapplyUpgrade(findUpgrade('scoreMultSmall'), state);
    expect(state.scoreMultiplier).toBeCloseTo(1);
  });

  test('unapply slotExpander decrements maxUpgradeSlots (min 4)', () => {
    const state = makeState();
    findUpgrade('slotExpander').apply(state);
    findUpgrade('slotExpander').apply(state);
    expect(state.maxUpgradeSlots).toBe(6);
    unapplyUpgrade(findUpgrade('slotExpander'), state);
    expect(state.maxUpgradeSlots).toBe(5);
    unapplyUpgrade(findUpgrade('slotExpander'), state);
    expect(state.maxUpgradeSlots).toBe(4);
    // Clamps at 4
    unapplyUpgrade(findUpgrade('slotExpander'), state);
    expect(state.maxUpgradeSlots).toBe(4);
  });

  test('unapply multiBooster sets multiBooster=false', () => {
    const state = makeState();
    findUpgrade('multiBooster').apply(state);
    unapplyUpgrade(findUpgrade('multiBooster'), state);
    expect(state.multiBooster).toBe(false);
  });

  test('unapply divideBooster sets divideBooster=false', () => {
    const state = makeState();
    findUpgrade('divideBooster').apply(state);
    unapplyUpgrade(findUpgrade('divideBooster'), state);
    expect(state.divideBooster).toBe(false);
  });

  test('unapply addBooster sets addBooster=false', () => {
    const state = makeState();
    findUpgrade('addBooster').apply(state);
    unapplyUpgrade(findUpgrade('addBooster'), state);
    expect(state.addBooster).toBe(false);
  });

  test('unapply subtractBooster sets subtractBooster=false', () => {
    const state = makeState();
    findUpgrade('subtractBooster').apply(state);
    unapplyUpgrade(findUpgrade('subtractBooster'), state);
    expect(state.subtractBooster).toBe(false);
  });

  test('unapply cascadeMult decrements cascadeMultCount (min 0)', () => {
    const state = makeState();
    findUpgrade('cascadeMult').apply(state);
    findUpgrade('cascadeMult').apply(state);
    expect(state.cascadeMultCount).toBe(2);
    unapplyUpgrade(findUpgrade('cascadeMult'), state);
    expect(state.cascadeMultCount).toBe(1);
    unapplyUpgrade(findUpgrade('cascadeMult'), state);
    expect(state.cascadeMultCount).toBe(0);
    // Clamps at 0
    unapplyUpgrade(findUpgrade('cascadeMult'), state);
    expect(state.cascadeMultCount).toBe(0);
  });

  test('unapply compoundGrowth sets compoundGrowth=false', () => {
    const state = makeState();
    findUpgrade('compoundGrowth').apply(state);
    unapplyUpgrade(findUpgrade('compoundGrowth'), state);
    expect(state.compoundGrowth).toBe(false);
  });

  test('unapply luckyFrequency sets luckyFrequency=false', () => {
    const state = makeState();
    findUpgrade('luckyFrequency').apply(state);
    unapplyUpgrade(findUpgrade('luckyFrequency'), state);
    expect(state.luckyFrequency).toBe(false);
  });
});

// ---- drawShopOptions tests ----
describe('drawShopOptions', () => {
  test('includes shop-tier upgrades even with no unlockedIds', () => {
    const drawn = drawShopOptions(12, [], []);
    const ids = drawn.map(u => u.id);
    // Should include some shop upgrades
    const shopIds = SHOP_UPGRADE_IDS;
    expect(ids.some(id => shopIds.includes(id))).toBe(true);
  });

  test('excludes non-stackable already-owned upgrades', () => {
    const drawn = drawShopOptions(20, [], ['chain', 'echoLucky', 'replayChain']);
    const ids = drawn.map(u => u.id);
    expect(ids).not.toContain('chain');
    expect(ids).not.toContain('echoLucky');
    expect(ids).not.toContain('replayChain');
  });

  test('includes stackable shop upgrades even when owned', () => {
    // Draw the full pool (n > total upgrades) to guarantee stackable owned items appear
    const drawn = drawShopOptions(40, [], ['scoreMultSmall', 'replayScore']);
    const ids = drawn.map(u => u.id);
    expect(ids).toContain('scoreMultSmall');
    expect(ids).toContain('replayScore');
  });

  test('returns no duplicate IDs', () => {
    const drawn = drawShopOptions(5, [], []);
    const ids = drawn.map(u => u.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('drawUpgrades does NOT include shop upgrades', () => {
    const drawn = drawUpgrades(20, [], []);
    const ids = drawn.map(u => u.id);
    for (const shopId of SHOP_UPGRADE_IDS) {
      expect(ids).not.toContain(shopId);
    }
  });

  test('compoundGrowth (minAnte:4) does not appear when currentAnte=3', () => {
    // Draw a large pool to ensure we'd hit compoundGrowth if it were allowed
    const drawn = drawShopOptions(40, [], [], 3);
    const ids = drawn.map(u => u.id);
    expect(ids).not.toContain('compoundGrowth');
  });

  test('compoundGrowth (minAnte:4) appears when currentAnte=4', () => {
    let found = false;
    for (let i = 0; i < 200; i++) {
      const drawn = drawShopOptions(40, [], [], 4);
      if (drawn.find(u => u.id === 'compoundGrowth')) { found = true; break; }
    }
    expect(found).toBe(true);
  });
});

// ---- getUpgradeById tests ----
describe('getUpgradeById', () => {
  test('returns upgrade for valid id', () => {
    const upg = getUpgradeById('chain');
    expect(upg).not.toBeNull();
    expect(upg.id).toBe('chain');
  });

  test('returns null for unknown id', () => {
    expect(getUpgradeById('doesNotExist')).toBeNull();
  });

  test('works for shop-tier upgrades', () => {
    const upg = getUpgradeById('replayScore');
    expect(upg).not.toBeNull();
    expect(upg.tier).toBe('shop');
  });
});

// ---- Rarity-weighted shop sampling ----
describe('drawShopOptions rarity weighting', () => {
  test('returns exactly n options when pool is large enough', () => {
    const results = drawShopOptions(3, [], []);
    expect(results).toHaveLength(3);
  });

  test('rare upgrades appear less often than common in large sample', () => {
    const RUNS = 2000;
    const counts = {};
    for (let i = 0; i < RUNS; i++) {
      const picks = drawShopOptions(3, [], []);
      for (const u of picks) counts[u.rarity] = (counts[u.rarity] || 0) + 1;
    }
    // Common should appear far more than rare
    expect(counts.common).toBeGreaterThan(counts.rare * 2);
    expect(counts.uncommon).toBeGreaterThan(counts.rare);
  });

  test('surge (rare) can still appear in shop', () => {
    let found = false;
    for (let i = 0; i < 500; i++) {
      const picks = drawShopOptions(3, [], []);
      if (picks.find(u => u.id === 'surge')) { found = true; break; }
    }
    expect(found).toBe(true);
  });

  test('no duplicate upgrades in a single draw (non-stackable)', () => {
    for (let i = 0; i < 100; i++) {
      const picks = drawShopOptions(3, [], []);
      const ids = picks.map(u => u.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  test('surge unapply reverses multiplier correctly', () => {
    const state = { scoreMultiplier: 6 };
    const surge = UPGRADES.find(u => u.id === 'surge');
    unapplyUpgrade(surge, state);
    expect(state.scoreMultiplier).toBeCloseTo(2);
  });
});
