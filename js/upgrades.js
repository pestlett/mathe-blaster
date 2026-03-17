// upgrades.js - Roguelike run-mode upgrade definitions

// Rarity weights for shop pool sampling.
// Higher weight = appears more often.
const RARITY_WEIGHTS = { common: 6, uncommon: 3, rare: 1 };

const UPGRADES = [
  // ---- Starting upgrades (tier: start) ----
  {
    id: 'chain',
    icon: '⛓',
    tier: 'start', rarity: 'common',
    operations: ['all'],
    price: 10, sellValue: 5,
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
    tier: 'start', rarity: 'common',
    operations: ['all'],
    price: 10, sellValue: 5,
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
    tier: 'start', rarity: 'common',
    shopKind: 'action',
    stackable: true, maxStacks: 4,
    operations: ['all'],
    price: 7, sellValue: 3,
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
    tier: 'start', rarity: 'common',
    stackable: true, maxStacks: 3,
    operations: ['all'],
    price: 9, sellValue: 4,
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
    tier: 'start', rarity: 'common',
    shopKind: 'action',
    stackable: true, maxStacks: 4,
    operations: ['all'],
    price: 7, sellValue: 3,
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
    tier: 'start', rarity: 'common',
    operations: ['all'],
    price: 10, sellValue: 5,
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
    tier: 'start', rarity: 'common',
    operations: ['all'],
    price: 12, sellValue: 6,
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
    tier: 'start', rarity: 'common',
    operations: ['all'],
    price: 9, sellValue: 4,
    names: { space: 'Warp Strike', ocean: 'Flash Current', sky: 'Tailwind' },
    desc: {
      space: 'Answers within 1.5s earn +20 pts on top of the time bonus.',
      ocean: 'Flash current rewards lightning-fast answers with +20 pts.',
      sky:   'Tailwind pushes fast answers to earn +20 extra points.',
    },
    apply(state) { state.quickBonus = true; },
  },
  // ---- Unlockable upgrades (tier: unlock) ----
  {
    id: 'commutative',
    icon: '🔁',
    tier: 'unlock', rarity: 'uncommon',
    operations: ['multiply', 'divide'],
    price: 14, sellValue: 7,
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
    tier: 'unlock', rarity: 'uncommon',
    operations: ['all'],
    price: 12, sellValue: 6,
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
    tier: 'unlock', rarity: 'uncommon',
    operations: ['all'],
    price: 12, sellValue: 6,
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
    tier: 'unlock', rarity: 'uncommon',
    operations: ['all'],
    price: 16, sellValue: 8,
    names: { space: 'Supernova', ocean: 'Tsunami', sky: 'Cyclone' },
    desc: {
      space: 'Once per run: supernova destroys all objects on your 4th miss.',
      ocean: 'Once per run: a tsunami wipes the board when you hit 4 misses.',
      sky:   'Once per run: a cyclone clears everything on your 4th miss.',
    },
    apply(state) { state.lastChanceAvailable = true; },
  },

  // ---- Shop upgrades (tier: shop) — always available in the shop ----

  // Multipliers
  {
    id: 'scoreMultSmall',
    icon: '✨',
    tier: 'shop', rarity: 'uncommon',
    stackable: true, maxStacks: 3,
    operations: ['all'],
    price: 22, sellValue: 11,
    names: { space: 'Nebula Lens', ocean: 'Depth Amplifier', sky: 'Sky Lens' },
    desc: {
      space: 'All score ×1.5 for this run. Stacks multiplicatively.',
      ocean: 'Depth amplifier: all score multiplied by ×1.5.',
      sky:   'Sky lens focuses your score — all points ×1.5.',
    },
    apply(state) { state.scoreMultiplier = (state.scoreMultiplier || 1) * 1.5; },
  },
  {
    id: 'scoreMultLarge',
    icon: '🌟',
    tier: 'shop', rarity: 'rare',
    stackable: true, maxStacks: 2,
    operations: ['all'],
    price: 38, sellValue: 19,
    names: { space: 'Supernova Core', ocean: 'Maelstrom', sky: 'Cyclone Heart' },
    desc: {
      space: 'Double all score for this run. Stack for exponential growth.',
      ocean: 'The maelstrom doubles every point you earn.',
      sky:   'Cyclone heart: all score doubled for this run.',
    },
    apply(state) { state.scoreMultiplier = (state.scoreMultiplier || 1) * 2; },
  },
  {
    id: 'scoreMultPerfect',
    icon: '🎯',
    tier: 'shop', rarity: 'uncommon',
    operations: ['all'],
    price: 28, sellValue: 14,
    names: { space: 'Precision Core', ocean: "Bull's Eye", sky: 'Pinpoint' },
    desc: {
      space: 'Each hot-zone answer ramps all future score ×1.2 (cap ×8).',
      ocean: "Bull's eye: hot-zone hits build your score multiplier ×1.2.",
      sky:   'Pinpoint accuracy: hot-zone answers stack your score multiplier.',
    },
    apply(state) { state.perfectMultEnabled = true; },
  },

  // Echoes
  {
    id: 'echoLucky',
    icon: '🔮',
    tier: 'shop', rarity: 'common',
    operations: ['all'],
    price: 25, sellValue: 12,
    names: { space: 'Nebula Echo', ocean: 'Double Drift', sky: 'Twin Gust' },
    desc: {
      space: 'Lucky Bonus fires twice — the echo rolls ×2–×3.',
      ocean: 'Lucky drift echoes: a second bonus hits immediately after.',
      sky:   'Twin gust: Lucky Bonus carries twice on every trigger.',
    },
    apply(state) { state.echoLucky = true; },
  },
  {
    id: 'echoChain',
    icon: '🔗',
    tier: 'shop', rarity: 'common',
    operations: ['multiply', 'divide'],
    price: 22, sellValue: 11,
    names: { space: 'Chain Echo', ocean: 'Wave Echo', sky: 'Lightning Echo' },
    desc: {
      space: "Each chain kill also destroys the mirror fact if it's on screen.",
      ocean: 'Wave echo: chain kills ripple to destroy commutative mirrors.',
      sky:   'Lightning echo: chain kills arc to matching reversed facts.',
    },
    apply(state) { state.echoChain = true; },
  },
  {
    id: 'echoStreak',
    icon: '💠',
    tier: 'shop', rarity: 'common',
    operations: ['all'],
    price: 20, sellValue: 10,
    names: { space: 'Streak Echo', ocean: 'Surge Echo', sky: 'Jet Echo' },
    desc: {
      space: 'Hot-zone streak bonus echoes — streak multiplier applied a second time.',
      ocean: 'Surge echo: hot-zone answers carry their streak bonus twice.',
      sky:   'Jet echo: streak power resonates through every hot-zone answer.',
    },
    apply(state) { state.echoStreak = true; },
  },

  // Economy
  {
    id: 'starterBoost',
    icon: '💰',
    tier: 'shop', rarity: 'common',
    stackable: true, maxStacks: 3,
    operations: ['all'],
    price: 15, sellValue: 7,
    names: { space: 'Star Mine', ocean: 'Treasure Reef', sky: 'Wind Farm' },
    desc: {
      space: 'Gain +3 bonus coins at the start of each shop. Stack to compound.',
      ocean: 'Treasure reef generates +3 coins before every shop visit.',
      sky:   'Wind farm: +3 bonus coins at every ante checkpoint.',
    },
    apply(state) { state.bonusCoinPerAnte = (state.bonusCoinPerAnte || 0) + 3; },
  },
  {
    id: 'coinOnStreak',
    icon: '🔗',
    tier: 'shop', rarity: 'uncommon',
    operations: ['all'],
    price: 18, sellValue: 9,
    names: { space: 'Streak Treasury', ocean: 'Tidal Vault', sky: 'Wind Coffers' },
    desc: {
      space: 'Each streak milestone earns +1 bonus coin on top of the streak reward.',
      ocean: 'Tidal vault: every streak checkpoint washes in an extra coin.',
      sky:   'Wind coffers: streak milestones carry +1 coin on the breeze.',
    },
    apply(state) { state.coinOnStreak = true; },
  },
  {
    id: 'coinOnPerfect',
    icon: '🎯',
    tier: 'shop', rarity: 'uncommon',
    operations: ['all'],
    price: 20, sellValue: 10,
    names: { space: 'Precision Vault', ocean: 'Pearl Diver', sky: 'Sky Mint' },
    desc: {
      space: 'Hot-zone answers earn +1 extra coin — double the precision reward.',
      ocean: 'Pearl diver: every hot-zone hit surfaces an extra coin.',
      sky:   'Sky mint: land in the hot zone and pocket an extra coin.',
    },
    apply(state) { state.coinOnPerfect = true; },
  },
  {
    id: 'coinOnStar',
    icon: '⭐',
    tier: 'shop', rarity: 'rare',
    operations: ['all'],
    price: 30, sellValue: 15,
    names: { space: 'Star Bank', ocean: 'Reef Treasury', sky: 'Cloud Chest' },
    desc: {
      space: 'Star ratings pay double: 2★ → +2 coins, 3★ → +4 coins.',
      ocean: 'Reef treasury: stars shine brighter — double coin rewards per rating.',
      sky:   'Cloud chest: star ratings fill the chest with double coins.',
    },
    apply(state) { state.coinOnStar = true; },
  },

  // Replays
  {
    id: 'replayScore',
    icon: '🔄',
    tier: 'shop', rarity: 'uncommon',
    stackable: true, maxStacks: 3,
    operations: ['all'],
    price: 32, sellValue: 16,
    names: { space: 'Answer Echo', ocean: 'Tidal Repeat', sky: 'Gust Replay' },
    desc: {
      space: 'After scoring, replay the full answer score once more. Stacks.',
      ocean: 'Tidal repeat: each correct answer washes in twice.',
      sky:   'Gust replay: your answer score echoes back for extra points.',
    },
    apply(state) { state.replayCount = (state.replayCount || 0) + 1; },
  },
  {
    id: 'replayLucky',
    icon: '🎲',
    tier: 'shop', rarity: 'uncommon',
    stackable: true, maxStacks: 3,
    operations: ['all'],
    price: 25, sellValue: 12,
    names: { space: 'Fortune Cycle', ocean: 'Lucky Current', sky: 'Windfall Loop' },
    desc: {
      space: 'Lucky Bonus fires one extra time when triggered. Stacks.',
      ocean: 'Lucky current: each Lucky Bonus surges an extra time.',
      sky:   'Windfall loop: every Lucky trigger echoes one more roll.',
    },
    apply(state) { state.replayLuckyCount = (state.replayLuckyCount || 0) + 1; },
  },
  {
    id: 'replayChain',
    icon: '💥',
    tier: 'shop', rarity: 'uncommon',
    operations: ['multiply', 'divide'],
    price: 20, sellValue: 10,
    names: { space: 'Chain Resonance', ocean: 'Splash Repeat', sky: 'Thunder Repeat' },
    desc: {
      space: 'After chain kills, the chain scoring fires a second time.',
      ocean: 'Splash repeat: chain kills pay out their bonus twice.',
      sky:   'Thunder repeat: chain scoring rolls twice for double payoff.',
    },
    apply(state) { state.replayChain = true; },
  },
  {
    id: 'replayHotZone',
    icon: '⭕',
    tier: 'shop', rarity: 'uncommon',
    operations: ['all'],
    price: 22, sellValue: 11,
    names: { space: 'Zone Loop', ocean: 'Depth Repeat', sky: 'Thermal Repeat' },
    desc: {
      space: 'Hot-zone answers apply the hot-zone multiplier a second time.',
      ocean: 'Depth repeat: hot-zone scoring splashes back for a second hit.',
      sky:   'Thermal repeat: hot-zone bonus lifts your score twice.',
    },
    apply(state) { state.replayHotZone = true; },
  },
  {
    id: 'replayStreak',
    icon: '🚀',
    tier: 'shop', rarity: 'uncommon',
    operations: ['all'],
    price: 18, sellValue: 9,
    names: { space: 'Streak Surge', ocean: 'Wave Surge', sky: 'Sky Surge' },
    desc: {
      space: 'When you cross a streak threshold (3/5/8), the answer scores again.',
      ocean: 'Wave surge: hitting a streak milestone doubles the current answer.',
      sky:   'Sky surge: streak thresholds launch a repeat of your last answer.',
    },
    apply(state) { state.replayStreak = true; },
  },

  // ---- New shop upgrades ----

  // Slot Expander
  {
    id: 'slotExpander',
    icon: '🗂',
    tier: 'shop', rarity: 'uncommon',
    stackable: true, maxStacks: 4, noSlot: true,
    operations: ['all'],
    price: 25, sellValue: 12,
    names: { space: 'Expansion Bay', ocean: 'Reef Chamber', sky: 'Hangar Bay' },
    desc: {
      space: 'Add 1 extra upgrade slot — hold up to 5, 6, 7... upgrades.',
      ocean: 'Reef chamber grows — carry one more upgrade into battle.',
      sky:   'Hangar bay expands — fit one more power into your loadout.',
    },
    apply(state) { state.maxUpgradeSlots = (state.maxUpgradeSlots || 4) + 1; },
  },
  // Operation-specific boosters
  {
    id: 'multiBooster',
    icon: '✖',
    tier: 'shop', rarity: 'common',
    operations: ['multiply'],
    price: 18, sellValue: 9,
    names: { space: 'Factor Amplifier', ocean: 'Multiplier Coral', sky: 'Times Thermal' },
    desc: {
      space: '× questions score ×2. Only fires on multiplication answers.',
      ocean: 'Multiplier coral doubles every times-table score.',
      sky:   'Times thermal: multiplication answers worth double.',
    },
    apply(state) { state.multiBooster = true; },
  },
  {
    id: 'divideBooster',
    icon: '➗',
    tier: 'shop', rarity: 'common',
    operations: ['divide'],
    price: 18, sellValue: 9,
    names: { space: 'Division Drive', ocean: 'Split Current', sky: 'Division Downdraft' },
    desc: {
      space: '÷ questions score ×2. Only fires on division answers.',
      ocean: 'Split current: division answers flow in twice as strong.',
      sky:   'Division downdraft doubles every division score.',
    },
    apply(state) { state.divideBooster = true; },
  },
  {
    id: 'addBooster',
    icon: '➕',
    tier: 'shop', rarity: 'common',
    operations: ['add'],
    price: 14, sellValue: 7,
    names: { space: 'Summation Core', ocean: 'Positive Current', sky: 'Updraft Adder' },
    desc: {
      space: '+ questions score ×2. Only fires on addition answers.',
      ocean: 'Positive current doubles every addition score.',
      sky:   'Updraft adder: addition answers soar twice as high.',
    },
    apply(state) { state.addBooster = true; },
  },
  {
    id: 'subtractBooster',
    icon: '➖',
    tier: 'shop', rarity: 'common',
    operations: ['subtract'],
    price: 14, sellValue: 7,
    names: { space: 'Negation Field', ocean: 'Counter-current', sky: 'Downdraft Deduct' },
    desc: {
      space: '− questions score ×2. Only fires on subtraction answers.',
      ocean: 'Counter-current doubles every subtraction score.',
      sky:   'Downdraft deduct: subtraction answers hit twice as hard.',
    },
    apply(state) { state.subtractBooster = true; },
  },
  // Exponential mechanics
  {
    id: 'cascadeMult',
    icon: '📈',
    tier: 'shop', rarity: 'uncommon',
    stackable: true, maxStacks: 3,
    operations: ['all'],
    price: 30, sellValue: 15,
    names: { space: 'Cascade Lens', ocean: 'Cascade Reef', sky: 'Cascade Spiral' },
    desc: {
      space: 'Each Lucky Bonus permanently raises your score multiplier ×0.3. Stacks.',
      ocean: 'Cascade reef: every lucky win ripples into a permanent ×0.3 score boost.',
      sky:   'Cascade spiral: lucky bonuses compound — +×0.3 to score mult each time.',
    },
    apply(state) { state.cascadeMultCount = (state.cascadeMultCount || 0) + 1; },
  },
  {
    id: 'compoundGrowth',
    icon: '🌱',
    tier: 'shop', rarity: 'rare',
    operations: ['all'],
    price: 35, sellValue: 17,
    names: { space: 'Compound Engine', ocean: 'Growth Reef', sky: 'Compound Thermals' },
    desc: {
      space: 'Score multiplier grows ×1.02 after each correct answer — compounds to millions.',
      ocean: 'Growth reef: every correct answer nudges your multiplier up ×1.02.',
      sky:   'Compound thermals: each answer adds ×1.02 to your score multiplier.',
    },
    apply(state) { state.compoundGrowth = true; },
  },
  {
    id: 'luckyFrequency',
    icon: '🎰',
    tier: 'shop', rarity: 'uncommon',
    operations: ['all'],
    price: 26, sellValue: 13,
    names: { space: 'Lucky Pulsar', ocean: 'Fortune Tide', sky: 'Lucky Draft' },
    desc: {
      space: 'Lucky Bonus fires every 3 answers instead of every 5.',
      ocean: 'Fortune tide surges — lucky hits every 3rd correct answer.',
      sky:   'Lucky draft whirls faster — trigger every 3 instead of 5.',
    },
    apply(state) { state.luckyFrequency = true; },
  },

  // ---- Rare burst upgrade ----
  {
    id: 'surge',
    icon: '💎',
    tier: 'shop', rarity: 'rare',
    operations: ['all'],
    price: 50, sellValue: 25,
    names: { space: 'Critical Mass', ocean: 'Pressure Wave', sky: 'Thunderhead' },
    desc: {
      space: 'Critical mass reached — instantly multiplies your entire score multiplier by ×3.',
      ocean: 'A pressure wave surges through — one massive ×3 burst to your score multiplier.',
      sky:   'Thunderhead breaks — a one-time ×3 surge to your score multiplier right now.',
    },
    apply(state) { state.scoreMultiplier = (state.scoreMultiplier || 1) * 3; },
  },
];

