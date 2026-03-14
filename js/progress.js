// progress.js - localStorage persistence: per-question stats + sessions

const Progress = (() => {
  const STORAGE_KEY_LEGACY = 'multiblaster_v1';
  let currentKey = STORAGE_KEY_LEGACY;

  // Normalise name+age into a safe storage slug
  function playerSlug(name, age) {
    const n = (name || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    const a = parseInt(age) || 0;
    return (n || 'guest') + (a > 0 ? `_${a}` : '');
  }

  // Call this whenever we know the active player name + age.
  // Migrates legacy single-user data to the per-player key on first encounter.
  function setPlayer(name, age) {
    const newKey = `multiblaster_v1_${playerSlug(name, age)}`;
    if (newKey === currentKey) return;
    try {
      const existing = JSON.parse(localStorage.getItem(newKey));
      const isEmpty = !existing || (
        !existing.sessions?.length &&
        !existing.stats &&
        !Object.keys(existing.lifetime || {}).length
      );
      if (isEmpty) {
        const legacy = localStorage.getItem(STORAGE_KEY_LEGACY);
        if (legacy) {
          const legacyData = JSON.parse(legacy);
          // Only migrate if the legacy record belongs to this player
          const legacyName = legacyData?.player?.name || '';
          if (legacyName.toLowerCase().trim() === (name || '').toLowerCase().trim()) {
            localStorage.setItem(newKey, legacy);
          }
        }
      }
    } catch {}
    currentKey = newKey;
  }

  const ACHIEVEMENTS = [
    { id: 'first_correct',  label: 'First Blood',       desc: 'Get your first correct answer',        check: (d) => d.totalCorrect >= 1 },
    { id: 'streak_3',       label: 'On Fire',            desc: 'Hit a 3× streak',                      check: (d) => d.maxStreak >= 3 },
    { id: 'streak_5',       label: 'Unstoppable',        desc: 'Hit a 5× streak',                      check: (d) => d.maxStreak >= 5 },
    { id: 'streak_10',      label: 'Legendary',          desc: 'Hit a 10× streak',                     check: (d) => d.maxStreak >= 10 },
    { id: 'level_5',        label: 'Climber',            desc: 'Reach level 5',                        check: (d) => d.maxLevel >= 5 },
    { id: 'level_10',       label: 'High Flyer',         desc: 'Reach level 10',                       check: (d) => d.maxLevel >= 10 },
    { id: 'boss_slay',      label: 'Boss Slayer',        desc: 'Defeat your first boss round',         check: (d) => d.bossesDefeated >= 1 },
    { id: 'accuracy_90',    label: 'Sharp Mind',         desc: 'Finish a game with ≥90% accuracy',     check: (d) => d.bestAccuracy >= 0.9 },
    { id: 'score_500',      label: 'Half-Millennium',    desc: 'Score 500 points in one game',         check: (d) => d.bestScore >= 500 },
    { id: 'score_1000',     label: 'Thousand Club',      desc: 'Score 1000 points in one game',        check: (d) => d.bestScore >= 1000 },
    { id: 'no_miss',        label: 'Flawless',           desc: 'Finish a game without missing a question', check: (d) => d.flawlessGames >= 1 },
    { id: 'sessions_5',     label: 'Regular',            desc: 'Play 5 sessions',                      check: (d) => (d.sessionsPlayed || 0) >= 5 },
    // Times table mastery achievements
    { id: 'table_2',  label: 'Twice As Nice',   desc: 'Answer every ×2 fact correctly at least once',  check: (_, s) => tableComplete(s, 2)  },
    { id: 'table_3',  label: 'Triple Threat',   desc: 'Answer every ×3 fact correctly at least once',  check: (_, s) => tableComplete(s, 3)  },
    { id: 'table_4',  label: 'Four the Win',    desc: 'Answer every ×4 fact correctly at least once',  check: (_, s) => tableComplete(s, 4)  },
    { id: 'table_5',  label: 'High Five',       desc: 'Answer every ×5 fact correctly at least once',  check: (_, s) => tableComplete(s, 5)  },
    { id: 'table_6',  label: 'Six Pack',        desc: 'Answer every ×6 fact correctly at least once',  check: (_, s) => tableComplete(s, 6)  },
    { id: 'table_7',  label: 'Lucky Seven',     desc: 'Answer every ×7 fact correctly at least once',  check: (_, s) => tableComplete(s, 7)  },
    { id: 'table_8',  label: 'Eight Is Great',  desc: 'Answer every ×8 fact correctly at least once',  check: (_, s) => tableComplete(s, 8)  },
    { id: 'table_9',  label: 'Cloud Nine',      desc: 'Answer every ×9 fact correctly at least once',  check: (_, s) => tableComplete(s, 9)  },
    { id: 'table_10', label: 'Perfect Ten',     desc: 'Answer every ×10 fact correctly at least once', check: (_, s) => tableComplete(s, 10) },
    { id: 'table_11', label: 'Going to Eleven', desc: 'Answer every ×11 fact correctly at least once', check: (_, s) => tableComplete(s, 11) },
    { id: 'table_12', label: 'Dozen Done',      desc: 'Answer every ×12 fact correctly at least once', check: (_, s) => tableComplete(s, 12) },
    // Division achievements
    { id: 'div_first_correct', label: 'First Division', desc: 'Answer your first division question correctly',    check: (_, s) => Object.keys(s).some(k => /^\d+d\d+$/.test(k) && (s[k].correct || 0) >= 1) },
    { id: 'div_table_2',  label: 'Half It Down',    desc: 'Answer every ÷2 fact correctly at least once',  check: (_, s) => tableDivideComplete(s, 2)  },
    { id: 'div_table_3',  label: 'Third Degree',    desc: 'Answer every ÷3 fact correctly at least once',  check: (_, s) => tableDivideComplete(s, 3)  },
    { id: 'div_table_4',  label: 'Quarter Master',  desc: 'Answer every ÷4 fact correctly at least once',  check: (_, s) => tableDivideComplete(s, 4)  },
    { id: 'div_table_5',  label: 'Fifth Gear',      desc: 'Answer every ÷5 fact correctly at least once',  check: (_, s) => tableDivideComplete(s, 5)  },
    { id: 'div_table_6',  label: 'Six Splitter',    desc: 'Answer every ÷6 fact correctly at least once',  check: (_, s) => tableDivideComplete(s, 6)  },
    { id: 'div_table_7',  label: 'Lucky Divisor',   desc: 'Answer every ÷7 fact correctly at least once',  check: (_, s) => tableDivideComplete(s, 7)  },
    { id: 'div_table_8',  label: 'Eighth Wonder',   desc: 'Answer every ÷8 fact correctly at least once',  check: (_, s) => tableDivideComplete(s, 8)  },
    { id: 'div_table_9',  label: 'Nine Slices',     desc: 'Answer every ÷9 fact correctly at least once',  check: (_, s) => tableDivideComplete(s, 9)  },
    { id: 'div_table_10', label: 'Perfect Split',   desc: 'Answer every ÷10 fact correctly at least once', check: (_, s) => tableDivideComplete(s, 10) },
    // Addition achievements
    { id: 'add_first_correct', label: 'First Sum',        desc: 'Answer your first addition question correctly',    check: (_, s) => Object.keys(s).some(k => /^\d+a\d+$/.test(k) && (s[k].correct || 0) >= 1) },
    // Subtraction achievements
    { id: 'sub_first_correct', label: 'First Difference', desc: 'Answer your first subtraction question correctly', check: (_, s) => Object.keys(s).some(k => /^\d+s\d+$/.test(k) && (s[k].correct || 0) >= 1) },
  ];

  // A multiplication fact is "cleanly known" if answered correctly at least once
  // with no hint AND no wrong attempt in the last 10 s.
  function tableComplete(stats, n) {
    for (let b = 1; b <= 12; b++) {
      const s = stats[`${n}x${b}`];
      if (!s || (s.cleanCorrect || 0) < 1) return false;
    }
    return true;
  }

  // Same check for division: all ÷n facts (n÷n through 12n÷n) cleanly answered
  function tableDivideComplete(stats, divisor) {
    for (let quotient = 1; quotient <= 12; quotient++) {
      const s = stats[`${divisor * quotient}d${divisor}`];
      if (!s || (s.cleanCorrect || 0) < 1) return false;
    }
    return true;
  }

  function load() {
    try {
      return JSON.parse(localStorage.getItem(currentKey)) || { player: {}, stats: {}, sessions: [], achievements: {}, lifetime: {} };
    } catch {
      return { player: {}, stats: {}, sessions: [], achievements: {}, lifetime: {} };
    }
  }

  function save(data) {
    try {
      localStorage.setItem(currentKey, JSON.stringify(data));
    } catch {}
  }

  function getAll() {
    return load();
  }

  function saveName(name) {
    const d = load();
    d.player.name = name;
    save(d);
  }

  // Record an attempt for a question key like "7x8"
  // opts.hintActive — true if the dot-grid hint was showing when answered
  function recordAttempt(key, correct, timeMs, opts = {}) {
    const d = load();
    if (!d.stats[key]) d.stats[key] = { attempts: 0, correct: 0, totalTimeMs: 0, lastSeen: 0, masteredLevel: 0 };
    const s = d.stats[key];
    s.attempts++;
    if (correct) {
      s.correct++;
      // Spaced repetition: build mastery up to level 5
      s.masteredLevel = Math.min(5, (s.masteredLevel || 0) + 1);
      // Clean correct: no hint active AND last wrong on this fact was >10 s ago (or never)
      const sinceWrong = s.lastWrongAt ? (Date.now() - s.lastWrongAt) : Infinity;
      if (!opts.hintActive && sinceWrong > 10000) {
        s.cleanCorrect = (s.cleanCorrect || 0) + 1;
      }
    } else {
      // Wrong answer drops mastery and stamps the time (used for clean-correct check)
      s.masteredLevel = Math.max(0, (s.masteredLevel || 0) - 1);
      s.lastWrongAt = Date.now();
    }
    s.totalTimeMs += timeMs;
    s.lastSeen = Date.now();
    save(d);
  }

  // Stamp a wrong attempt timestamp without a full attempt record (used for typed wrong answers)
  function recordWrong(key) {
    const d = load();
    if (!d.stats[key]) d.stats[key] = { attempts: 0, correct: 0, totalTimeMs: 0, lastSeen: 0, masteredLevel: 0 };
    d.stats[key].lastWrongAt = Date.now();
    save(d);
  }

  // Get per-question stats map
  function getStats() {
    return load().stats;
  }

  // Check and unlock new achievements; returns array of newly unlocked
  function checkAchievements(d) {
    const newly = [];
    if (!d.achievements) d.achievements = {};
    for (const a of ACHIEVEMENTS) {
      if (!d.achievements[a.id] && a.check(d.lifetime || {}, d.stats || {})) {
        d.achievements[a.id] = Date.now();
        newly.push(a);
      }
    }
    return newly;
  }

  // Save a completed session; returns array of newly unlocked achievements
  function saveSession(session) {
    const d = load();
    if (!d.lifetime) d.lifetime = {};
    const lt = d.lifetime;
    lt.totalCorrect = (lt.totalCorrect || 0) + Math.round(session.accuracy * 100); // approx
    lt.maxLevel = Math.max(lt.maxLevel || 0, session.level);
    lt.bestScore = Math.max(lt.bestScore || 0, session.score);
    lt.bestAccuracy = Math.max(lt.bestAccuracy || 0, session.accuracy);
    lt.maxStreak = Math.max(lt.maxStreak || 0, session.maxStreak || 0);
    lt.bossesDefeated = (lt.bossesDefeated || 0) + (session.bossesDefeated || 0);
    lt.sessionsPlayed = (lt.sessionsPlayed || 0) + 1;
    if (session.missCount === 0) lt.flawlessGames = (lt.flawlessGames || 0) + 1;
    d.sessions.push({ ...session, date: new Date().toISOString() });
    const newlyUnlocked = checkAchievements(d);
    save(d);
    return newlyUnlocked;
  }

  function getSessions() {
    return load().sessions;
  }

  // Check "most improved" badge: last session accuracy >= prev by 10%
  function isMostImproved() {
    const sessions = getSessions();
    if (sessions.length < 2) return false;
    const last = sessions[sessions.length - 1];
    const prev = sessions[sessions.length - 2];
    return (last.accuracy - prev.accuracy) >= 0.10;
  }

  function getAchievements() {
    const d = load();
    return ACHIEVEMENTS.map(a => ({ ...a, unlocked: !!d.achievements?.[a.id], unlockedAt: d.achievements?.[a.id] }));
  }

  // Daily challenge helpers
  function getDailyKey() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  function getDailyParams() {
    // Seed a simple PRNG from today's date string to get consistent table/difficulty
    const key = getDailyKey();
    let hash = 0;
    for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    const tables = [2,3,4,5,6,7,8,9,10,11,12];
    const diffs = ['easy','medium','hard'];
    const table = tables[hash % tables.length];
    const diff = diffs[(hash >> 4) % diffs.length];
    return { table, difficulty: diff, dateKey: key };
  }

  function getDailyResult() {
    const d = load();
    const key = getDailyKey();
    return d.dailyResults?.[key] || null;
  }

  function saveDailyResult(result) {
    const d = load();
    if (!d.dailyResults) d.dailyResults = {};
    d.dailyResults[getDailyKey()] = result;
    save(d);
  }

  // ---- Extended tables unlock ----
  function unlockExtendedTables() {
    const d = load();
    if (!d.lifetime) d.lifetime = {};
    if (!d.lifetime.extendedTablesUnlocked) {
      d.lifetime.extendedTablesUnlocked = true;
      save(d);
    }
  }

  function isExtendedTablesUnlocked() {
    return !!(load().lifetime?.extendedTablesUnlocked);
  }

  // ---- Mastery overview ----
  // Returns every fact in the game range with its masteredLevel,
  // plus aggregate counts for win-condition checking.
  // operation: 'multiply' | 'divide' | 'add' | 'subtract'
  // For multiply/add/subtract: f.a = first operand (table/range), f.b = second operand
  // For divide: f.a = divisor (the "table"), f.b = quotient
  function getMastery(minTable, maxTable, operation = 'multiply') {
    const stats = load().stats;
    const bLo = minTable === maxTable ? 1  : minTable;
    const bHi = minTable === maxTable ? 12 : maxTable;
    const facts = [];

    for (let a = minTable; a <= maxTable; a++) {
      for (let b = bLo; b <= bHi; b++) {
        let key, fa, fb;
        if (operation === 'divide') {
          key = `${a * b}d${a}`;  // dividend÷divisor; a=divisor, b=quotient
          fa = a; fb = b;         // fa=divisor for row-grouping (same role as table in ×)
        } else if (operation === 'add') {
          key = `${a}a${b}`;
          fa = a; fb = b;
        } else if (operation === 'subtract') {
          if (b > a) continue;    // skip invalid (no negatives)
          key = `${a}s${b}`;
          fa = a; fb = b;
        } else {
          key = `${a}x${b}`;
          fa = a; fb = b;
        }
        const s = stats[key];
        facts.push({ key, a: fa, b: fb,
          masteredLevel: s?.masteredLevel ?? 0,
          attempts:      s?.attempts      ?? 0,
        });
      }
    }

    const mastered = facts.filter(f => f.masteredLevel >= 5).length;
    const seen     = facts.filter(f => f.masteredLevel >= 1).length;
    return { facts, mastered, seen, total: facts.length, operation };
  }

  // Returns array of table numbers where every fact has been answered correctly ≥1 time.
  // For multiply: table = multiplier (a). For divide: table = divisor (a). Etc.
  function getTableBadges(minTable, maxTable, operation = 'multiply') {
    const { facts } = getMastery(minTable, maxTable, operation);
    const aValues = [...new Set(facts.map(f => f.a))];
    return aValues.filter(a => {
      const tableFacts = facts.filter(f => f.a === a);
      return tableFacts.length > 0 && tableFacts.every(f => f.masteredLevel >= 1);
    });
  }

  // ---- Settings persistence ----
  const SETTINGS_KEY = 'multiblaster_settings';

  function saveSettings(s) {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch {}
  }

  function loadSettings() {
    try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || null; } catch { return null; }
  }

  // ---- Run Mode persistence ----
  // Milestone thresholds for unlocking new upgrades
  const RUN_MILESTONES = [
    { id: 'commutative', check: (m) => m.runsCompleted >= 3 },
    { id: 'streakSlow',  check: (m) => m.maxStreak >= 8 },
    { id: 'reveal',      check: (m) => m.bossesDefeated >= 5 },
    { id: 'lastChance',  check: (m) => m.runsCompleted >= 10 },
  ];

  function getRunProgress() {
    const d = load();
    return d.run || {
      bestAnte: 0,
      runsCompleted: 0,
      unlockedUpgrades: [],
      milestones: { bossesDefeated: 0, runsCompleted: 0, maxStreak: 0 },
    };
  }

  function saveRunResult({ ante, upgrades, bossesDefeated, maxStreak }) {
    const d = load();
    if (!d.run) d.run = { bestAnte: 0, runsCompleted: 0, unlockedUpgrades: [], milestones: { bossesDefeated: 0, runsCompleted: 0, maxStreak: 0 } };
    const run = d.run;
    run.bestAnte = Math.max(run.bestAnte || 0, ante);
    run.runsCompleted = (run.runsCompleted || 0) + 1;
    const m = run.milestones;
    m.bossesDefeated = (m.bossesDefeated || 0) + (bossesDefeated || 0);
    m.runsCompleted  = run.runsCompleted;
    m.maxStreak      = Math.max(m.maxStreak || 0, maxStreak || 0);
    save(d);
  }

  // Returns array of newly unlocked upgrade IDs (from milestones)
  function checkRunUnlocks() {
    const d = load();
    if (!d.run) return [];
    const run = d.run;
    const already = run.unlockedUpgrades || [];
    const m = run.milestones || {};
    const newlyUnlocked = [];
    for (const milestone of RUN_MILESTONES) {
      if (!already.includes(milestone.id) && milestone.check(m)) {
        already.push(milestone.id);
        newlyUnlocked.push(milestone.id);
      }
    }
    if (newlyUnlocked.length > 0) {
      run.unlockedUpgrades = already;
      save(d);
    }
    return newlyUnlocked;
  }

  return { setPlayer, getAll, saveName, recordAttempt, recordWrong, getStats, getMastery, getTableBadges, saveSession, getSessions, isMostImproved, getAchievements, ACHIEVEMENTS, getDailyParams, getDailyResult, saveDailyResult, saveSettings, loadSettings, unlockExtendedTables, isExtendedTablesUnlocked, getRunProgress, saveRunResult, checkRunUnlocks };
})();
