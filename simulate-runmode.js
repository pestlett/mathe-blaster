#!/usr/bin/env node
/**
 * simulate-runmode.js
 *
 * Monte Carlo simulation of run-mode gameplay.
 * Tests multiple upgrade paths against multiple ante-target curves to find
 * the right difficulty balance.
 *
 * Usage:  node simulate-runmode.js [--runs N] [--antes N]
 */

'use strict';

const args = process.argv.slice(2);
function getArg(name, def) {
  const i = args.indexOf('--' + name);
  return i !== -1 ? args[i + 1] : def;
}
const NUM_RUNS  = parseInt(getArg('runs',  '2000'), 10);
const MAX_ANTES = parseInt(getArg('antes', '10'),   10);

// ---------------------------------------------------------------------------
// Game constants
// ---------------------------------------------------------------------------
const CORRECT_PER_LEVEL = 10;
const LEVELS_PER_ANTE   = 3;
const ANSWERS_PER_ANTE  = CORRECT_PER_LEVEL * LEVELS_PER_ANTE; // 30

// ---------------------------------------------------------------------------
// Target curves to compare
// ---------------------------------------------------------------------------
const TARGET_CURVES = {
  // Current targets (for reference)
  current: [0, 150, 350, 650, 50000, 500000, 5e6, 5e7, 5e8, 5e9, 5e10],

  // Calibrated from simulation data:
  //   Antes 1-3: training (trivial → easy → medium)
  //   Ante 4:    compound gate (MUST have compoundGrowth active)
  //   Antes 5-9: calibrated to ~70-75% pass for compound-slow path
  //              compound-fast cruises through (reward for aggressive early buy)
  //   Ante 10:   starts to challenge even compound-fast
  //
  //   compound-slow medians: 1.3k / 2.7k / 4.2k / 53M / 10.8T / 3.8E / 699Z / 158kY / 29.5GY / 5.8PY
  //   targets set at ~p25-30 of compound-slow distribution
  balanced: [0, 700, 1500, 3500, 30e6, 8e12, 3e18, 500e21, 100e27, 20e33, 4e39],
};

function getAnteTarget(curve, ante) {
  return curve[Math.min(ante, curve.length - 1)] || 0;
}

// ---------------------------------------------------------------------------
// Human response-time model (lognormal, median ~1.8s)
// ---------------------------------------------------------------------------
function randn() {
  const u1 = Math.random() || 1e-10, u2 = Math.random() || 1e-10;
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}
function sampleRT() {
  return Math.exp(0.55 + 0.45 * randn()) * 1000; // ms
}

// ---------------------------------------------------------------------------
// Score one answer
// ---------------------------------------------------------------------------
function scoreAnswer(elapsed, inHotZone, streak, flags, mult) {
  let pts = 10;
  if (elapsed < 3000) pts += 10;
  else if (elapsed < 6000) pts += 5;

  // Quick bonus
  if (flags.quickBonus) {
    const quickWindow = (flags.speedMult < 1) ? 750 : 1500;
    if (elapsed < quickWindow) {
      pts += (flags.streakBoost && streak >= 3) ? 30 : 20;
    }
  }

  // Streak multiplier
  let streakMult;
  if (flags.streakBoost) {
    streakMult = streak >= 8 ? 4 : streak >= 5 ? 3 : streak >= 3 ? 2 : 1;
  } else {
    streakMult = streak >= 5 ? 2 : streak >= 3 ? 1.5 : 1;
  }
  pts = Math.round(pts * streakMult);

  // Hot zone ×1.5
  if (inHotZone) pts = Math.round(pts * 1.5);

  return Math.round(pts * mult);
}