// Starting pool (upgrades 1–8)
const STARTING_UPGRADE_IDS = ['chain','streakBoost','shield','slowAll','bomb','hotZoneBoost','luckyBonus','quickBonus'];
// Unlockable upgrades
const UNLOCK_UPGRADE_IDS   = ['commutative','streakSlow','reveal','lastChance'];
// Shop-tier upgrades (always available in shop regardless of milestones)
const SHOP_UPGRADE_IDS = [
  'scoreMultSmall','scoreMultLarge','scoreMultPerfect',
  'echoLucky','echoChain','echoStreak','starterBoost','coinOnStreak','coinOnPerfect','coinOnStar',
  'replayScore','replayLucky','replayChain','replayHotZone','replayStreak',
  'slotExpander','multiBooster','divideBooster','addBooster','subtractBooster',
  'cascadeMult','compoundGrowth','luckyFrequency','surge',
];

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
  // New synergies for shop upgrades
  {
    ids:    ['echoLucky', 'luckyBonus'],
    type:   'positive',
    effect: 'Echo lucky roll gets the full ×2–×5 range instead of capped ×3.',
  },
  {
    ids:    ['echoChain', 'chain'],
    type:   'positive',
    effect: 'Echo chain kills also award 50% pts — same as normal chain kills.',
  },
  {
    ids:    ['echoStreak', 'streakBoost'],
    type:   'positive',
    effect: 'Echo streak bonus uses the boosted multiplier values.',
  },
  {
    ids:    ['scoreMultLarge', 'scoreMultSmall'],
    type:   'positive',
    effect: 'Stacked multipliers: +10 flat pts per answer on top of the multiplicative bonus.',
  },
  {
    ids:    ['scoreMultPerfect', 'hotZoneBoost'],
    type:   'positive',
    effect: 'Perfect multiplier cap raised from ×8 to ×12 when hot zone is widened.',
  },
  {
    ids:    ['echoLucky', 'chain'],
    type:   'negative',
    effect: 'Echo lucky cannot fire on chain-triggered lucky events.',
  },
  {
    ids:    ['replayLucky', 'echoLucky'],
    type:   'positive',
    effect: 'Echo fires on each replay lucky roll too — not just the original.',
  },
  {
    ids:    ['replayChain', 'chain'],
    type:   'positive',
    effect: 'Replay chain kills also advance the lucky counter.',
  },
  // New synergies for new upgrades
  {
    ids: ['multiBooster', 'scoreMultSmall'],
    type: 'positive',
    effect: 'Multiplication questions get ×1.5 extra on top of the ×2 booster.',
  },
  {
    ids: ['cascadeMult', 'luckyBonus'],
    type: 'positive',
    effect: 'Lucky cascade stacks twice as fast — each lucky adds ×0.6 instead of ×0.3.',
  },
  {
    ids: ['compoundGrowth', 'scoreMultPerfect'],
    type: 'positive',
    effect: 'Compound growth rate doubles — ×1.04 per answer instead of ×1.02.',
  },
  {
    ids: ['luckyFrequency', 'replayLucky'],
    type: 'positive',
    effect: 'Frequent lucky rolls cascade into replays — more replay opportunities.',
  },
  {
    ids: ['addBooster', 'subtractBooster'],
    type: 'positive',
    effect: 'Arithmetic mastery: +10 flat pts on every add/subtract answer.',
  },
];

