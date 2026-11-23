// tests/labs-phase2.test.js
// Unit tests for Chapter 2 Klasse 4 Labs:
// WrittenAddSubLab, WrittenMulLab, WrittenDivLab

const { makeContext, loadModule } = require('./helpers/context');

function loadPhase2() {
  const ctx = makeContext();
  loadModule(ctx, 'i18n.js');
  loadModule(ctx, 'labs/lab-host.js');
  loadModule(ctx, 'labs/written-addsub.js');
  loadModule(ctx, 'labs/written-mul.js');
  loadModule(ctx, 'labs/written-div.js');
  return ctx;
}

describe('Chapter 2 Labs — Phase 2 (Written Algorithms)', () => {
  let ctx, h;
  beforeEach(() => {
    ctx = loadPhase2();
    h = {
      t: ctx.LabHost.t,
      esc: ctx.LabHost.esc,
      fmtNum: ctx.LabHost.fmtNum,
      fmtDec: ctx.LabHost.fmtDec,
      parseNum: ctx.LabHost.parseNum,
      parseDec: ctx.LabHost.parseDec,
    };
  });

  // ---- 5. WrittenAddSubLab ----
  describe('WrittenAddSubLab', () => {
    test('registers with Abzieh/Ergaenz method toggle and builds valid rounds', () => {
      const lab = ctx.LabHost.getLab('written-addsub');
      expect(lab.defaultOptions.method).toBe('abzieh');
      expect(lab.buildRound({ mode: 'course' })).toHaveLength(8);
      for (const range of [10000, 100000, 1000000]) {
        const tasks = lab.buildRound({ mode: 'practice', tier: 'mixed', range });
        expect(tasks).toHaveLength(8);
        tasks.forEach(tk => expect(tk.answer).toBeGreaterThanOrEqual(0));
      }
    });

    test('diagnoses wrong operation, smaller-from-larger subtraction, forgotten carry, and zero-borrow collapse', () => {
      const lab = ctx.WrittenAddSubLab;
      const sub = lab.makeCalcTask(74325, 28649, '-', 1, 100000);
      expect(lab.checkAnswer(sub, { values: { ans: '45676' } }, {}, h).ok).toBe(true);
      expect(lab.checkAnswer(sub, { values: { ans: String(74325 + 28649) } }, {}, h).category).toBe('wrong_operation');
      expect(lab.checkAnswer(sub, { values: { ans: String(lab.absDigitSub(74325, 28649)) } }, {}, h).category).toBe('smaller_from_larger');

      const add = lab.makeCalcTask(36748, 28594, '+', 1, 100000);
      expect(lab.checkAnswer(add, { values: { ans: String(lab.noRegroupResult(36748, 28594, '+')) } }, {}, h).category).toBe('forgotten_carry');

      const zeroMin = lab.makeCalcTask(500042, 137685, '-', 2, 1000000);
      expect(lab.checkAnswer(zeroMin, { values: { ans: '362457' } }, {}, h).category).toBe('zero_borrow_collapse');
    });
  });

  // ---- 6. WrittenMulLab ----
  describe('WrittenMulLab', () => {
    test('builds course & practice rounds with exact partial products', () => {
      const lab = ctx.WrittenMulLab;
      expect(lab.buildRound({ mode: 'course' })).toHaveLength(8);
      expect(lab.buildRound({ mode: 'practice', tier: 'mixed' })).toHaveLength(8);
      const t = lab.makeMulTask(348, 27, 2);
      expect(t.partialTens).toBe(6960);
      expect(t.partialOnes).toBe(2436);
      expect(t.answer).toBe(9396);
    });

    test('diagnoses missing tens zero, 0*n=n slip, and order-of-magnitude error', () => {
      const lab = ctx.WrittenMulLab;
      const twoD = lab.makeMulTask(348, 27, 2);
      expect(lab.checkAnswer(twoD, { values: { ans: '9396' } }, {}, h).ok).toBe(true);
      // 348 * 2 + 348 * 7 = 696 + 2436 = 3132 (missing tens placeholder 0!)
      expect(lab.checkAnswer(twoD, { values: { ans: '3132' } }, {}, h).category).toBe('missing_tens_zero');
      expect(lab.checkAnswer(twoD, { values: { ans: '93960' } }, {}, h).category).toBe('magnitude_off');

      const zeroMid = lab.makeMulTask(2308, 6, 0);
      expect(zeroMid.answer).toBe(13848);
      // Treating 0 * 6 as 6 in tens place adds +60 -> 13908
      expect(lab.checkAnswer(zeroMid, { values: { ans: '13908' } }, {}, h).category).toBe('zero_times_n_slip');
    });
  });

  // ---- 7. WrittenDivLab ----
  describe('WrittenDivLab', () => {
    test('stays strictly within PIKAS Grade 4 divisors (1-digit or clean tens multiples)', () => {
      const lab = ctx.WrittenDivLab;
      for (let run = 0; run < 5; run++) {
        const tasks = lab.buildRound({ mode: 'practice', tier: 'mixed' });
        tasks.forEach(tk => {
          const validDiv = tk.divisor <= 9 || (tk.divisor % 10 === 0 && tk.divisor <= 50);
          expect(validDiv).toBe(true);
          expect(tk.quotient * tk.divisor + tk.rest).toBe(tk.dividend);
        });
      }
    });

    test('diagnoses dropped quotient zero, remainder >= divisor, wrong remainder, and tens scale slip', () => {
      const lab = ctx.WrittenDivLab;
      const zeroQ = lab.makeDivTask(8160, 4, 1, false);
      expect(zeroQ.quotient).toBe(2040);
      expect(lab.checkAnswer(zeroQ, { values: { q: '2040' } }, {}, h).ok).toBe(true);
      expect(lab.checkAnswer(zeroQ, { values: { q: '240' } }, {}, h).category).toBe('dropped_quotient_zero');
      expect(lab.checkAnswer(zeroQ, { values: { q: '24' } }, {}, h).category).toBe('dropped_quotient_zero');

      const restT = lab.makeDivTask(3749, 4, 2, true);
      expect(restT.quotient).toBe(937);
      expect(restT.rest).toBe(1);
      expect(lab.checkAnswer(restT, { values: { q: '936', r: '5' } }, {}, h).category).toBe('remainder_ge_divisor');
      expect(lab.checkAnswer(restT, { values: { q: '937', r: '2' } }, {}, h).category).toBe('wrong_remainder');
      expect(lab.checkAnswer(restT, { values: { q: '937', r: '1' } }, {}, h).ok).toBe(true);

      const tensDiv = lab.makeDivTask(14400, 30, 2, false);
      expect(lab.checkAnswer(tensDiv, { values: { q: '4800' } }, {}, h).category).toBe('scale_10x');
    });
  });
});
