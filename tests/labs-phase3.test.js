// tests/labs-phase3.test.js
// Unit tests for Chapter 3 Klasse 4 Labs + LabHost & LabHub:
// UnitsLab, GeometryLab, ChartsLab, LabHost, LabHub

const { makeContext, loadModule } = require('./helpers/context');

function loadAllLabs() {
  const ctx = makeContext();
  loadModule(ctx, 'i18n.js');
  loadModule(ctx, 'progress.js');
  loadModule(ctx, 'labs/lab-host.js');
  loadModule(ctx, 'labs/placevalue.js');
  loadModule(ctx, 'labs/neighbors.js');
  loadModule(ctx, 'labs/rounding.js');
  loadModule(ctx, 'labs/area.js');
  loadModule(ctx, 'labs/written-addsub.js');
  loadModule(ctx, 'labs/written-mul.js');
  loadModule(ctx, 'labs/written-div.js');
  loadModule(ctx, 'labs/units.js');
  loadModule(ctx, 'labs/geometry.js');
  loadModule(ctx, 'labs/charts.js');
  loadModule(ctx, 'labs/lab-hub.js');
  return ctx;
}

describe('Chapter 3 Labs, LabHost & LabHub', () => {
  let ctx, h;
  beforeEach(() => {
    ctx = loadAllLabs();
    h = {
      t: ctx.LabHost.t,
      esc: ctx.LabHost.esc,
      fmtNum: ctx.LabHost.fmtNum,
      fmtDec: ctx.LabHost.fmtDec,
      parseNum: ctx.LabHost.parseNum,
      parseDec: ctx.LabHost.parseDec,
    };
  });

  // ---- LabHost & LabHub integration ----
  describe('LabHost & LabHub', () => {
    test('registers all 10 new labs and LabHub catalog lists all 11 across 3 chapters', () => {
      expect(ctx.LabHost.listLabs()).toHaveLength(10);
      expect(ctx.LabHub.CATALOG).toHaveLength(11);
      expect(ctx.LabHub.CHAPTERS).toHaveLength(3);
      ctx.LabHub.CATALOG.filter(c => !c.isLegacyNumberLine).forEach(c => {
        expect(ctx.LabHost.getLab(c.id)).toBeTruthy();
      });
    });

    test('LabHost helpers parse German comma decimals and formatted thousands cleanly', () => {
      expect(ctx.LabHost.parseNum('403 050')).toBe(403050);
      expect(ctx.LabHost.parseNum('1.000.000')).toBe(1000000);
      expect(ctx.LabHost.parseDec('2,05')).toBeCloseTo(2.05);
      expect(ctx.LabHost.fmtDec(2.05, 2)).toBe('2,05');
    });
  });

  // ---- 8. UnitsLab ----
  describe('UnitsLab', () => {
    test('builds course & practice rounds and diagnoses base-10 time error, missing zero, and 100/1000 slip', () => {
      const lab = ctx.UnitsLab;
      expect(lab.buildRound({ mode: 'course' })).toHaveLength(8);
      expect(lab.buildRound({ mode: 'practice', tier: 'mixed' })).toHaveLength(8);

      const timeTask = lab.makeConvertTask({ tier: 2, domain: 'time', givenText: '1 h 35 min', targetUnit: 'min', answer: 95, factor: 60, base10Trap: 135 });
      expect(lab.checkAnswer(timeTask, { values: { ans: '95' } }, {}, h).ok).toBe(true);
      expect(lab.checkAnswer(timeTask, { values: { ans: '135' } }, {}, h).category).toBe('base10_time_error');

      const kmDec = lab.makeConvertTask({ tier: 1, domain: 'length', givenText: '2 km 50 m', targetUnit: 'km', answer: 2.05, isDecimal: true, factor: 1000, missingZeroTrap: 2.5 });
      expect(lab.checkAnswer(kmDec, { values: { ans: '2,05' } }, {}, h).ok).toBe(true);
      expect(lab.checkAnswer(kmDec, { values: { ans: '2,5' } }, {}, h).category).toBe('missing_zero_after_comma');

      const kmM = lab.makeConvertTask({ tier: 0, domain: 'length', givenText: '3 km', targetUnit: 'm', answer: 3000, factor: 1000 });
      expect(lab.checkAnswer(kmM, { values: { ans: '300' } }, {}, h).category).toBe('factor_100_vs_1000');

      const elapsed = lab.makeElapsedTask(14, 35, 16, 15);
      expect(elapsed.answer).toBe(100);
      expect(lab.checkAnswer(elapsed, { values: { ans: '100' } }, {}, h).ok).toBe(true);
    });
  });

  // ---- 9. GeometryLab ----
  describe('GeometryLab', () => {
    test('diagnoses translation instead of reflection, inverted/unscaled Maßstab, and hidden cubes in Bauplan', () => {
      const lab = ctx.GeometryLab;
      expect(lab.buildRound({ mode: 'course' })).toHaveLength(8);
      expect(lab.buildRound({ mode: 'practice', tier: 'mixed' })).toHaveLength(8);

      const sym = lab.makeSymmetryTask([[0, 0], [1, 1], [2, 2]]);
      expect(lab.checkAnswer(sym, { interactive: sym.expectedRight }, { customState: {} }, h).ok).toBe(true);
      expect(lab.checkAnswer(sym, { interactive: sym.translatedRight }, { customState: {} }, h).category).toBe('translation_not_reflection');

      const sc = lab.makeScaleTask(4, 2, '2 : 1', 2);
      expect(lab.checkAnswer(sc, { stepIdx: 0, values: { w: '4' } }, {}, h).category).toBe('unscaled_dimension');
      expect(lab.checkAnswer(sc, { stepIdx: 0, values: { w: '2' } }, {}, h).category).toBe('inverted_scale');
      expect(lab.checkAnswer(sc, { stepIdx: 0, values: { w: '8' } }, {}, h).nextStep).toBe(true);
      expect(lab.checkAnswer(sc, { stepIdx: 1, values: { h: '4' } }, {}, h).ok).toBe(true);

      const bp = lab.makeBauplanTask([[3, 2, 1], [1, 2, 0]]);
      expect(bp.answer).toBe(9);
      expect(lab.checkAnswer(bp, { values: { ans: '6' } }, {}, h).category).toBe('hidden_cubes_missed');
      expect(lab.checkAnswer(bp, { values: { ans: '9' } }, {}, h).ok).toBe(true);
    });
  });

  // ---- 10. ChartsLab ----
  describe('ChartsLab', () => {
    test('diagnoses grid-count reading, halfway tick slip, scale 10x, and implausible Überschlag trap', () => {
      const lab = ctx.ChartsLab;
      expect(lab.buildRound({ mode: 'course' })).toHaveLength(8);
      expect(lab.buildRound({ mode: 'practice', tier: 'mixed' })).toHaveLength(8);

      const readHalf = lab.makeReadChartTask({ scale: 2000, units: [2, 4.5, 3, 5], targetIdx: 1 });
      expect(readHalf.answer).toBe(9000);
      expect(lab.checkAnswer(readHalf, { values: { ans: '9000' } }, {}, h).ok).toBe(true);
      expect(lab.checkAnswer(readHalf, { values: { ans: '4,5' } }, {}, h).category).toBe('read_grid_count');
      expect(lab.checkAnswer(readHalf, { values: { ans: '8000' } }, {}, h).category).toBe('halfway_tick_slip');
      expect(lab.checkAnswer(readHalf, { values: { ans: '900' } }, {}, h).category).toBe('scale_10x');

      const buildT = lab.makeBuildChartTask(2000, 3.5);
      expect(lab.checkAnswer(buildT, { interactive: 3.5 }, { customState: {} }, h).ok).toBe(true);

      const estT = lab.makePlausibilityTask('498 · 19', 9462, '500 · 20 = 10 000', [
        { val: 9462, tag: 'ok' },
        { val: 94620, tag: 'scale_10x' },
        { val: 4462, tag: 'implausible_exact_trap' },
      ]);
      expect(lab.checkAnswer(estT, { interactive: 9462 }, {}, h).ok).toBe(true);
      expect(lab.checkAnswer(estT, { interactive: 94620 }, {}, h).category).toBe('scale_10x');
      expect(lab.checkAnswer(estT, { interactive: 4462 }, {}, h).category).toBe('implausible_exact_trap');
    });
  });
});