// ---------------------------------------------------------------------------
// Simulate one ante
// Returns { anteScore, streakOut, multOut }
//
// flags: {
//   streakBoost, quickBonus, hotZoneBoost, speedMult,
//   compoundGrowth, compoundGrowthRate,
//   luckyBonus, luckyFrequency, cascadeMultCount,
//   missRate  (probability of a miss per level — resets streak)
// }
// ---------------------------------------------------------------------------
function simulateAnte(streakIn, multIn, flags) {
  const hotProb    = flags.hotZoneBoost ? 0.50 : 0.35;
  const missRate   = flags.missRate  ?? 0.12;
  const luckyThresh = flags.luckyFrequency ? 3 : 5;

  let streak = streakIn;
  let mult   = multIn;
  let score  = 0;
  let luckyN = 0;

  for (let level = 0; level < LEVELS_PER_ANTE; level++) {
    for (let q = 0; q < CORRECT_PER_LEVEL; q++) {
      streak++;
      const elapsed   = sampleRT();
      const inHotZone = Math.random() < hotProb;

      let pts = scoreAnswer(elapsed, inHotZone, streak, flags, mult);

      // Lucky bonus
      if (flags.luckyBonus) {
        luckyN++;
        if (luckyN % luckyThresh === 0) {
          const luckyMult = 2 + Math.floor(Math.random() * 4); // ×2–×5
          pts = Math.round(pts * luckyMult);
          if ((flags.cascadeMultCount || 0) > 0) {
            mult += 0.3 * flags.cascadeMultCount;
          }
        }
      }

      score += pts;

      // Compound growth: mult ×1.5 each answer (carried across antes)
      if (flags.compoundGrowth) {
        mult *= (flags.compoundGrowthRate || 1.5);
      }
    }
    // Miss chance resets streak (not mult)
    if (Math.random() < missRate) streak = 0;
  }

  return { anteScore: score, streakOut: streak, multOut: mult };
}

// ---------------------------------------------------------------------------
// Upgrade paths
//
// Each path is an array of flag snapshots — one per ante.
// The snapshot describes which upgrades are active AT THE START of that ante.
// compoundGrowth and mult carry over in state (not in snapshot) —
// the snapshot only says whether the mechanic is active.
// ---------------------------------------------------------------------------

// No upgrades at all
const PATH_NONE = Array.from({ length: MAX_ANTES }, () => ({
  streakBoost: false, quickBonus: false, hotZoneBoost: false,
  speedMult: 1.0, compoundGrowth: false,
  luckyBonus: false, cascadeMultCount: 0,
}));

// Streak + quick (free pick streakBoost, then buy quickBonus for 9 coins)
// Available from ante 2 onwards
const PATH_STREAK = [
  { streakBoost: false, quickBonus: false, hotZoneBoost: false, speedMult: 1.0, compoundGrowth: false, luckyBonus: false, cascadeMultCount: 0 },
  ...Array.from({ length: MAX_ANTES - 1 }, () => ({
    streakBoost: true, quickBonus: true, hotZoneBoost: false,
    speedMult: 1.0, compoundGrowth: false,
    luckyBonus: false, cascadeMultCount: 0,
  })),
];

// Streak + quick + hotZoneBoost (from ante 3) + scoreMultSmall ×1.5 (from ante 4)
// Models a player who stacks linear multipliers without compound growth
const PATH_MULTSTACK = [
  // ante 1: nothing
  { streakBoost: false, quickBonus: false, hotZoneBoost: false, speedMult: 1.0, compoundGrowth: false, luckyBonus: false, cascadeMultCount: 0, _staticMult: 1.0 },
  // ante 2: streakBoost
  { streakBoost: true,  quickBonus: false, hotZoneBoost: false, speedMult: 1.0, compoundGrowth: false, luckyBonus: false, cascadeMultCount: 0, _staticMult: 1.0 },
  // ante 3: + quickBonus + hotZoneBoost
  { streakBoost: true,  quickBonus: true,  hotZoneBoost: true,  speedMult: 1.0, compoundGrowth: false, luckyBonus: false, cascadeMultCount: 0, _staticMult: 1.0 },
  // ante 4: + scoreMultSmall (×1.5)
  { streakBoost: true,  quickBonus: true,  hotZoneBoost: true,  speedMult: 1.0, compoundGrowth: false, luckyBonus: false, cascadeMultCount: 0, _staticMult: 1.5 },
  // ante 5: + another scoreMultSmall (×2.25)
  { streakBoost: true,  quickBonus: true,  hotZoneBoost: true,  speedMult: 1.0, compoundGrowth: false, luckyBonus: false, cascadeMultCount: 0, _staticMult: 2.25 },
  // ante 6: + scoreMultLarge (×4.5)
  { streakBoost: true,  quickBonus: true,  hotZoneBoost: true,  speedMult: 1.0, compoundGrowth: false, luckyBonus: false, cascadeMultCount: 0, _staticMult: 4.5 },
  // ante 7: + another scoreMultLarge (×9)
  { streakBoost: true,  quickBonus: true,  hotZoneBoost: true,  speedMult: 1.0, compoundGrowth: false, luckyBonus: false, cascadeMultCount: 0, _staticMult: 9.0 },
  // ante 8+: + luckyBonus
  ...Array.from({ length: MAX_ANTES - 7 }, () => ({
    streakBoost: true,  quickBonus: true,  hotZoneBoost: true,  speedMult: 1.0, compoundGrowth: false, luckyBonus: true, cascadeMultCount: 0, _staticMult: 9.0,
  })),
];