// ---- Adjacency bonuses ----
// Extra effects that only activate when two specific upgrades are NEIGHBOURS
// in the bar. Reordering upgrades between rounds can unlock these.
const ADJACENCY = [
  {
    ids:    ['chain', 'luckyBonus'],
    flag:   'adj_chainLucky',
    effect: 'Chain kills feed 2 lucky ticks instead of 1.',
  },
  {
    ids:    ['streakBoost', 'quickBonus'],
    flag:   'adj_streakQuick',
    effect: 'Slow All conflict suppressed — quick window stays 1.5s.',
  },
  {
    ids:    ['shield', 'bomb'],
    flag:   'adj_shieldBomb',
    effect: 'Each shield absorb refunds 1 bomb charge.',
  },
  {
    ids:    ['hotZoneBoost', 'reveal'],
    flag:   'adj_hotReveal',
    effect: 'Precision Lock multiplier rises to ×2.5.',
  },
  {
    ids:    ['streakSlow', 'slowAll'],
    flag:   'adj_slowSlow',
    effect: 'Conflict partially offset — streak-slow lasts 3s instead of 2s.',
  },
  // New adjacency bonuses for shop upgrades
  {
    ids:    ['echoLucky', 'luckyBonus'],
    flag:   'adj_echoLucky',
    effect: 'Echo lucky roll is uncapped (×2–×5) and fires right after the main popup.',
  },
  {
    ids:    ['scoreMultSmall', 'scoreMultLarge'],
    flag:   'adj_multStack',
    effect: '+1 bonus coin per ante when both multipliers are adjacent.',
  },
  {
    ids:    ['echoChain', 'chain'],
    flag:   'adj_echoChain',
    effect: 'Echo chain mirror kill also counts as a full lucky tick.',
  },
  {
    ids:    ['echoStreak', 'quickBonus'],
    flag:   'adj_echoQuick',
    effect: 'Echo streak fires on any quick-bonus answer too, not only hot-zone.',
  },
  // New adjacency bonuses for new upgrades
  {
    ids: ['cascadeMult', 'luckyBonus'],
    flag: 'adj_cascadeLucky',
    effect: 'Adjacent cascade+lucky: every 3rd lucky also grants +1 bonus coin.',
  },
  {
    ids: ['compoundGrowth', 'replayScore'],
    flag: 'adj_compoundReplay',
    effect: 'Each replay also adds ×1.01 to the compound growth rate.',
  },
  {
    ids: ['multiBooster', 'divideBooster'],
    flag: 'adj_opMasters',
    effect: 'Operation Masters: × and ÷ answers also fire a lucky tick.',
  },
];

