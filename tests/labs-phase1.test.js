// tests/labs-phase1.test.js
// Unit tests for Chapter 1 Klasse 4 Labs:
// PlaceValueLab, NeighborsLab, RoundingLab, AreaLab

const { makeContext, loadModule } = require('./helpers/context');

function loadPhase1() {
  const ctx = makeContext();
  loadModule(ctx, 'i18n.js');
  loadModule(ctx, 'labs/lab-host.js');
  loadModule(ctx, 'labs/placevalue.js');
  loadModule(ctx, 'labs/neighbors.js');
  loadModule(ctx, 'labs/rounding.js');
  loadModule(ctx, 'labs/area.js');
  return ctx;
}

describe('Chapter 1 Labs — Phase 1 (Probearbeit Unit)', () => {
  let ctx, h;
  beforeEach(() => {
    ctx = loadPhase1();
    h = {
      t: ctx.LabHost.t,
      esc: ctx.LabHost.esc,
      fmtNum: ctx.LabHost.fmtNum,
      fmtDec: ctx.LabHost.fmtDec,
      parseNum: ctx.LabHost.parseNum,
      parseDec: ctx.LabHost.parseDec,
    };
  });

  // ---- 1. PlaceValueLab ----
  describe('PlaceValueLab', () => {
    test('registers with LabHost and builds 8-task curated course + procedural rounds across discrete ranges', () => {
      const lab = ctx.LabHost.getLab('placevalue');
      expect(lab).toBeTruthy();
      expect(lab.buildRound({ mode: 'course' })).toHaveLength(8);
      for (const range of [10000, 100000, 1000000]) {
        const tasks = lab.buildRound({ mode: 'practice', tier: 'mixed', range });
        expect(tasks).toHaveLength(8);
        tasks.forEach(tk => {
          expect(tk.answer).toBeGreaterThan(0);
          expect(tk.answer).toBeLessThanOrEqual(range);
        });
      }
    });

    test('German number word generator produces accurate words', () => {
      const w = ctx.PlaceValueLab.numberToGermanWord;
      expect(w(403050)).toBe('vierhundertdreitausendfünfzig');
      expect(w(1000000)).toBe('eine Million');
    });

    test('diagnoses missing interior zero, Zahlendreher, unbundled concat, scale 10x, and wrong shift direction', () => {
      const lab = ctx.PlaceValueLab;
      const readTask = lab.makeReadTask(403050, 1000000, 'word');
      expect(lab.checkAnswer(readTask, { values: { ans: '403 050' } }, {}, h).ok).toBe(true);
      expect(lab.checkAnswer(readTask, { values: { ans: '4350' } }, {}, h).category).toBe('missing_zero');
      expect(lab.checkAnswer(readTask, { values: { ans: '4030500' } }, {}, h).category).toBe('scale_10x');

      const swapTask = lab.makeReadTask(403074, 1000000, 'word');
      expect(lab.checkAnswer(swapTask, { values: { ans: '403047' } }, {}, h).category).toBe('zahlendreher');

      const bundleTask = lab.makeBundleTask({ T: 4, H: 15, Z: 3, E: 6 }, 100000);
      expect(bundleTask.answer).toBe(5536);
      expect(lab.checkAnswer(bundleTask, { values: { ans: '41536' } }, {}, h).category).toBe('unbundled_concat');

      const shiftTask = lab.makeShiftTask(35420, 'T', 'ZT', 100000);
      expect(shiftTask.answer).toBe(44420);
      expect(lab.checkAnswer(shiftTask, { values: { ans: '26420' } }, {}, h).category).toBe('wrong_shift_dir');
    });
  });

  // ---- 2. NeighborsLab ----
  describe('NeighborsLab', () => {
    test('computes place-value neighbors accurately including exact multiples and 9->0 boundaries', () => {
      const cn = ctx.NeighborsLab.computeNeighbors;
      expect(cn(43267, 1000)).toEqual({ left: 43000, right: 44000 });
      expect(cn(40000, 1000)).toEqual({ left: 39000, right: 41000 });
      expect(cn(100000, 1)).toEqual({ left: 99999, right: 100001 });
    });

    test('diagnoses digit-count comparison error, unzeroed tail, exact-multiple same, and swapped neighbors', () => {
      const lab = ctx.NeighborsLab;
      const cmp = lab.makeCompareTask(98765, 100002, 1000000);
      expect(lab.checkAnswer(cmp, { interactive: '<' }, {}, h).ok).toBe(true);
      expect(lab.checkAnswer(cmp, { interactive: '>' }, {}, h).category).toBe('digit_count_ignore');

      const nb = lab.makeNeighborTask(43267, 'T', 100000, 1);
      expect(lab.checkAnswer(nb, { stepIdx: 0, values: { left: '43200' } }, {}, h).category).toBe('unzeroed_tail');
      expect(lab.checkAnswer(nb, { stepIdx: 0, values: { left: '44000' } }, {}, h).category).toBe('swapped_neighbors');
      expect(lab.checkAnswer(nb, { stepIdx: 0, values: { left: '43000' } }, {}, h).nextStep).toBe(true);
      expect(lab.checkAnswer(nb, { stepIdx: 1, values: { right: '44000' } }, {}, h).ok).toBe(true);

      const exactNb = lab.makeNeighborTask(40000, 'T', 100000, 2);
      expect(lab.checkAnswer(exactNb, { stepIdx: 0, values: { left: '40000' } }, {}, h).category).toBe('exact_multiple_same');
    });
  });

  // ---- 3. RoundingLab ----
  describe('RoundingLab', () => {
    test('builds course & practice rounds and computes chained rounding accurately', () => {
      const lab = ctx.RoundingLab;
      expect(lab.buildRound({ mode: 'course' })).toHaveLength(8);
      expect(lab.roundTo(43449, 1000)).toBe(43000);
      expect(lab.chainedRound(43449, 1000)).toBe(44000);
      expect(lab.roundTo(299720, 1000)).toBe(300000);
    });

    test('diagnoses Kettenrundung, dropped zeros, 5-round-down, round-down-minus-1, and carry across 9', () => {
      const lab = ctx.RoundingLab;
      const chainTask = lab.makeRoundTask(43449, 'T', 100000, 1);
      expect(lab.checkAnswer(chainTask, { values: { ans: '44000' } }, {}, h).category).toBe('chained_rounding');
      expect(lab.checkAnswer(chainTask, { values: { ans: '43' } }, {}, h).category).toBe('dropped_zeros');
      expect(lab.checkAnswer(chainTask, { values: { ans: '42000' } }, {}, h).category).toBe('round_down_minus_one');

      const fiveTask = lab.makeRoundTask(67500, 'T', 100000, 1);
      expect(lab.checkAnswer(fiveTask, { values: { ans: '67000' } }, {}, h).category).toBe('five_round_down');

      const carry9 = lab.makeRoundTask(299720, 'T', 1000000, 1);
      expect(lab.checkAnswer(carry9, { values: { ans: '299000' } }, {}, h).category).toBe('carry_nine_fail');

      const invMax = lab.makeInverseTask(40000, 'T', 'max', 100000);
      expect(invMax.answer).toBe(40499);
      expect(lab.checkAnswer(invMax, { values: { ans: '40500' } }, {}, h).category).toBe('five_round_down');
    });
  });

  // ---- 4. AreaLab ----
  describe('AreaLab', () => {
    test('computes area (incl. halves), perimeter (incl. concave U-shapes), and connectivity', () => {
      const lab = ctx.AreaLab;
      const rect = lab.rectGrid(5, 3);
      expect(lab.computeArea(rect)).toBe(15);
      expect(lab.computePerimeter(rect)).toBe(16);

      const uShape = lab.makeGrid(3, 4, [[0,0],[1,0],[2,0],[2,1],[2,2],[2,3],[1,3],[0,3]]);
      expect(lab.computeArea(uShape)).toBe(8);
      expect(lab.computePerimeter(uShape)).toBe(18); // bounding box would be 14!

      const halves = lab.makeGrid(2, 2, [[1,0],[1,1]], [[0,0],[0,1]]);
      expect(lab.computeArea(halves)).toBe(3);
    });

    test('diagnoses area/perimeter swap, half-square as whole, concave inner missed, and half-perimeter', () => {
      const lab = ctx.AreaLab;
      const rect = lab.rectGrid(5, 3);
      const areaTask = lab.makeAreaTask(rect, 'rect', 0);
      expect(lab.checkAnswer(areaTask, { values: { area: '16' } }, {}, h).category).toBe('area_perimeter_swap');

      const halfTask = lab.makeAreaTask(lab.makeGrid(2, 2, [[1,0],[1,1]], [[0,0],[0,1]]), 'halves', 0);
      expect(lab.checkAnswer(halfTask, { values: { area: '4' } }, {}, h).category).toBe('half_square_as_whole');

      const uTask = lab.makePerimeterTask(lab.makeGrid(3, 4, [[0,0],[1,0],[2,0],[2,1],[2,2],[2,3],[1,3],[0,3]]), 'U', 1);
      expect(lab.checkAnswer(uTask, { values: { perim: '14' } }, {}, h).category).toBe('concave_inner_missed');
      expect(lab.checkAnswer(uTask, { values: { perim: '9' } }, {}, h).category).toBe('half_perimeter');
      expect(lab.checkAnswer(uTask, { values: { perim: '8' } }, {}, h).category).toBe('area_perimeter_swap');
    });
  });
});