// Compound path: saves up 35 coins across antes 2+3, buys compoundGrowth after ante 3
// compoundGrowth is active from ante 4, multiplier carries over
const PATH_COMPOUND = [
  // ante 1: nothing
  { streakBoost: false, quickBonus: false, hotZoneBoost: false, speedMult: 1.0, compoundGrowth: false, luckyBonus: false, cascadeMultCount: 0 },
  // ante 2: streakBoost (free pick)
  { streakBoost: true,  quickBonus: false, hotZoneBoost: false, speedMult: 1.0, compoundGrowth: false, luckyBonus: false, cascadeMultCount: 0 },
  // ante 3: + quickBonus
  { streakBoost: true,  quickBonus: true,  hotZoneBoost: false, speedMult: 1.0, compoundGrowth: false, luckyBonus: false, cascadeMultCount: 0 },
  // ante 4: compoundGrowth (bought at ante 3 shop for 35 coins)
  { streakBoost: true,  quickBonus: true,  hotZoneBoost: false, speedMult: 1.0, compoundGrowth: true, compoundGrowthRate: 1.5, luckyBonus: false, cascadeMultCount: 0 },
  // ante 5: + hotZoneBoost
  { streakBoost: true,  quickBonus: true,  hotZoneBoost: true,  speedMult: 1.0, compoundGrowth: true, compoundGrowthRate: 1.5, luckyBonus: false, cascadeMultCount: 0 },
  // ante 6: + luckyBonus
  { streakBoost: true,  quickBonus: true,  hotZoneBoost: true,  speedMult: 1.0, compoundGrowth: true, compoundGrowthRate: 1.5, luckyBonus: true,  cascadeMultCount: 0 },
  // ante 7: + cascadeMult ×1
  { streakBoost: true,  quickBonus: true,  hotZoneBoost: true,  speedMult: 1.0, compoundGrowth: true, compoundGrowthRate: 1.5, luckyBonus: true,  cascadeMultCount: 1 },
  // ante 8+: + cascadeMult ×2 + luckyFrequency
  ...Array.from({ length: MAX_ANTES - 7 }, () => ({
    streakBoost: true, quickBonus: true, hotZoneBoost: true, speedMult: 1.0,
    compoundGrowth: true, compoundGrowthRate: 1.5, luckyBonus: true,
    luckyFrequency: true, cascadeMultCount: 2,
  })),
];

// Optimal path: compound growth from ante 3 (bought after ante 2 — needs a lucky draw
// and heavy saving, or surge + anything). Represents the best plausible strategy.
const PATH_OPTIMAL = [
  // ante 1: nothing
  { streakBoost: false, quickBonus: false, hotZoneBoost: false, speedMult: 1.0, compoundGrowth: false, luckyBonus: false, cascadeMultCount: 0 },
  // ante 2: streakBoost + quickBonus (free + 9 coins)
  { streakBoost: true,  quickBonus: true,  hotZoneBoost: false, speedMult: 1.0, compoundGrowth: false, luckyBonus: false, cascadeMultCount: 0 },
  // ante 3: compoundGrowth active! (saved enough coins after ante 1+2 = ~35 coins)
  { streakBoost: true,  quickBonus: true,  hotZoneBoost: false, speedMult: 1.0, compoundGrowth: true, compoundGrowthRate: 1.5, luckyBonus: false, cascadeMultCount: 0 },
  // ante 4: + hotZoneBoost + luckyBonus
  { streakBoost: true,  quickBonus: true,  hotZoneBoost: true,  speedMult: 1.0, compoundGrowth: true, compoundGrowthRate: 1.5, luckyBonus: true,  cascadeMultCount: 0 },
  // ante 5: + cascadeMult ×1
  { streakBoost: true,  quickBonus: true,  hotZoneBoost: true,  speedMult: 1.0, compoundGrowth: true, compoundGrowthRate: 1.5, luckyBonus: true,  cascadeMultCount: 1 },
  // ante 6+: + luckyFrequency + cascadeMult ×2
  ...Array.from({ length: MAX_ANTES - 5 }, () => ({
    streakBoost: true, quickBonus: true, hotZoneBoost: true, speedMult: 1.0,
    compoundGrowth: true, compoundGrowthRate: 1.5,
    luckyBonus: true, luckyFrequency: true, cascadeMultCount: 2,
  })),
];