// Returns a Set of adjacency flag strings that are currently active
// based on which pairs are neighbours in the upgrades array.
function getAdjacencyBonuses(upgrades) {
  const active = new Set();
  for (let i = 0; i < upgrades.length - 1; i++) {
    const a = upgrades[i].id;
    const b = upgrades[i + 1].id;
    for (const adj of ADJACENCY) {
      if ((adj.ids[0] === a && adj.ids[1] === b) ||
          (adj.ids[0] === b && adj.ids[1] === a)) {
        active.add(adj.flag);
      }
    }
  }
  return active;
}

// Returns the ADJACENCY entry (or null) for a specific adjacent pair.
function getAdjacencyForPair(idA, idB) {
  return ADJACENCY.find(adj =>
    (adj.ids[0] === idA && adj.ids[1] === idB) ||
    (adj.ids[0] === idB && adj.ids[1] === idA)
  ) || null;
}

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

// Returns an upgrade object by ID (or null).
function getUpgradeById(id) {
  return UPGRADES.find(u => u.id === id) || null;
}

// Draw N upgrades from the available pool (start + unlock tiers only).
// Stackable upgrades can appear even if already owned; non-stackable are excluded once picked.
function drawUpgrades(n, unlockedIds, activeIds) {
  const pool = UPGRADES.filter(u => {
    if (u.tier === 'shop') return false;         // shop tier not in the free picker
    if (!u.stackable && activeIds.includes(u.id)) return false;
    if (u.tier === 'start') return true;
    return unlockedIds.includes(u.id);
  });
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}

