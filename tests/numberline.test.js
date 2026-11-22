// tests/numberline.test.js
// Unit tests for NumberLine Lab (Klasse 4 Zahlenstrahl-Labor) and isolated Progress persistence.

const { makeContext, loadModule } = require('./helpers/context');

function makeNumberLineCtx() {
  const ctx = makeContext();
  loadModule(ctx, 'i18n.js');
  loadModule(ctx, 'progress.js');
  loadModule(ctx, 'numberline.js');
  return ctx;
}

describe('NumberLine formatting & parsing', () => {
  let ctx;
  beforeEach(() => { ctx = makeNumberLineCtx(); });

  test('fmt() formats integers with space thousand separators', () => {
    expect(ctx.NumberLine.fmt(3000)).toBe('3 000');
    expect(ctx.NumberLine.fmt(458000)).toBe('458 000');
    expect(ctx.NumberLine.fmt(1000000)).toBe('1 000 000');
    expect(ctx.NumberLine.fmt(250)).toBe('250');
  });

  test('parseNumber() accepts spaces, dots, commas, and NBSP separators', () => {
    expect(ctx.NumberLine.parseNumber('3 000')).toBe(3000);
    expect(ctx.NumberLine.parseNumber('3.000')).toBe(3000);
    expect(ctx.NumberLine.parseNumber('3,000')).toBe(3000);
    expect(ctx.NumberLine.parseNumber('473\u00A0000')).toBe(473000);
    expect(ctx.NumberLine.parseNumber('473\u202F000')).toBe(473000);
    expect(ctx.NumberLine.parseNumber('  458000  ')).toBe(458000);
  });

  test('parseNumber() returns NaN on non-numeric input', () => {
    expect(ctx.NumberLine.parseNumber('')).toBeNaN();
    expect(ctx.NumberLine.parseNumber('abc')).toBeNaN();
    expect(ctx.NumberLine.parseNumber('-500')).toBeNaN();
  });
});

describe('NumberLine.calc() & assertQuestion()', () => {
  let ctx;
  beforeEach(() => { ctx = makeNumberLineCtx(); });

  test('all 8 curated Probearbeit questions are valid and match expected step/target', () => {
    const expected = [
      { step: 3000, target: 473000 },
      { step: 5000, target: 640000 },
      { step: 3000, target: 710000 },
      { step: 4000, target: 380000 },
      { step: 5000, target: 905000 },
      { step: 6000, target: 279000 },
      { step: 4000, target: 540000 },
      { step: 4000, target: 711000 },
    ];
    expect(ctx.NumberLine.CURATED_QUESTIONS).toHaveLength(8);
    ctx.NumberLine.CURATED_QUESTIONS.forEach((q, idx) => {
      expect(() => ctx.NumberLine.assertQuestion(q)).not.toThrow();
      const c = ctx.NumberLine.calc(q);
      expect(c.step).toBe(expected[idx].step);
      expect(c.target).toBe(expected[idx].target);
    });
  });

  test('calc() works for interior anchors where A is outside the labelled span', () => {
    const q = { ticks: 9, known: [{ i: 2, v: 532000 }, { i: 6, v: 548000 }], a: 0, tier: 2 };
    expect(ctx.NumberLine.assertQuestion(q)).toBe(true);
    const c = ctx.NumberLine.calc(q);
    expect(c.step).toBe(4000);
    expect(c.target).toBe(524000);
  });

  test('assertQuestion() rejects non-integer steps and out-of-bounds A', () => {
    expect(() => ctx.NumberLine.assertQuestion({
      ticks: 5, known: [{ i: 0, v: 1000 }, { i: 3, v: 2000 }], a: 2,
    })).toThrow();
    expect(() => ctx.NumberLine.assertQuestion({
      ticks: 5, known: [{ i: 0, v: 1000 }, { i: 4, v: 5000 }], a: 5,
    })).toThrow();
    expect(() => ctx.NumberLine.assertQuestion({
      ticks: 5, known: [{ i: 0, v: 1000 }, { i: 4, v: 5000 }], a: 0,
    })).toThrow();
    expect(() => ctx.NumberLine.assertQuestion({
      ticks: 6, known: [{ i: 3, v: 1000 }, { i: 5, v: 3000 }], a: 1,
    })).toThrow(); // minVal would be -2000 < 0
  });
});

