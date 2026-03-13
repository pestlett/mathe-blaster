// upgrades.js - Roguelike run-mode upgrade definitions

const UPGRADES = [
  {
    id: 'chain',
    icon: '⛓',
    tier: 'start',
    names: { space: 'Gravity Well', ocean: 'Riptide', sky: 'Lightning Strike' },
    desc: {
      space: 'Pull all objects with the same answer into the void.',
      ocean: 'Answers sweep matching objects off the board.',
      sky:   'Strike every object sharing your answer.',
    },
    apply(state) { state.chainAnswer = true; },
  },
  {
    id: 'streakBoost',
    icon: '✴',
    tier: 'start',
    names: { space: 'Solar Flare', ocean: 'Tidal Surge', sky: 'Jet Stream' },
    desc: {
      space: 'Streak multiplier blazes: 3+: ×2, 5+: ×3, 8+: ×4.',
      ocean: 'Riding the surge: streaks hit harder and faster.',
      sky:   'Jet stream carries your streak multipliers to new heights.',
    },
    apply(state) { state.streakBoost = true; },
  },
  {
    id: 'shield',
    icon: '🛡',
    tier: 'start',
    names: { space: 'Shield Array', ocean: 'Coral Armor', sky: 'Gust Guard' },
    desc: {
      space: 'An energy shield absorbs the next miss without losing a life.',
      ocean: 'Coral plating takes one hit — then it crumbles.',
      sky:   'A gust of wind deflects the next missed object.',
    },
    apply(state) { state.shieldCharges = (state.shieldCharges || 0) + 1; },
  },
  {
    id: 'slowAll',
    icon: '🌀',
    tier: 'start',
    names: { space: 'Warp Drag', ocean: 'Undertow', sky: 'Headwind' },
    desc: {
      space: 'Warp drag slows all objects to 75% speed for the run.',
      ocean: 'The undertow pulls objects back — they fall at 75% speed.',
      sky:   'A relentless headwind slows every falling problem.',
    },
    apply(state) { state.speedMult = (state.speedMult || 1) * 0.75; },
  },
  {
    id: 'bomb',
    icon: '💣',
    tier: 'start',
    names: { space: 'Nova Burst', ocean: 'Depth Charge', sky: 'Thunderbolt' },
    desc: {
      space: 'Charge a nova burst — press Space to destroy the lowest object.',
      ocean: 'Drop a depth charge on the closest threat. Press Space.',
      sky:   'Summon a thunderbolt — press Space to vaporise the lowest object.',
    },
    apply(state) { state.bombCharges = (state.bombCharges || 0) + 1; },
  },
  {
    id: 'hotZoneBoost',
    icon: '🔥',
    tier: 'start',
    names: { space: 'Event Horizon', ocean: 'Whirlpool', sky: 'Thermal Lift' },
    desc: {
      space: 'The event horizon swells — hot zone widens from 24% to 45%.',
      ocean: 'The whirlpool expands the reward band across the screen.',
      sky:   'Thermals widen the sweet spot for bonus points.',
    },
    apply(state) { state.hotZoneBoost = true; },
  },
  {
    id: 'luckyBonus',
    icon: '🍀',
    tier: 'start',
    names: { space: 'Nebula Luck', ocean: 'Treasure Drift', sky: 'Lucky Wind' },
    desc: {
      space: 'Every 5th correct answer triggers a random ×2–×5 nebula bonus.',
      ocean: 'Treasure drifts in: every 5th answer earns a random multiplier.',
      sky:   'A lucky wind carries every 5th answer to a ×2–×5 windfall.',
    },
    apply(state) { state.luckyBonus = true; state.luckyBonusCounter = 0; },
  },
  {
    id: 'quickBonus',
    icon: '⚡',
    tier: 'start',
    names: { space: 'Warp Strike', ocean: 'Flash Current', sky: 'Tailwind' },
    desc: {
      space: 'Answers within 1.5s earn +20 pts on top of the time bonus.',
      ocean: 'Flash current rewards lightning-fast answers with +20 pts.',
      sky:   'Tailwind pushes fast answers to earn +20 extra points.',
    },
    apply(state) { state.quickBonus = true; },
  },
  {
    id: 'commutative',
    icon: '🔁',
    tier: 'unlock',
    names: { space: 'Twin Stars', ocean: 'Echo Wave', sky: 'Harmonic' },
    desc: {
      space: 'Twin stars: answer 3×7 and 7×3 on screen is also destroyed.',
      ocean: 'Echo wave: your answer ripples and destroys its mirror fact.',
      sky:   'Harmonic: solving one fact resonates and clears its reverse.',
    },
    apply(state) { state.commutativePair = true; },
  },
  {
    id: 'streakSlow',
    icon: '❄',
    tier: 'unlock',
    names: { space: 'Dark Matter', ocean: 'Abyss Pull', sky: 'Storm Front' },
    desc: {
      space: 'Dark matter: objects slow to 60% for 5s on every streak of 5.',
      ocean: 'Abyss pull: a 5-streak drags all objects down to 60% speed.',
      sky:   'Storm front: 5-streaks summon 5s of slowed-down chaos.',
    },
    apply(state) { state.streakSlow = true; },
  },
  {
    id: 'reveal',
    icon: '👁',
    tier: 'unlock',
    names: { space: 'Pulsar', ocean: 'Sonar Ping', sky: 'Radar Sweep' },
    desc: {
      space: 'Pulsar reveals the answer on the lowest object for 1s when it enters the hot zone.',
      ocean: 'Sonar ping: hear it enter the zone and see its answer flash.',
      sky:   'Radar sweep reveals incoming answers as they enter the zone.',
    },
    apply(state) { state.revealOnHotZone = true; },
  },
  {
    id: 'lastChance',
    icon: '💫',
    tier: 'unlock',
    names: { space: 'Supernova', ocean: 'Tsunami', sky: 'Cyclone' },
    desc: {
      space: 'Once per run: supernova destroys all objects on your 4th miss.',
      ocean: 'Once per run: a tsunami wipes the board when you hit 4 misses.',
      sky:   'Once per run: a cyclone clears everything on your 4th miss.',
    },
    apply(state) { state.lastChanceAvailable = true; },
  },
];