// Draw N upgrades for the shop using rarity-weighted sampling without replacement.
// Rare upgrades appear ~6× less often than common ones (weights: common=6, uncommon=3, rare=1).
function drawShopOptions(n, unlockedIds, activeIds) {
  const pool = UPGRADES.filter(u => {
    if (!u.stackable && activeIds.includes(u.id)) return false;
    if (u.tier === 'shop') return true;
    if (u.tier === 'start') return true;
    return unlockedIds.includes(u.id);
  });
  const results = [];
  const remaining = [...pool];
  while (results.length < n && remaining.length > 0) {
    const totalWeight = remaining.reduce((sum, u) => sum + (RARITY_WEIGHTS[u.rarity] || RARITY_WEIGHTS.common), 0);
    let rand = Math.random() * totalWeight;
    let chosenIdx = remaining.length - 1;
    for (let i = 0; i < remaining.length; i++) {
      rand -= (RARITY_WEIGHTS[remaining[i].rarity] || RARITY_WEIGHTS.common);
      if (rand <= 0) { chosenIdx = i; break; }
    }
    results.push(remaining[chosenIdx]);
    remaining.splice(chosenIdx, 1);
  }
  return results;
}

// Reverses the effect of an upgrade's apply() for the sell mechanic.
function unapplyUpgrade(upgrade, state) {
  switch (upgrade.id) {
    case 'chain':            state.chainAnswer = false; break;
    case 'streakBoost':      state.streakBoost = false; break;
    case 'shield':           state.shieldCharges = Math.max(0, (state.shieldCharges || 0) - 1); break;
    case 'slowAll':          state.speedMult = Math.min(1, (state.speedMult || 1) / 0.75); break;
    case 'bomb':             state.bombCharges = Math.max(0, (state.bombCharges || 0) - 1); break;
    case 'hotZoneBoost':     state.hotZoneBoost = false; break;
    case 'luckyBonus':       state.luckyBonus = false; break;
    case 'quickBonus':       state.quickBonus = false; break;
    case 'commutative':      state.commutativePair = false; break;
    case 'streakSlow':       state.streakSlow = false; break;
    case 'reveal':           state.revealOnHotZone = false; break;
    case 'lastChance':       state.lastChanceAvailable = false; break;
    case 'scoreMultSmall':   state.scoreMultiplier = Math.max(1, (state.scoreMultiplier || 1) / 1.5); break;
    case 'scoreMultLarge':   state.scoreMultiplier = Math.max(1, (state.scoreMultiplier || 1) / 2); break;
    case 'scoreMultPerfect': state.perfectMultEnabled = false; break;
    case 'echoLucky':        state.echoLucky = false; break;
    case 'echoChain':        state.echoChain = false; break;
    case 'echoStreak':       state.echoStreak = false; break;
    case 'starterBoost':     state.bonusCoinPerAnte = Math.max(0, (state.bonusCoinPerAnte || 0) - 3); break;
    case 'coinOnStreak':     state.coinOnStreak = false; break;
    case 'coinOnPerfect':    state.coinOnPerfect = false; break;
    case 'coinOnStar':       state.coinOnStar = false; break;
    case 'replayScore':      state.replayCount = Math.max(0, (state.replayCount || 0) - 1); break;
    case 'replayLucky':      state.replayLuckyCount = Math.max(0, (state.replayLuckyCount || 0) - 1); break;
    case 'replayChain':      state.replayChain = false; break;
    case 'replayHotZone':    state.replayHotZone = false; break;
    case 'replayStreak':     state.replayStreak = false; break;
    case 'slotExpander':     state.maxUpgradeSlots = Math.max(4, (state.maxUpgradeSlots || 4) - 1); break;
    case 'multiBooster':     state.multiBooster = false; break;
    case 'divideBooster':    state.divideBooster = false; break;
    case 'addBooster':       state.addBooster = false; break;
    case 'subtractBooster':  state.subtractBooster = false; break;
    case 'cascadeMult':      state.cascadeMultCount = Math.max(0, (state.cascadeMultCount || 0) - 1); break;
    case 'compoundGrowth':   state.compoundGrowth = false; break;
    case 'luckyFrequency':   state.luckyFrequency = false; break;
    case 'surge':            state.scoreMultiplier = Math.max(1, (state.scoreMultiplier || 1) / 3); break;
  }
}

if (typeof module !== 'undefined') {
  module.exports = {
    UPGRADES, SYNERGIES, ADJACENCY,
    STARTING_UPGRADE_IDS, UNLOCK_UPGRADE_IDS, SHOP_UPGRADE_IDS,
    upgradeNameForTheme, upgradeDescForTheme,
    drawUpgrades, drawShopOptions, getUpgradeById, unapplyUpgrade,
    getSynergyHintsForUpgrade, getActiveSynergySets,
    getAdjacencyBonuses, getAdjacencyForPair,
  };
}
