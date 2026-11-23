// Klasse 4 Lab 8: Größen-Labor (Units, Movable-Comma Stellenwerttafel & Zeitstrahl)
// PIKAS Grade 4: km/m/cm/mm, t/kg/g, l/ml, €/ct (comma strictly as unit separator),
// everyday fractions (½ l, ¼ kg, ¾ h), and base-60 Zeitstrahl (h/min/s).

const UnitsLab = (() => {
  'use strict';

  function makeConvertTask({ tier, domain, givenText, targetUnit, answer, isDecimal = false, factor = 1000, tableCols = null, missingZeroTrap = null, base10Trap = null, explanation }) {
    const t = LabHost.t;
    return {
      tier,
      kind: domain === 'time' ? 'time' : 'convert',
      domain,
      givenText,
      targetUnit,
      answer,
      isDecimal,
      factor,
      tableCols,
      missingZeroTrap,
      base10Trap,
      explanation,
      prompt: t('grPromptConvert', { given: givenText, unit: targetUnit }, `Convert ${givenText} into ${targetUnit}:`),
      subtitle: domain === 'time'
        ? t('grSubTime', null, 'Remember: Time is base-60! 1 h = 60 min · 1 min = 60 s (NEVER 100!).')
        : t('grSubUnit', null, 'Use the unit place-value table to keep every zero and the comma in the right spot!'),
      fields: [{ id: 'ans', label: t('grInputLabel', { unit: targetUnit }, `Value in ${targetUnit}:`), unit: targetUnit, inputmode: isDecimal ? 'decimal' : 'numeric', placeholder: '' }],
    };
  }

  function makeElapsedTask(startH, startM, endH, endM) {
    const t = LabHost.t;
    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;
    const answer = endTotal - startTotal;
    const fmtClock = (h, m) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    const startStr = fmtClock(startH, startM);
    const endStr = fmtClock(endH, endM);
    const toNextHour = startM === 0 ? 0 : 60 - startM;
    const fullHours = Math.floor((answer - toNextHour) / 60);
    return {
      tier: 2,
      kind: 'elapsed',
      domain: 'time',
      startH, startM, endH, endM,
      startStr, endStr,
      toNextHour, fullHours,
      answer,
      base10Trap: (endH - startH) * 100 + (endM - startM),
      prompt: t('grPromptElapsed', { start: startStr, end: endStr }, `From ${startStr} to ${endStr}: How many minutes pass?`),
      subtitle: t('grSubElapsed', null, 'Jump to the next full hour first on the Zeitstrahl, then count the remaining minutes!'),
      fields: [{ id: 'ans', label: t('grMinutesLabel', null, 'Duration:'), unit: 'min', placeholder: '' }],
    };
  }

  function buildCourse() {
    return [
      makeConvertTask({ tier: 0, domain: 'volume', givenText: '½ l', targetUnit: 'ml', answer: 500, factor: 1000, tableCols: ['l', '·', '·', 'ml'], explanation: '1 l = 1 000 ml → ½ l = 500 ml' }),
      makeConvertTask({ tier: 0, domain: 'mass',   givenText: '¼ kg', targetUnit: 'g', answer: 250, factor: 1000, tableCols: ['kg', '·', '·', 'g'], explanation: '1 kg = 1 000 g → ¼ kg = 250 g' }),
      makeConvertTask({ tier: 0, domain: 'time',   givenText: '¾ h', targetUnit: 'min', answer: 45, factor: 60, explanation: '1 h = 60 min → ¼ h = 15 min → ¾ h = 45 min' }),
      makeConvertTask({ tier: 1, domain: 'length', givenText: '2 km 50 m', targetUnit: 'm', answer: 2050, factor: 1000, tableCols: ['km', '100m', '10m', 'm'], missingZeroTrap: 250, explanation: '2 km = 2 000 m, plus 50 m = 2 050 m' }),
      makeConvertTask({ tier: 1, domain: 'length', givenText: '2 km 50 m', targetUnit: 'km', answer: 2.05, isDecimal: true, factor: 1000, tableCols: ['km', '100m', '10m', 'm'], missingZeroTrap: 2.5, explanation: '2 km + 050 m = 2,05 km (the 0 holds the 100 m place!)' }),
      makeConvertTask({ tier: 1, domain: 'mass',   givenText: '4 kg 80 g', targetUnit: 'g', answer: 4080, factor: 1000, tableCols: ['kg', '100g', '10g', 'g'], missingZeroTrap: 480, explanation: '4 kg = 4 000 g + 80 g = 4 080 g' }),
      makeConvertTask({ tier: 2, domain: 'time',   givenText: '1 h 35 min', targetUnit: 'min', answer: 95, factor: 60, base10Trap: 135, explanation: '1 h = 60 min → 60 + 35 = 95 min' }),
      makeElapsedTask(14, 35, 16, 15),
    ];
  }

  function genTask(tier) {
    if (tier === 0) {
      const choice = LabHost.pick(['halfL', 'quarterKg', 'threeQuarterH', 'kmToM', 'tToKg', 'mToCm']);
      if (choice === 'halfL') return makeConvertTask({ tier: 0, domain: 'volume', givenText: '½ l', targetUnit: 'ml', answer: 500, factor: 1000, tableCols: ['l', '·', '·', 'ml'], explanation: '1 l = 1 000 ml → ½ l = 500 ml' });
      if (choice === 'quarterKg') return makeConvertTask({ tier: 0, domain: 'mass', givenText: '¼ kg', targetUnit: 'g', answer: 250, factor: 1000, tableCols: ['kg', '·', '·', 'g'], explanation: '1 kg = 1 000 g → ¼ kg = 250 g' });
      if (choice === 'threeQuarterH') return makeConvertTask({ tier: 0, domain: 'time', givenText: '¾ h', targetUnit: 'min', answer: 45, factor: 60, explanation: '1 h = 60 min → ¾ h = 45 min' });
      if (choice === 'kmToM') {
        const k = LabHost.randInt(2, 9);
        return makeConvertTask({ tier: 0, domain: 'length', givenText: `${k} km`, targetUnit: 'm', answer: k * 1000, factor: 1000, tableCols: ['km', '100m', '10m', 'm'], explanation: `${k} · 1 000 m = ${LabHost.fmtNum(k * 1000)} m` });
      }
      if (choice === 'tToKg') {
        const tons = LabHost.randInt(2, 8);
        return makeConvertTask({ tier: 0, domain: 'mass', givenText: `${tons} t`, targetUnit: 'kg', answer: tons * 1000, factor: 1000, tableCols: ['t', '100kg', '10kg', 'kg'], explanation: `${tons} · 1 000 kg = ${LabHost.fmtNum(tons * 1000)} kg` });
      }
      const m = LabHost.randInt(2, 12);
      return makeConvertTask({ tier: 0, domain: 'length', givenText: `${m} m`, targetUnit: 'cm', answer: m * 100, factor: 100, tableCols: ['m', '10cm', 'cm'], explanation: `${m} · 100 cm = ${m * 100} cm` });
    }

    if (tier === 1) {
      const kind = LabHost.pick(['kmSmallM', 'kmComma', 'kgSmallG', 'mSmallCm']);
      if (kind === 'kmSmallM') {
        const km = LabHost.randInt(1, 7), m = LabHost.randInt(2, 9) * 10;
        return makeConvertTask({ tier: 1, domain: 'length', givenText: `${km} km ${m} m`, targetUnit: 'm', answer: km * 1000 + m, factor: 1000, tableCols: ['km', '100m', '10m', 'm'], missingZeroTrap: parseInt(`${km}${m}`, 10), explanation: `${km} 000 m + ${m} m = ${LabHost.fmtNum(km * 1000 + m)} m` });
      }
      if (kind === 'kmComma') {
        const km = LabHost.randInt(1, 6), m = LabHost.randInt(1, 9) * 10;
        const dec = km + m / 1000;
        return makeConvertTask({ tier: 1, domain: 'length', givenText: `${km} km ${m} m`, targetUnit: 'km', answer: dec, isDecimal: true, factor: 1000, tableCols: ['km', '100m', '10m', 'm'], missingZeroTrap: km + m / 100, explanation: `${km} km ${m} m = ${LabHost.fmtDec(dec, 2)} km` });
      }
      if (kind === 'kgSmallG') {
        const kg = LabHost.randInt(1, 8), g = LabHost.randInt(2, 9) * 10;
        return makeConvertTask({ tier: 1, domain: 'mass', givenText: `${kg} kg ${g} g`, targetUnit: 'g', answer: kg * 1000 + g, factor: 1000, tableCols: ['kg', '100g', '10g', 'g'], missingZeroTrap: parseInt(`${kg}${g}`, 10), explanation: `${kg} 000 g + ${g} g = ${LabHost.fmtNum(kg * 1000 + g)} g` });
      }
      const m = LabHost.randInt(1, 9), cm = LabHost.randInt(2, 9);
      return makeConvertTask({ tier: 1, domain: 'length', givenText: `${m} m ${cm} cm`, targetUnit: 'cm', answer: m * 100 + cm, factor: 100, tableCols: ['m', '10cm', 'cm'], missingZeroTrap: parseInt(`${m}${cm}`, 10), explanation: `${m}00 cm + ${cm} cm = ${m * 100 + cm} cm` });
    }

    // Tier 2: Base-60 time conversions & Zeitstrahl
    if (Math.random() < 0.5) {
      const hrs = LabHost.randInt(1, 3);
      const mins = LabHost.pick([15, 20, 25, 30, 35, 45, 50]);
      return makeConvertTask({ tier: 2, domain: 'time', givenText: `${hrs} h ${mins} min`, targetUnit: 'min', answer: hrs * 60 + mins, factor: 60, base10Trap: hrs * 100 + mins, explanation: `${hrs} · 60 min + ${mins} min = ${hrs * 60 + mins} min` });
    }
    const sh = LabHost.randInt(8, 16);
    const sm = LabHost.pick([15, 20, 25, 35, 40, 45]);
    const dur = LabHost.pick([45, 55, 70, 85, 100, 115]);
    const total = sh * 60 + sm + dur;
    return makeElapsedTask(sh, sm, Math.floor(total / 60), total % 60);
  }

  function buildRound({ mode, tier }) {
    if (mode === 'course') return buildCourse();
    const tiers = tier === 'mixed' ? [0, 0, 1, 1, 1, 2, 2, 2] : Array(8).fill(tier);
    return tiers.map(ti => genTask(ti));
  }

  // ---- Größen-Stellenwerttafel & Zeitstrahl Visual ----
  function renderVisual(container, task, state, h) {
    if (task.kind === 'elapsed') {
      const nextHourStr = `${String(task.startH + 1).padStart(2, '0')}:00`;
      const showJumps = state.showHintVisual || state.showSolutionVisual;
      const remAfterNext = task.answer - task.toNextHour;
      container.innerHTML = `
        <svg viewBox="0 0 460 116" role="img" aria-label="Zeitstrahl from start time to end time">
          <line x1="48" y1="68" x2="412" y2="68" stroke="#8fa3cf" stroke-width="4" stroke-linecap="round"/>
          <circle cx="58" cy="68" r="7" fill="#6c63ff"/>
          <circle cx="200" cy="68" r="5" fill="#ffd166"/>
          <circle cx="402" cy="68" r="7" fill="#38ef7d"/>
          <text x="58" y="96" fill="#fff" font-size="13" font-weight="900" text-anchor="middle">${task.startStr}</text>
          <text x="200" y="96" fill="#ffd166" font-size="12" font-weight="800" text-anchor="middle">${nextHourStr}</text>
          <text x="402" y="96" fill="#7ef9ae" font-size="13" font-weight="900" text-anchor="middle">${task.endStr}</text>
          <path d="M 62 58 Q 130 22 196 58" fill="none" stroke="#ffd166" stroke-width="2.6" stroke-dasharray="4 3"/>
          <path d="M 204 58 Q 302 18 398 58" fill="none" stroke="#38ef7d" stroke-width="2.6" stroke-dasharray="4 3"/>
          <text x="130" y="34" fill="#ffd166" font-size="12" font-weight="900" text-anchor="middle">${showJumps ? `+${task.toNextHour} min` : '+? min'}</text>
          <text x="302" y="32" fill="#7ef9ae" font-size="12" font-weight="900" text-anchor="middle">${showJumps ? `+${remAfterNext} min` : '+? min'}</text>
        </svg>
      `;
      return;
    }

    if (task.domain === 'time') {
      container.innerHTML = `
        <div class="pv-prompt-card" style="font-size:1.35rem;font-weight:900">
          ⏱ ${h.esc(task.givenText)} = <span style="color:#7ef9ae">${state.solved ? task.answer : '?'}</span> ${h.esc(task.targetUnit)}
        </div>
        <div style="font-size:0.84rem;color:#ffd166;font-weight:700">1 h = 60 min · ½ h = 30 min · ¼ h = 15 min · ¾ h = 45 min</div>
      `;
      return;
    }

    // Decimal unit table visual (km/m, kg/g, l/ml, m/cm)
    const cols = task.tableCols || ['Unit', '·', '·', task.targetUnit];
    const showAns = state.solved ? (task.isDecimal ? h.fmtDec(task.answer, 2) : h.fmtNum(task.answer)) : '?';
    const factorLabel = task.factor === 1000 ? '1 000' : '100';
    container.innerHTML = `
      <div class="pv-prompt-card" style="font-size:1.35rem;font-weight:900">
        ${h.esc(task.givenText)} = <span style="color:#7ef9ae">${showAns}</span> ${h.esc(task.targetUnit)}
      </div>
      <table class="pv-table" style="max-width:340px" aria-label="Unit place value columns">
        <thead><tr>${cols.map((c, i) => `<th class="${i === 0 ? 'pv-col-hi' : ''}">${h.esc(c)}${i === 0 && task.isDecimal ? ' ,' : ''}</th>`).join('')}</tr></thead>
        <tbody><tr>${cols.map((_, i) => `<td class="pv-digit-cell" style="font-size:0.9rem;color:#9ba8ce">${i === 0 ? '1' : '0'}</td>`).join('')}</tr></tbody>
      </table>
      <div style="font-size:0.82rem;color:#b8c4e6">${h.t('grFactorNote', { f: factorLabel }, `Conversion factor: × / ÷ ${factorLabel}`)}</div>
    `;
  }

  // ---- Diagnostic Error Engine ----
  function checkAnswer(task, submission, state, h) {
    const val = task.isDecimal ? h.parseDec(submission.values.ans) : h.parseNum(submission.values.ans);
    if (isNaN(val)) return { empty: true };

    if (Math.abs(val - task.answer) < 0.0001) {
      const disp = task.isDecimal ? h.fmtDec(task.answer, 2) : h.fmtNum(task.answer);
      return {
        ok: true,
        title: h.t('grGoodTitle', null, 'Converted cleanly!'),
        message: `<b>${disp} ${h.esc(task.targetUnit)}</b>`,
      };
    }

    // 1. Base-10 time error (1 h 35 min -> 135 min!)
    if (task.domain === 'time' && task.base10Trap != null && Math.abs(val - task.base10Trap) < 0.01) {
      return {
        ok: false,
        category: 'base10_time_error',
        showHintVisual: true,
        title: h.t('grErrTime100Title', null, 'Careful: 1 hour has 60 minutes, NOT 100!'),
        message: h.t('grErrTime100Msg', null, 'Unlike metres or grams, clocks count in <b>60s</b>! Replace every hour with 60 minutes.'),
      };
    }

    // 2. Missing zero placeholder after comma or between units (2 km 50 m -> 250 m or 2,5 km!)
    if (task.missingZeroTrap != null && Math.abs(val - task.missingZeroTrap) < 0.001) {
      return {
        ok: false,
        category: 'missing_zero_after_comma',
        showHintVisual: true,
        title: h.t('grErrZeroTitle', null, 'A placeholder 0 is missing!'),
        message: h.t('grErrZeroMsg', null, 'Because 1 km = 1 000 m (and 1 kg = 1 000 g), there are <b>3 places</b> after the big unit — fill empty places with <b>0</b>!'),
      };
    }

    // 3. Confusing 100 vs 1 000 factor (off by 10x or /10)
    if (task.domain !== 'time' && (Math.abs(val - task.answer * 10) < 0.001 || Math.abs(val * 10 - task.answer) < 0.001)) {
      return {
        ok: false,
        category: 'factor_100_vs_1000',
        showHintVisual: true,
        title: h.t('grErrFactorTitle', null, 'Check the conversion factor (100 vs. 1 000)!'),
        message: h.t('grErrFactorMsg', { f: h.fmtNum(task.factor) }, `Here the conversion step is <b>${h.fmtNum(task.factor)}</b> — check how many zeros shift!`),
      };
    }

    return {
      ok: false,
      category: 'unit_general',
      showHintVisual: true,
      title: h.t('labTryAgainTitle', null, 'Check the unit table or Zeitstrahl!'),
      message: h.t('grErrGeneral', null, 'Look at whether the target unit is smaller (multiply) or bigger (divide / place comma).'),
    };
  }

  function getHint(task, state, level, h) {
    if (task.kind === 'elapsed') {
      return {
        title: h.t('labHintTitle', null, '💡 Hint'),
        html: h.t('grHintElapsed', { first: task.toNextHour, rest: task.answer - task.toNextHour }, `First jump to the full hour (+<b>${task.toNextHour} min</b>), then add the remaining <b>${task.answer - task.toNextHour} min</b>!`),
      };
    }
    return {
      title: h.t('labHintTitle', null, '💡 Hint'),
      html: h.esc(task.explanation || ''),
    };
  }

  function getSolution(task, state, h) {
    if (task.kind === 'elapsed') {
      return {
        html: `${task.startStr} → (+${task.toNextHour} min) → (+${task.answer - task.toNextHour} min) → ${task.endStr} ⇒ <b>${task.answer} min</b>`,
      };
    }
    const disp = task.isDecimal ? h.fmtDec(task.answer, 2) : h.fmtNum(task.answer);
    return { html: `${h.esc(task.explanation)} ⇒ <b>${disp} ${h.esc(task.targetUnit)}</b>` };
  }

  function getTrickkiste(task, state, h) {
    return {
      heading: h.t('grTrickHeading', null, 'Key Unit Conversions:'),
      formulaHtml: h.t('grTrickFormula', null, '1 km = 1 000 m · 1 m = 100 cm<br>1 t = 1 000 kg · 1 kg = 1 000 g<br>1 l = 1 000 ml · 1 h = 60 min'),
      descHtml: h.t('grTrickDesc', null, '<b>Time trap:</b> 1 h 30 min = <b>90 min</b> (never 130 min or 1,30 h!).'),
      miniSvgHtml: `<svg viewBox="0 0 218 46" role="img" aria-label="2 km 50 m equals 2050 m">
        <rect x="8" y="6" width="202" height="34" rx="8" fill="rgba(255,209,102,0.14)" stroke="#ffd166"/>
        <text x="109" y="28" fill="#fff" font-size="12" font-weight="900" text-anchor="middle">2 km 50 m = 2 <tspan fill="#ffd166">0</tspan>50 m = 2,<tspan fill="#ffd166">0</tspan>5 km</text>
      </svg>`,
      miniDesc: h.t('grMiniDesc', null, 'kilo = 1 000 (3 places after comma) ✅'),
      asideTipHtml: h.t('grAsideTip', null, 'Tip: Everyday fractions — ½ = 500/30, ¼ = 250/15, ¾ = 750/45!'),
    };
  }

  const def = {
    id: 'units',
    chapter: 3,
    prefix: 'gr',
    icon: '📏',
    roundSize: 8,
    levels: [
      { id: 0, labelKey: 'grTier0', chipKey: 'grChip0' },
      { id: 1, labelKey: 'grTier1', chipKey: 'grChip1' },
      { id: 2, labelKey: 'grTier2', chipKey: 'grChip2' },
    ],
    buildRound,
    renderVisual,
    checkAnswer,
    getHint,
    getSolution,
    getTrickkiste,
    makeConvertTask,
    makeElapsedTask,
  };

  if (typeof LabHost !== 'undefined' && LabHost.register) LabHost.register(def);
  return def;
})();