describe('NumberLine.diagnoseStep() & diagnoseValue()', () => {
  let ctx;
  beforeEach(() => { ctx = makeNumberLineCtx(); });

  test('diagnoseStep() identifies exact match', () => {
    const q = ctx.NumberLine.CURATED_QUESTIONS[0]; // step 3000, dist 24000, intervals 8
    const res = ctx.NumberLine.diagnoseStep(q, 3000);
    expect(res.ok).toBe(true);
    expect(res.code).toBe('correct');
  });

  test('diagnoseStep() detects ticks-instead-of-gaps mistake', () => {
    const q = { ticks: 6, known: [{ i: 0, v: 10000 }, { i: 5, v: 40000 }], a: 2 }; // dist=30000, intervals=5 (step=6000), ticks=6 (30000/6=5000)
    const res = ctx.NumberLine.diagnoseStep(q, 5000);
    expect(res.ok).toBe(false);
    expect(res.code).toBe('ticks_not_gaps');
  });

  test('diagnoseStep() detects place-value ×10 / ÷10 error', () => {
    const q = ctx.NumberLine.CURATED_QUESTIONS[0]; // step 3000
    expect(ctx.NumberLine.diagnoseStep(q, 300).code).toBe('place_value');
    expect(ctx.NumberLine.diagnoseStep(q, 30000).code).toBe('place_value');
  });

  test('diagnoseStep() detects total span and grouped steps', () => {
    const q = ctx.NumberLine.CURATED_QUESTIONS[0]; // step 3000, dist 24000
    expect(ctx.NumberLine.diagnoseStep(q, 24000).code).toBe('total_span');
    expect(ctx.NumberLine.diagnoseStep(q, 6000).code).toBe('grouped_steps');
  });

  test('diagnoseValue() detects off-by-one too far and too short', () => {
    const q = ctx.NumberLine.CURATED_QUESTIONS[0]; // step 3000, target 473000
    expect(ctx.NumberLine.diagnoseValue(q, 476000).code).toBe('one_too_far');
    expect(ctx.NumberLine.diagnoseValue(q, 470000).code).toBe('one_too_short');
  });

  test('diagnoseValue() detects left-edge counting mistake on interior anchor', () => {
    const q = ctx.NumberLine.CURATED_QUESTIONS[6]; // left={i:2,v:532000}, right={i:6,v:548000}, a=4, step=4000, target=540000
    // If child counts 4 steps from 532000 instead of 2: 532000 + 4*4000 = 548000
    expect(ctx.NumberLine.diagnoseValue(q, 548000).code).toBe('left_edge_anchor');
  });

  test('diagnoseValue() detects place-value ×10 error on A', () => {
    const q = ctx.NumberLine.CURATED_QUESTIONS[0]; // target 473000
    expect(ctx.NumberLine.diagnoseValue(q, 47300).code).toBe('place_value');
    expect(ctx.NumberLine.diagnoseValue(q, 4730000).code).toBe('place_value');
  });

  test('diagnoseValue() detects wrong direction when A is left of anchor', () => {
    const q = { ticks: 9, known: [{ i: 3, v: 500000 }, { i: 7, v: 520000 }], a: 1, tier: 2 }; // step 5000, target 490000
    // Going +2*5000 from 500000 instead of -2*5000 gives 510000
    expect(ctx.NumberLine.diagnoseValue(q, 510000).code).toBe('wrong_direction');
  });
});