// Starting pool (upgrades 1–8)
const STARTING_UPGRADE_IDS = ['chain','streakBoost','shield','slowAll','bomb','hotZoneBoost','luckyBonus','quickBonus'];
// Unlockable upgrades
const UNLOCK_UPGRADE_IDS   = ['commutative','streakSlow','reveal','lastChance'];

// ---- Synergies & conflicts ----
// Each entry describes a pair interaction. Both IDs must be active for the
// effect to apply. Positive synergies amplify; negative ones diminish.
const SYNERGIES = [
  {
    ids:    ['chain', 'luckyBonus'],
    type:   'positive',
    effect: 'Chain kills also count toward the lucky bonus counter.',
  },
  {
    ids:    ['streakBoost', 'quickBonus'],
    type:   'positive',
    effect: 'Fast answers on a streak earn +30 pts instead of +20.',
  },
  {
    ids:    ['hotZoneBoost', 'reveal'],
    type:   'positive',
    effect: 'Answering a revealed object in the hot zone earns ×2 instead of ×1.5.',
  },
  {
    ids:    ['slowAll', 'quickBonus'],
    type:   'negative',
    effect: 'Slow fall breeds complacency — quick-answer window halves to 0.75s.',
  },
  {
    ids:    ['streakSlow', 'slowAll'],
    type:   'negative',
    effect: 'Already dragging — streak-slow effect shrinks from 5s to 2s.',
  },
];

// Returns synergy hints for one upgrade against the currently active set.
// Used by the picker to warn or entice the player before choosing.
// Returns: Array<{ type: 'positive'|'negative', partnerName: string, effect: string }>
function getSynergyHintsForUpgrade(upgradeId, activeIds, theme) {
  return SYNERGIES
    .filter(s =>
      s.ids.includes(upgradeId) &&
      s.ids.some(id => id !== upgradeId && activeIds.includes(id))
    )
    .map(s => {
      const partnerId   = s.ids.find(id => id !== upgradeId);
      const partnerUpg  = UPGRADES.find(u => u.id === partnerId);
      const partnerName = partnerUpg ? upgradeNameForTheme(partnerUpg, theme) : partnerId;
      return { type: s.type, partnerName, effect: s.effect };
    });
}

// Returns sets of upgrade IDs that are part of a live synergy/conflict pair.
// Used by the bar renderer to colour the pills.
function getActiveSynergySets(activeIds) {
  const positive = new Set();
  const negative = new Set();
  for (const s of SYNERGIES) {
    if (s.ids.every(id => activeIds.includes(id))) {
      const target = s.type === 'positive' ? positive : negative;
      s.ids.forEach(id => target.add(id));
    }
  }
  return { positive, negative };
}

// Returns the active name for an upgrade given the current theme
function upgradeNameForTheme(upgrade, theme) {
  return upgrade.names[theme] || upgrade.names.space;
}

// Returns the active description for an upgrade given the current theme
function upgradeDescForTheme(upgrade, theme) {
  return upgrade.desc[theme] || upgrade.desc.space;
}

// Draw N unique upgrades from the available pool (respects already-active IDs)
function drawUpgrades(n, unlockedIds, activeIds) {
  const pool = UPGRADES.filter(u => {
    if (activeIds.includes(u.id)) return false; // already have it
    if (u.tier === 'start') return true;
    return unlockedIds.includes(u.id);
  });
  // Shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}

if (typeof module !== 'undefined') {
  module.exports = {
    UPGRADES, SYNERGIES,
    STARTING_UPGRADE_IDS, UNLOCK_UPGRADE_IDS,
    upgradeNameForTheme, upgradeDescForTheme,
    drawUpgrades, getSynergyHintsForUpgrade, getActiveSynergySets,
  };
}
