// Klasse 4 Lab 7: Schriftliche Division Labor (Written Division, Null im Quotienten & Rest + Probe)
// PIKAS Grade 4: 1-stelliger Divisor & glatte Zehnerdivisoren (20..50), Null im Quotienten, Rest + Probe.

const WrittenDivLab = (() => {
  'use strict';

  function computeDivSteps(dividend, divisor) {
    const digits = String(dividend).split('').map(Number);
    const steps = [];
    let cur = 0;
    let started = false;
    for (let i = 0; i < digits.length; i++) {
      cur = cur * 10 + digits[i];
      if (!started && cur < divisor && i < digits.length - 1) continue;
      started = true;
      const q = Math.floor(cur / divisor);
      const prod = q * divisor;
      const rem = cur - prod;
      steps.push({ cur, q, prod, rem, isZero: q === 0 });
      cur = rem;
    }
    return steps;
  }

  function makeDivTask(dividend, divisor, tier, askRest = false) {
    const t = LabHost.t;
    const quotient = Math.floor(dividend / divisor);
    const rest = dividend % divisor;
    const hasZeroInQuotient = String(quotient).includes('0');
    const fields = askRest
      ? [
          { id: 'q', label: t('wdQuotLabel', null, 'Result (Quotient):'), placeholder: '' },
          { id: 'r', label: t('wdRestLabel', null, 'Remainder (Rest):'), placeholder: '0' },
        ]
      : [{ id: 'q', label: t('wdQuotLabel', null, 'Result (Quotient):'), placeholder: '' }];

    return {
      tier,
      dividend,
      divisor,
      quotient,
      rest,
      askRest,
      hasZeroInQuotient,
      steps: computeDivSteps(dividend, divisor),
      prompt: t('wdPromptDiv', {
        a: LabHost.fmtNum(dividend),
        b: LabHost.fmtNum(divisor),
      }, `Divide: ${LabHost.fmtNum(dividend)} : ${LabHost.fmtNum(divisor)}`),
      subtitle: askRest
        ? t('wdSubRest', null, 'Enter both the quotient and the remainder (Rest). Check: Rest must be smaller than the divisor!')
        : hasZeroInQuotient
        ? t('wdSubZero', null, 'Careful: Whenever you pull down a digit and the divisor fits 0 times, write a 0 in the result!')
        : t('wdSubClean', null, 'Divide step by step from left to right and check with the Probe (Result · Divisor = Start).'),
      fields,
    };
  }

  function buildCourse() {
    return [
      makeDivTask(9468, 3, 0, false),
      makeDivTask(7392, 6, 0, false),
      makeDivTask(8160, 4, 1, false),   // Trailing + interior zero! (2 040)
      makeDivTask(6018, 6, 1, false),   // Double interior zero! (1 003)
      makeDivTask(9045, 9, 1, false),   // Interior zero (1 005)
      makeDivTask(4275, 5, 1, false),
      makeDivTask(3749, 4, 2, true),    // With Rest (937 R 1)
      makeDivTask(14400, 30, 2, false), // Clean tens-multiple divisor (480)
    ];
  }

  function genTask(tier) {
    if (tier === 0) {
      const d = LabHost.randInt(2, 9);
      // Quotient with no zeros
      const qDigits = [LabHost.randInt(1, 9), LabHost.randInt(1, 9), LabHost.randInt(1, 9), LabHost.randInt(1, 9)];
      const q = parseInt(qDigits.join(''), 10);
      return makeDivTask(q * d, d, 0, false);
    }
    if (tier === 1) {
      const d = LabHost.randInt(3, 9);
      const a = LabHost.randInt(1, 9);
      const c = LabHost.randInt(1, 9);
      const q = Math.random() < 0.5
        ? a * 1000 + c * 10        // e.g. 2040 (interior + trailing zero)
        : a * 1000 + c;            // e.g. 3007 (double interior zero)
      return makeDivTask(q * d, d, 1, false);
    }
    // Tier 2: Either 1-digit with remainder OR clean tens-multiple divisor
    if (Math.random() < 0.55) {
      const d = LabHost.randInt(3, 9);
      const q = LabHost.randInt(215, 2450);
      const r = LabHost.randInt(1, d - 1);
      return makeDivTask(q * d + r, d, 2, true);
    }
    const dTens = LabHost.pick([20, 30, 40, 50]);
    const q = LabHost.randInt(120, 950);
    return makeDivTask(q * dTens, dTens, 2, false);
  }

  function buildRound({ mode, tier }) {
    if (mode === 'course') return buildCourse();
    const tiers = tier === 'mixed' ? [0, 0, 1, 1, 1, 2, 2, 2] : Array(8).fill(tier);
    return tiers.map(ti => genTask(ti));
  }

  // ---- German Written Long-Division Visual ----
  function renderVisual(container, task, state, h) {
    const showSteps = state.showHintVisual || state.showSolutionVisual;
    const qStr = String(task.quotient).replace(/0/g, '<span class="wd-zero-hi">0</span>');
    const ansDisplay = state.solved
      ? `${qStr}${task.askRest ? ` R ${task.rest}` : ''}`
      : '?';

    let stepsHtml = '';
    if (showSteps) {
      const showCount = state.showSolutionVisual ? task.steps.length : Math.min(2, task.steps.length);
      for (let i = 0; i < showCount; i++) {
        const st = task.steps[i];
        const zeroNote = st.isZero ? `  ← ${h.t('wdZeroStepTag', null, 'write 0!')}` : '';
        stepsHtml += `<div class="wd-step-line" style="color:#a9b8ff">  ${st.cur} : ${task.divisor} = <b style="color:${st.isZero ? '#ffd166' : '#7ef9ae'}">${st.q}</b>  (−${st.prod}, Rest ${st.rem})${zeroNote}</div>`;
      }
      if (!state.showSolutionVisual && task.steps.length > showCount) {
        stepsHtml += `<div class="wd-step-line" style="color:#9ba8ce">  …</div>`;
      }
    }

    container.innerHTML = `
      <div class="wd-box">
        <div class="wd-step-line" style="font-size:1.3rem;font-weight:900">${h.fmtNum(task.dividend)} : ${h.fmtNum(task.divisor)} = ${ansDisplay}</div>
        ${stepsHtml}
      </div>
    `;
  }

  // ---- Diagnostic Error Engine ----
  function checkAnswer(task, submission, state, h) {
    const qVal = h.parseNum(submission.values.q);
    const rVal = task.askRest ? h.parseNum(submission.values.r === '' ? '0' : submission.values.r) : 0;
    if (isNaN(qVal) || (task.askRest && isNaN(rVal))) return { empty: true };

    if (qVal === task.quotient && rVal === task.rest) {
      const restPart = task.askRest ? ` R <b>${task.rest}</b>` : '';
      return {
        ok: true,
        title: h.t('wdGoodTitle', null, 'Clean division!'),
        message: `${h.fmtNum(task.dividend)} : ${h.fmtNum(task.divisor)} = <b>${h.fmtNum(task.quotient)}</b>${restPart}`,
      };
    }

    // 1. Remainder >= Divisor
    if (task.askRest && rVal >= task.divisor) {
      return {
        ok: false,
        category: 'remainder_ge_divisor',
        showHintVisual: true,
        title: h.t('wdErrRestBigTitle', null, 'Your remainder is too big!'),
        message: h.t('wdErrRestBigMsg', { r: rVal, d: task.divisor }, `Rest <b>${rVal}</b> is at least as big as the divisor <b>${task.divisor}</b> — the divisor fits at least one more time!`),
      };
    }

    // 2. Dropped interior or trailing zero in quotient (classic Klasse 4 bug: 8160:4 -> 240 or 204 or 24)
    const qNoZero = String(task.quotient).replace(/0/g, '');
    if (task.hasZeroInQuotient && String(qVal).replace(/0/g, '') === qNoZero && String(qVal).length < String(task.quotient).length) {
      return {
        ok: false,
        category: 'dropped_quotient_zero',
        showHintVisual: true,
        title: h.t('wdErrZeroTitle', null, 'You dropped a 0 in the result!'),
        message: h.t('wdErrZeroMsg', { d: task.divisor }, `Every time you pull down a digit and <b>${task.divisor}</b> fits 0 times, you must write a <b>0</b> in the quotient before pulling down the next digit!`),
      };
    }

    // 3. Tens-multiple divisor scale slip (14 400 : 30 -> 4 800 instead of 480)
    if (task.divisor >= 10 && (qVal === task.quotient * 10 || qVal * 10 === task.quotient)) {
      return {
        ok: false,
        category: 'scale_10x',
        showHintVisual: true,
        title: h.t('wdErrScaleTitle', null, 'Check the zeros when dividing by tens!'),
        message: h.t('wdErrScaleMsg', {
          a: h.fmtNum(task.dividend), b: task.divisor,
          a10: h.fmtNum(task.dividend / 10), b10: task.divisor / 10,
        }, `Cancel one zero on both sides: ${h.fmtNum(task.dividend)} : ${task.divisor} = <b>${h.fmtNum(task.dividend / 10)} : ${task.divisor / 10}</b>!`),
      };
    }

    // 4. Right quotient, wrong remainder
    if (task.askRest && qVal === task.quotient && rVal !== task.rest) {
      return {
        ok: false,
        category: 'wrong_remainder',
        showHintVisual: true,
        title: h.t('wdErrRestTitle', null, 'Quotient is right — check the remainder!'),
        message: h.t('wdErrRestMsg', {
          q: h.fmtNum(task.quotient), d: task.divisor, prod: h.fmtNum(task.quotient * task.divisor), a: h.fmtNum(task.dividend),
        }, `Probe: ${h.fmtNum(task.quotient)} · ${task.divisor} = ${h.fmtNum(task.quotient * task.divisor)}. How much is left to reach ${h.fmtNum(task.dividend)}?`),
      };
    }

    return {
      ok: false,
      category: 'div_step_slip',
      showHintVisual: true,
      title: h.t('labTryAgainTitle', null, 'Check each division step!'),
      message: h.t('wdErrGeneral', { d: task.divisor }, `Try multiplying your answer back by ${task.divisor} (Probe) to spot where it differs.`),
    };
  }

  function getHint(task, state, level, h) {
    if (task.divisor >= 10) {
      return {
        title: h.t('labHintTitle', null, '💡 Hint'),
        html: h.t('wdHintTens', {
          a10: h.fmtNum(task.dividend / 10), b10: task.divisor / 10,
        }, `Drop one matching 0 from both numbers: calculate <b>${h.fmtNum(task.dividend / 10)} : ${task.divisor / 10}</b>!`),
      };
    }
    return {
      title: h.t('labHintTitle', null, '💡 Hint'),
      html: h.t('wdHintStep', {
        first: task.steps[0].cur, d: task.divisor, q0: task.steps[0].q, digits: String(task.quotient).length,
      }, `First step: ${task.steps[0].cur} : ${task.divisor} = <b>${task.steps[0].q}</b>. The full quotient has <b>${String(task.quotient).length}</b> digits!`),
    };
  }

  function getSolution(task, state, h) {
    const restStr = task.rest > 0 ? ` + ${task.rest}` : '';
    const rBadge = task.rest > 0 ? ` R <b>${task.rest}</b>` : '';
    return {
      html: `<div>${h.fmtNum(task.dividend)} : ${h.fmtNum(task.divisor)} = <b>${h.fmtNum(task.quotient)}</b>${rBadge}</div>
             <div><b>Probe:</b> ${h.fmtNum(task.quotient)} · ${h.fmtNum(task.divisor)}${restStr} = ${h.fmtNum(task.dividend)} ✓</div>`,
    };
  }

  function getTrickkiste(task, state, h) {
    return {
      heading: h.t('wdTrickHeading', null, 'Written Division & Probe:'),
      formulaHtml: h.t('wdTrickFormula', null, '1. Divide → Multiply → Subtract → Pull down<br>2. Probe: Result · Divisor + Rest = Start'),
      descHtml: h.t('wdTrickDesc', null, '<b>Null im Quotienten:</b> If the divisor fits 0 times after pulling down a digit, ALWAYS write <b>0</b>!'),
      miniSvgHtml: `<svg viewBox="0 0 218 46" role="img" aria-label="8160 divided by 4 equals 2040">
        <rect x="10" y="6" width="198" height="34" rx="8" fill="rgba(56,239,125,0.14)" stroke="#38ef7d"/>
        <text x="109" y="28" fill="#fff" font-size="13" font-weight="900" text-anchor="middle">8 160 : 4 = 2 <tspan fill="#ffd166">0</tspan>4<tspan fill="#ffd166">0</tspan></text>
      </svg>`,
      miniDesc: h.t('wdMiniDesc', null, 'Rest is always smaller than Divisor ✅'),
      asideTipHtml: h.t('wdAsideTip', null, 'Tip: Count how many digits the quotient must have before you finish!'),
    };
  }

  const def = {
    id: 'written-div',
    chapter: 2,
    prefix: 'wd',
    icon: '➗',
    roundSize: 8,
    levels: [
      { id: 0, labelKey: 'wdTier0', chipKey: 'wdChip0' },
      { id: 1, labelKey: 'wdTier1', chipKey: 'wdChip1' },
      { id: 2, labelKey: 'wdTier2', chipKey: 'wdChip2' },
    ],
    buildRound,
    renderVisual,
    checkAnswer,
    getHint,
    getSolution,
    getTrickkiste,
    computeDivSteps,
    makeDivTask,
  };

  if (typeof LabHost !== 'undefined' && LabHost.register) LabHost.register(def);
  return def;
})();