describe('NumberLine procedural generator (PIKAS-clean constraints)', () => {
  let ctx;
  beforeEach(() => { ctx = makeNumberLineCtx(); });

  function makeSeededRng(seed) {
    let s = seed >>> 0;
    return () => {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  test.each([10000, 100000, 1000000])('generates 30 valid PIKAS-clean questions across all 3 tiers for range %i', (rangeMax) => {
    const rng = makeSeededRng(rangeMax + 42);
    const cfg = ctx.NumberLine.RANGE_CONFIGS[rangeMax];

    for (const tier of [0, 1, 2]) {
      for (let i = 0; i < 10; i++) {
        const q = ctx.NumberLine.generateQuestion(tier, rangeMax, rng);
        expect(() => ctx.NumberLine.assertQuestion(q)).not.toThrow();
        const c = ctx.NumberLine.calc(q);
        expect(cfg.steps).toContain(c.step);
        expect(ctx.NumberLine.CLEAN_INTERVALS).toContain(c.intervals);
        expect(c.minVal).toBeGreaterThanOrEqual(0);
        expect(c.maxVal).toBeLessThanOrEqual(cfg.max);

        if (tier === 0) {
          expect(c.left.i).toBe(0);
          expect(c.right.i).toBe(q.ticks - 1);
          // Tier 0 must not cross a major place-value boundary
          expect(Math.floor(c.left.v / cfg.majorBlock)).toBe(Math.floor(c.right.v / cfg.majorBlock));
        } else if (tier === 1) {
          expect(c.left.i).toBe(0);
          expect(c.right.i).toBe(q.ticks - 1);
          // Tier 1 must cross a major place-value boundary
          expect(Math.floor(c.left.v / cfg.majorBlock)).not.toBe(Math.floor(c.right.v / cfg.majorBlock));
        } else if (tier === 2) {
          // Tier 2 must have interior labelled anchors
          expect(c.left.i).toBeGreaterThanOrEqual(1);
          expect(c.right.i).toBeLessThanOrEqual(q.ticks - 2);
        }
      }
    }
  });

  test('generateRound("mixed") returns 8 questions with 3-3-2 tier progression', () => {
    const round = ctx.NumberLine.generateRound('mixed', 1000000, 8, makeSeededRng(99));
    expect(round).toHaveLength(8);
    expect(round.map(q => q.tier)).toEqual([0, 0, 0, 1, 1, 1, 2, 2]);
  });
});

describe('NumberLine SVG & worked steps', () => {
  let ctx;
  beforeEach(() => { ctx = makeNumberLineCtx(); });

  test('buildWorkedSteps() includes inverse multiplication check', () => {
    const q = ctx.NumberLine.CURATED_QUESTIONS[0]; // 8 × 3 000 = 24 000
    const steps = ctx.NumberLine.buildWorkedSteps(q);
    expect(steps.length).toBe(6);
    expect(steps.some(s => s.includes('8 × 3 000') && s.includes('24 000'))).toBe(true);
  });

  test('buildLineSvg() renders interactive gaps, hint arcs, and solution arcs', () => {
    const q = ctx.NumberLine.CURATED_QUESTIONS[0];
    const interactiveSvg = ctx.NumberLine.buildLineSvg(q, { showIntervalArcs: true });
    expect(interactiveSvg).toContain('nl-gap-hit');
    expect(interactiveSvg).toContain('nl-hint-arcs');
    expect(interactiveSvg).not.toContain('473 000');

    const solvedSvg = ctx.NumberLine.buildLineSvg(q, { showAll: true, showTargetArcs: true, interactive: false });
    expect(solvedSvg).toContain('nl-solution-arcs');
    expect(solvedSvg).toContain('473 000');
    expect(solvedSvg).toContain('3 000');

    const compactSvg = ctx.NumberLine.buildLineSvg(q, { compact: true, showAll: true, showTargetArcs: true, interactive: false });
    expect(compactSvg).toContain('458 000');
    expect(compactSvg).toContain('482 000');
    expect(compactSvg).toContain('473 000');
    expect(compactSvg).toContain('text-anchor="start"');
    expect(compactSvg).toContain('text-anchor="end"');
  });
});

describe('Progress Number Line Lab persistence (isolated from arcade stats)', () => {
  let ctx;
  beforeEach(() => { ctx = makeNumberLineCtx(); });

  test('saveNumberLineRound() persists stats and tracks bestFirstTryScore', () => {
    ctx.Progress.setPlayer('Emma', 9);
    const initial = ctx.Progress.getNumberLineStats();
    expect(initial.roundsCompleted).toBe(0);

    ctx.Progress.saveNumberLineRound({ firstTry: 5, badStep: 2, badA: 1 });
    let stats = ctx.Progress.getNumberLineStats();
    expect(stats.roundsCompleted).toBe(1);
    expect(stats.bestFirstTryScore).toBe(5);
    expect(stats.weakStep).toBe(true);
    expect(stats.weakA).toBe(false);
    expect(typeof stats.lastPlayed).toBe('number');

    ctx.Progress.saveNumberLineRound({ firstTry: 7, badStep: 0, badA: 1 });
    stats = ctx.Progress.getNumberLineStats();
    expect(stats.roundsCompleted).toBe(2);
    expect(stats.bestFirstTryScore).toBe(7);
    expect(stats.weakStep).toBe(false);
    expect(stats.weakA).toBe(true);

    // Lower score does not reduce bestFirstTryScore
    ctx.Progress.saveNumberLineRound({ firstTry: 4, badStep: 0, badA: 0 });
    expect(ctx.Progress.getNumberLineStats().bestFirstTryScore).toBe(7);

    // Completely isolated from Klasse 2–3 arcade stats & sessions
    expect(Object.keys(ctx.Progress.getStats())).toHaveLength(0);
    expect(ctx.Progress.getSessions()).toHaveLength(0);
  });
});