const PATHS = {
  'No upgrades':    PATH_NONE,
  'Streak only':    PATH_STREAK,
  'Mult stack':     PATH_MULTSTACK,
  'Compound (slow)': PATH_COMPOUND,   // compound from ante 4
  'Compound (fast)': PATH_OPTIMAL,    // compound from ante 3
};

// ---------------------------------------------------------------------------
// Run simulation for one path against one target curve
// Returns: per-ante { scores[], passRate }
// ---------------------------------------------------------------------------
function runPath(pathDefs, targetCurve) {
  const result = {};
  for (let a = 1; a <= MAX_ANTES; a++) {
    result[a] = { scores: [], reached: 0, passed: 0 };
  }

  for (let r = 0; r < NUM_RUNS; r++) {
    let streak = 0;
    let mult   = 1.0;
    let alive  = true;

    for (let ante = 1; ante <= MAX_ANTES; ante++) {
      if (!alive) break;
      const flags = pathDefs[Math.min(ante - 1, pathDefs.length - 1)];

      // For multstack path, override the carried mult with static snapshot
      const startMult = (flags._staticMult !== undefined) ? flags._staticMult : mult;

      const { anteScore, streakOut, multOut } = simulateAnte(streak, startMult, flags);
      streak = streakOut;
      // For compound paths, carry the grown mult; for static paths, don't
      mult = (flags._staticMult !== undefined) ? flags._staticMult : multOut;

      result[ante].reached++;
      result[ante].scores.push(anteScore);

      const target = getAnteTarget(targetCurve, ante);
      if (anteScore >= target) {
        result[ante].passed++;
      } else {
        alive = false;
      }
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Stats helpers
// ---------------------------------------------------------------------------
function pct(arr, p) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  return sorted[Math.floor(p / 100 * (sorted.length - 1))];
}
function mean(arr) {
  return arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
}
function fmtN(n) {
  if (!isFinite(n))   return String(n);
  if (n >= 1e24) return (n / 1e24).toFixed(1) + 'Y';
  if (n >= 1e21) return (n / 1e21).toFixed(1) + 'Z';
  if (n >= 1e18) return (n / 1e18).toFixed(1) + 'E';
  if (n >= 1e15) return (n / 1e15).toFixed(1) + 'P';
  if (n >= 1e12) return (n / 1e12).toFixed(1) + 'T';
  if (n >= 1e9)  return (n / 1e9).toFixed(1) + 'G';
  if (n >= 1e6)  return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3)  return (n / 1e3).toFixed(1) + 'k';
  return String(Math.round(n));
}
function bar(rate, width = 20) {
  const filled = Math.round(rate * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}
function pctStr(n, total) {
  if (!total) return ' —  ';
  return (n / total * 100).toFixed(0).padStart(3) + '%';
}

// ---------------------------------------------------------------------------
// Print: pass-rate grid (paths × antes) for one target curve
// ---------------------------------------------------------------------------
function printPassGrid(curveName, curve, pathResults) {
  const pathNames = Object.keys(pathResults);
  const colW      = 22;

  console.log('');
  console.log('─'.repeat(8 + pathNames.length * (colW + 1)));
  console.log(`  Pass rates — "${curveName}" targets`);
  console.log('─'.repeat(8 + pathNames.length * (colW + 1)));

  // Header
  let header = 'Ante │';
  for (const name of pathNames) header += (' ' + name).padEnd(colW) + '│';
  console.log(header);
  console.log('─'.repeat(8 + pathNames.length * (colW + 1)));

  for (let ante = 1; ante <= MAX_ANTES; ante++) {
    const target = getAnteTarget(curve, ante);
    let row = `  ${String(ante).padEnd(2)} │`;
    for (const name of pathNames) {
      const r = pathResults[name][ante];
      if (!r || r.reached === 0) { row += ' —'.padEnd(colW) + '│'; continue; }
      const passRate   = r.passed / r.reached;
      const reachRate  = r.reached / NUM_RUNS;
      const medScore   = pct(r.scores, 50);
      // Show: reach% | pass% | bar | median
      const cell = `r:${pctStr(r.reached, NUM_RUNS)} p:${pctStr(r.passed, r.reached)} ${bar(passRate, 8)} ${fmtN(medScore).padStart(6)}`;
      row += (' ' + cell).padEnd(colW) + '│';
    }
    console.log(row + `  ← target: ${fmtN(target)}`);
  }
}

// ---------------------------------------------------------------------------
// Print: score percentile table for one path across all target curves
// ---------------------------------------------------------------------------
function printScoreTable(pathName, pathResultsByTarget) {
  const curveNames = Object.keys(pathResultsByTarget);
  console.log('');
  console.log('═'.repeat(75));
  console.log(`  Score distribution — "${pathName}"`);
  console.log('═'.repeat(75));
  console.log('Ante │  p10       p50       p90    │ Needed for current │ Needed for smooth');
  console.log('─'.repeat(75));
  // Use first curve's scores (scores are path-specific, not curve-specific)
  const r0 = pathResultsByTarget[curveNames[0]];
  for (let ante = 1; ante <= MAX_ANTES; ante++) {
    const scores = r0[ante]?.scores || [];
    if (!scores.length) continue;
    const p10 = pct(scores, 10), p50 = pct(scores, 50), p90 = pct(scores, 90);
    const tCur    = TARGET_CURVES.current[Math.min(ante, TARGET_CURVES.current.length - 1)];
    const tSmooth = TARGET_CURVES.smooth[Math.min(ante, TARGET_CURVES.smooth.length - 1)];
    const pass10Cur    = scores.filter(s => s >= tCur).length / scores.length * 100;
    const pass10Smooth = scores.filter(s => s >= tSmooth).length / scores.length * 100;
    console.log(
      `  ${String(ante).padEnd(2)} │ ${fmtN(p10).padStart(8)}  ${fmtN(p50).padStart(8)}  ${fmtN(p90).padStart(8)} │ ` +
      `${pass10Cur.toFixed(0).padStart(3)}% (${fmtN(tCur).padEnd(8)}) │ ` +
      `${pass10Smooth.toFixed(0).padStart(3)}% (${fmtN(tSmooth)})`
    );
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
console.log(`\nSimulating ${NUM_RUNS} runs × ${Object.keys(PATHS).length} paths × ${Object.keys(TARGET_CURVES).length} curves…\n`);

// Run all paths against all curves
const allResults  = {};
const scoreByPath = {};  // scores are independent of target curve

for (const [curveName, curve] of Object.entries(TARGET_CURVES)) {
  allResults[curveName] = {};
  for (const [pathName, path] of Object.entries(PATHS)) {
    const r = runPath(path, curve);
    allResults[curveName][pathName] = r;
    if (!scoreByPath[pathName]) scoreByPath[pathName] = r;  // save scores once
  }
  process.stdout.write(`  ✓ "${curveName}"\n`);
}

// ── 1. Score distribution table (path × ante) ────────────────────────────
console.log('\n');
console.log('═'.repeat(85));
console.log('  SCORE DISTRIBUTIONS (path × ante)');
console.log('  p10 / p50 / p90 across all runs, per-ante delta, no targets considered');
console.log('═'.repeat(85));
for (const [pathName, perAnte] of Object.entries(scoreByPath)) {
  console.log(`\n  ── ${pathName} ──`);
  console.log('  Ante │       p10         p50         p90');
  console.log('  ─────┼───────────────────────────────────');
  for (let ante = 1; ante <= MAX_ANTES; ante++) {
    const scores = perAnte[ante]?.scores || [];
    if (!scores.length) break;
    const p10 = pct(scores, 10), p50 = pct(scores, 50), p90 = pct(scores, 90);
    console.log(`    ${String(ante).padEnd(2)} │ ${fmtN(p10).padStart(11)}  ${fmtN(p50).padStart(11)}  ${fmtN(p90).padStart(11)}`);
  }
}

// ── 2. Pass-rate grids ────────────────────────────────────────────────────
for (const [curveName, curve] of Object.entries(TARGET_CURVES)) {
  printPassGrid(curveName, curve, allResults[curveName]);
}

// ── 3. Cumulative survival table ──────────────────────────────────────────
// Shows: for each curve, what % of runs survive to each ante (passed it, not just reached).
// This is the best single view of difficulty.
console.log('\n');
console.log('═'.repeat(100));
console.log('  CUMULATIVE SURVIVAL: % of all runs that pass each ante');
console.log('  (read as: this many runs make it past ante N with that upgrade path & target curve)');
console.log('═'.repeat(100));
const pathOrder = ['No upgrades', 'Streak only', 'Mult stack', 'Compound (slow)', 'Compound (fast)'];
for (const [curveName] of Object.entries(TARGET_CURVES)) {
  console.log(`\n  ── "${curveName}" targets ──`);
  let hdr2 = '  Ante │';
  for (const p of pathOrder) hdr2 += (' ' + p.slice(0, 12)).padEnd(13) + '│';
  console.log(hdr2);
  console.log('  ' + '─'.repeat(hdr2.length - 2));
  for (let ante = 1; ante <= MAX_ANTES; ante++) {
    let row = `    ${String(ante).padEnd(2)} │`;
    let anyData = false;
    for (const pathName of pathOrder) {
      const r = allResults[curveName][pathName][ante];
      if (!r || r.reached === 0) { row += '           — │'; continue; }
      anyData = true;
      const survRate = r.passed / NUM_RUNS * 100;
      const b = bar(r.passed / NUM_RUNS, 6);
      row += ` ${b} ${survRate.toFixed(0).padStart(3)}%  │`;
    }
    if (!anyData) break;
    console.log(row);
  }
}

// ── 4. Recommended targets with rationale ────────────────────────────────
console.log('\n');
console.log('═'.repeat(80));
console.log('  PROPOSED BALANCED TARGETS (based on simulation data)');
console.log('═'.repeat(80));
console.log('  Target philosophy:');
console.log('    Ante 1-2: easy "training wheels" — any play style passes');
console.log('    Ante 3:   needs streak + quick combo (filters purely passive play)');
console.log('    Ante 4:   hard gate — MUST have compoundGrowth active');
console.log('    Ante 5+:  calibrated to ~70-75% pass for compound-slow (real pressure)');
console.log('              compound-fast (aggressive strategy) gets a longer run');
console.log('              Mult-stack / no-compound: eliminated at ante 4');
console.log('');

const PROPOSED = TARGET_CURVES.balanced;
const pathsToShow = ['No upgrades', 'Streak only', 'Mult stack', 'Compound (slow)', 'Compound (fast)'];
const hdr2 = 'Ante │ Target       │' + pathsToShow.map(p => (' ' + p.slice(0,9)).padEnd(13)).join('│') + '│';
console.log(hdr2);
console.log('─'.repeat(hdr2.length));

for (let ante = 1; ante <= MAX_ANTES; ante++) {
  const target = getAnteTarget(PROPOSED, ante);
  let row = `  ${String(ante).padEnd(2)} │ ${fmtN(target).padStart(12)} │`;
  for (const pathName of pathsToShow) {
    const r = allResults['balanced'][pathName][ante];
    if (!r || r.reached === 0) { row += '     —      │'; continue; }
    const passRate = r.passed / r.reached;
    const reachRate = r.reached / NUM_RUNS;
    row += ` r:${pctStr(r.reached, NUM_RUNS)} p:${pctStr(r.passed, r.reached)} ${bar(passRate, 4)} │`;
  }
  console.log(row);
}

console.log('');
console.log('Notes:');
console.log('  r:X% = % of all runs that reached this ante');
console.log('  p:X% = % of those runs that passed the ante check');
console.log('  ████ = 100% pass    ░░░░ = 0% pass');
console.log('  Scores are PER-ANTE deltas (scoreMultiplier carries across antes)');
console.log('  compoundGrowth (×1.5/answer) is the primary path to ante 5+');
console.log('  compoundGrowth must be active before ante 4 (cost: 35 coins)');
console.log('  Mult-stack (scoreMultSmall/Large) alone cannot reach any compound-gated ante');
