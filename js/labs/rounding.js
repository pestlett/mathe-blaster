// Klasse 4 Lab 3: Rundungs-Labor (Rounding up to 1 000 000 with Zoomed Number Line)
// PIKAS Grade 4: Runden auf Z, H, T, ZT, HT; Rundungsstelle & Entscheidungsziffer; Umkehrrunden.

const RoundingLab = (() => {
  'use strict';

  const PLACES = [
    { key: 'Z',  step: 10 },
    { key: 'H',  step: 100 },
    { key: 'T',  step: 1000 },
    { key: 'ZT', step: 10000 },
    { key: 'HT', step: 100000 },
  ];

  function roundTo(n, step) {
    return Math.round(n / step) * step;
  }

  // Simulates classic Kettenrundung (chained rounding Z -> H -> ... -> step)
  function chainedRound(n, step) {
    let cur = n;
    for (const p of PLACES) {
      if (p.step > step) break;
      cur = Math.round(cur / p.step) * p.step;
    }
    return cur;
  }

  function makeRoundTask(n, placeKey, range, tier) {
    const t = LabHost.t;
    const pl = PLACES.find(p => p.key === placeKey) || PLACES[2];
    const lo = Math.floor(n / pl.step) * pl.step;
    const hi = lo + pl.step;
    const mid = lo + pl.step / 2;
    const decisionDigit = Math.floor((n % pl.step) / (pl.step / 10));
    const answer = roundTo(n, pl.step);
    return {
      tier: tier != null ? tier : (pl.step <= 100 ? 0 : 1),
      kind: 'round',
      range,
      n,
      placeKey: pl.key,
      step: pl.step,
      lo,
      mid,
      hi,
      decisionDigit,
      answer,
      prompt: t('rdPromptRound', {
        n: LabHost.fmtNum(n),
        place: pl.key,
      }, `Round ${LabHost.fmtNum(n)} to the nearest ${pl.key}!`),
      subtitle: t('rdSubRound', null, 'Check the decision digit directly to the right: 0–4 rounds down, 5–9 rounds up.'),
      fields: [{ id: 'ans', label: t('rdInputLabel', null, 'Rounded number:'), placeholder: '' }],
    };
  }

  function makeInverseTask(target, placeKey, extremum, range) {
    const t = LabHost.t;
    const pl = PLACES.find(p => p.key === placeKey) || PLACES[2];
    const half = pl.step / 2;
    const answer = extremum === 'min' ? target - half : target + half - 1;
    return {
      tier: 2,
      kind: 'inverse',
      extremum, // 'min' | 'max'
      range,
      target,
      placeKey: pl.key,
      step: pl.step,
      lo: target - half,
      mid: target,
      hi: target + half - 1,
      answer,
      prompt: t(extremum === 'min' ? 'rdPromptInvMin' : 'rdPromptInvMax', {
        target: LabHost.fmtNum(target),
        place: pl.key,
      }, extremum === 'min'
        ? `What is the SMALLEST whole number that rounds to ${LabHost.fmtNum(target)} (at ${pl.key})?`
        : `What is the LARGEST whole number that rounds to ${LabHost.fmtNum(target)} (at ${pl.key})?`),
      subtitle: t('rdSubInv', null, 'Think about the rounding window around the target number!'),
      fields: [{ id: 'ans', label: t('rdInvInputLabel', null, 'Number:'), placeholder: '' }],
    };
  }

  function buildCourse() {
    return [
      makeRoundTask(4364, 'Z', 10000, 0),
      makeRoundTask(18452, 'H', 100000, 0),
      makeRoundTask(43449, 'T', 100000, 1), // Kettenrundung classic!
      makeRoundTask(67500, 'T', 100000, 1), // Exact 5 midpoint!
      makeRoundTask(299720, 'T', 1000000, 1), // Carry across 9!
      makeRoundTask(648300, 'ZT', 1000000, 1),
      makeInverseTask(40000, 'T', 'min', 100000),
      makeInverseTask(40000, 'T', 'max', 100000),
    ];
  }

  function genTask(tier, range) {
    if (tier === 0) {
      const key = LabHost.pick(['Z', 'H']);
      const n = LabHost.randInt(Math.floor(range / 10), range - 100);
      return makeRoundTask(n, key, range, 0);
    }
    if (tier === 1) {
      const allowed = range <= 10000 ? ['H', 'T'] : range <= 100000 ? ['T', 'ZT'] : ['T', 'ZT', 'HT'];
      const key = LabHost.pick(allowed);
      const pl = PLACES.find(p => p.key === key);
      // 30% chance of carry-across-9 or exact-5 edge case
      if (Math.random() < 0.3 && pl.step >= 1000 && range >= pl.step * 20) {
        const base = LabHost.randInt(1, 8) * pl.step * 10 - pl.step;
        const n = base + LabHost.randInt(5, 9) * (pl.step / 10) + LabHost.randInt(1, 9);
        return makeRoundTask(n, key, range, 1);
      }
      const n = LabHost.randInt(pl.step, range - pl.step);
      return makeRoundTask(n, key, range, 1);
    }
    const allowed = range <= 10000 ? ['H', 'T'] : range <= 100000 ? ['T', 'ZT'] : ['T', 'ZT'];
    const key = LabHost.pick(allowed);
    const pl = PLACES.find(p => p.key === key);
    const mult = LabHost.randInt(2, Math.min(9, Math.floor((range - pl.step) / pl.step)));
    const target = mult * pl.step;
    return makeInverseTask(target, key, LabHost.pick(['min', 'max']), range);
  }

  function buildRound({ mode, tier, range }) {
    if (mode === 'course') return buildCourse();
    const r = range || 100000;
    const tiers = tier === 'mixed' ? [0, 0, 1, 1, 1, 1, 2, 2] : Array(8).fill(tier);
    return tiers.map(ti => genTask(ti, r));
  }

  // ---- Zoomed Rounding SVG Visual ----
  function renderVisual(container, task, state, h) {
    if (task.kind === 'round') {
      const s = String(task.n);
      const targetPosFromRight = Math.round(Math.log10(task.step));
      const decisionPosFromRight = targetPosFromRight - 1;
      const targetIdx = s.length - 1 - targetPosFromRight;
      const decIdx = s.length - 1 - decisionPosFromRight;

      const digitHtml = s.split('').map((ch, i) => {
        const sep = (s.length - i) % 3 === 0 && i > 0 ? '<span style="display:inline-block;width:7px"></span>' : '';
        let style = 'padding:3px 6px;border-radius:7px;';
        if (i === targetIdx) style += 'background:rgba(56,239,125,0.22);border:2px solid #38ef7d;color:#7ef9ae;';
        else if (i === decIdx) style += 'background:rgba(255,209,102,0.22);border:2px solid #ffd166;color:#ffd166;';
        return `${sep}<span style="${style}">${ch}</span>`;
      }).join('');

      const ratio = (task.n - task.lo) / task.step;
      const xLo = 56, xHi = 404, xMid = 230;
      const xVal = xLo + ratio * (xHi - xLo);
      const snapX = task.answer === task.hi ? xHi : xLo;
      const showSnap = state.showHintVisual || state.showSolutionVisual;

      container.innerHTML = `
        <div style="font-size:1.5rem;font-weight:900;letter-spacing:1px;margin-bottom:4px">${digitHtml}</div>
        <div style="font-size:0.8rem;color:#b8c4e6">
          <span style="color:#7ef9ae;font-weight:800">■ ${h.esc(h.t('rdLegendTarget', { place: task.placeKey }, `Rounding place (${task.placeKey})`))}</span>
          &nbsp;·&nbsp;
          <span style="color:#ffd166;font-weight:800">■ ${h.esc(h.t('rdLegendDecision', null, 'Decision digit'))}</span>
        </div>
        <svg viewBox="0 0 460 120" role="img" aria-label="Zoomed rounding interval">
          <line x1="${xLo}" y1="68" x2="${xHi}" y2="68" stroke="#8fa3cf" stroke-width="4" stroke-linecap="round"/>
          <line x1="${xLo}" y1="54" x2="${xLo}" y2="82" stroke="#f0f2ff" stroke-width="3"/>
          <line x1="${xMid}" y1="58" x2="${xMid}" y2="78" stroke="#ffd166" stroke-width="2.5" stroke-dasharray="4 3"/>
          <line x1="${xHi}" y1="54" x2="${xHi}" y2="82" stroke="#f0f2ff" stroke-width="3"/>
          <text x="${xLo}" y="102" fill="#e8ecff" font-size="13" font-weight="800" text-anchor="middle">${h.fmtNum(task.lo)}</text>
          <text x="${xMid}" y="102" fill="#ffd166" font-size="11" font-weight="800" text-anchor="middle">${h.fmtNum(task.mid)}</text>
          <text x="${xHi}" y="102" fill="#e8ecff" font-size="13" font-weight="800" text-anchor="middle">${h.fmtNum(task.hi)}</text>
          <circle cx="${xVal}" cy="68" r="7" fill="#6c63ff" stroke="#fff" stroke-width="2"/>
          <text x="${xVal}" y="44" fill="#fff" font-size="12" font-weight="900" text-anchor="middle">${h.fmtNum(task.n)}</text>
          ${showSnap ? `<path d="M ${xVal} 58 Q ${(xVal + snapX) / 2} 16 ${snapX} 56" fill="none" stroke="#38ef7d" stroke-width="3" stroke-dasharray="5 3"/>` : ''}
        </svg>
      `;
      return;
    }

    // Inverse rounding window visual
    const showBounds = state.showHintVisual || state.showSolutionVisual;
    container.innerHTML = `
      <svg viewBox="0 0 460 116" role="img" aria-label="Rounding window around target">
        <line x1="48" y1="64" x2="412" y2="64" stroke="#8fa3cf" stroke-width="4" stroke-linecap="round"/>
        <rect x="118" y="54" width="224" height="20" rx="8" fill="rgba(56,239,125,0.22)" stroke="#38ef7d" stroke-width="2"/>
        <line x1="230" y1="46" x2="230" y2="82" stroke="#ffd166" stroke-width="3"/>
        <text x="230" y="34" fill="#ffd166" font-size="14" font-weight="900" text-anchor="middle">${h.fmtNum(task.target)}</text>
        <text x="118" y="98" fill="#7ef9ae" font-size="12" font-weight="800" text-anchor="middle">${showBounds ? h.fmtNum(task.lo) : 'min ?'}</text>
        <text x="342" y="98" fill="#7ef9ae" font-size="12" font-weight="800" text-anchor="middle">${showBounds ? h.fmtNum(task.hi) : 'max ?'}</text>
      </svg>
    `;
  }

  // ---- Diagnostic Error Engine ----
  function checkAnswer(task, submission, state, h) {
    const val = h.parseNum(submission.values.ans);
    if (isNaN(val)) return { empty: true };

    if (val === task.answer) {
      return {
        ok: true,
        title: h.t('rdGoodTitle', null, 'Rounded accurately!'),
        message: task.kind === 'round'
          ? `${h.fmtNum(task.n)} ≈ <b>${h.fmtNum(task.answer)}</b>`
          : `<b>${h.fmtNum(task.answer)}</b> ≈ ${h.fmtNum(task.target)}`,
      };
    }

    if (task.kind === 'round') {
      // 1. Kettenrundung (chained rounding!)
      const chained = chainedRound(task.n, task.step);
      if (chained !== task.answer && val === chained) {
        return {
          ok: false,
          category: 'chained_rounding',
          showHintVisual: true,
          title: h.t('rdErrChainTitle', null, 'Watch out for chained rounding!'),
          message: h.t('rdErrChainMsg', { d: task.decisionDigit }, `Never round step-by-step from the right. Look <b>only</b> at the decision digit <b>${task.decisionDigit}</b> directly next to the rounding place!`),
        };
      }

      // 2. Dropped trailing zeros (e.g. 43 700 -> 44 instead of 44 000)
      if (val === task.answer / task.step) {
        return {
          ok: false,
          category: 'dropped_zeros',
          title: h.t('rdErrZerosTitle', null, 'Don\'t drop the trailing zeros!'),
          message: h.t('rdErrZerosMsg', { ans: h.fmtNum(task.answer) }, `Rounding keeps the size of the number — replace every digit to the right with a <b>0</b>.`),
        };
      }

      // 3. Rounded exact 5 down instead of up
      if (task.decisionDigit === 5 && val === task.lo) {
        return {
          ok: false,
          category: 'five_round_down',
          showHintVisual: true,
          title: h.t('rdErrFiveTitle', null, 'With 5 we round UP!'),
          message: h.t('rdErrFiveMsg', null, 'Rule: 0, 1, 2, 3, 4 round down · <b>5, 6, 7, 8, 9 round up</b>.'),
        };
      }

      // 4. Subtracted 1 when rounding down (e.g. 43 200 -> 42 000)
      if (task.answer === task.lo && val === task.lo - task.step) {
        return {
          ok: false,
          category: 'round_down_minus_one',
          showHintVisual: true,
          title: h.t('rdErrDownSubTitle', null, 'Rounding down keeps the rounding digit!'),
          message: h.t('rdErrDownSubMsg', { lo: h.fmtNum(task.lo) }, `When rounding down, the rounding digit stays the same — only the digits to its right become 0.`),
        };
      }

      // 5. Carry across 9 failure (e.g. 299 720 -> 290 000 or 200 000)
      if (Math.floor(task.lo / task.step) % 10 === 9 && task.answer === task.hi) {
        return {
          ok: false,
          category: 'carry_nine_fail',
          showHintVisual: true,
          title: h.t('rdErrCarry9Title', null, 'Carry across the 9!'),
          message: h.t('rdErrCarry9Msg', { lo: h.fmtNum(task.lo), hi: h.fmtNum(task.hi) }, `Adding 1 to a 9 rolls over into the next column: <b>${h.fmtNum(task.lo)} → ${h.fmtNum(task.hi)}</b>.`),
        };
      }

      // 6. Picked the opposite benchmark (wrong decision digit)
      if (val === task.lo || val === task.hi) {
        return {
          ok: false,
          category: 'wrong_decision_digit',
          showHintVisual: true,
          title: h.t('rdErrDirTitle', null, 'Check the yellow decision digit!'),
          message: h.t('rdErrDirMsg', { d: task.decisionDigit }, `The decision digit is <b>${task.decisionDigit}</b> — does 0–4 round down or 5–9 round up?`),
        };
      }
    }

    // Inverse rounding diagnostics
    if (task.kind === 'inverse') {
      if (task.extremum === 'max' && val === task.target + task.step / 2) {
        return {
          ok: false,
          category: 'five_round_down',
          showHintVisual: true,
          title: h.t('rdErrInvMaxTitle', null, 'Just 1 too high!'),
          message: h.t('rdErrInvMaxMsg', { v: h.fmtNum(val) }, `${h.fmtNum(val)} has a 5 in the decision place, so it already rounds UP to the next benchmark! Go 1 lower.`),
        };
      }
    }

    return {
      ok: false,
      category: 'general',
      showHintVisual: true,
      title: h.t('labTryAgainTitle', null, 'Not quite yet — check the number line!'),
      message: h.t('rdErrGeneral', null, 'Look at which benchmark on the zoomed line is closer.'),
    };
  }

  function getHint(task, state, level, h) {
    if (task.kind === 'round') {
      const dir = task.decisionDigit >= 5
        ? h.t('rdDirUp', null, 'round UP')
        : h.t('rdDirDown', null, 'round DOWN');
      return {
        title: h.t('labHintTitle', null, '💡 Hint'),
        html: h.t('rdHintRound', { d: task.decisionDigit, dir, lo: h.fmtNum(task.lo), hi: h.fmtNum(task.hi) },
          `The decision digit is <b>${task.decisionDigit}</b> → ${dir}. The two choices are <b>${h.fmtNum(task.lo)}</b> and <b>${h.fmtNum(task.hi)}</b>.`),
      };
    }
    return {
      title: h.t('labHintTitle', null, '💡 Hint'),
      html: task.extremum === 'min'
        ? h.t('rdHintInvMin', { half: h.fmtNum(task.step / 2) }, `Go half a step (${h.fmtNum(task.step / 2)}) below the target — that's where rounding UP starts!`)
        : h.t('rdHintInvMax', { half: h.fmtNum(task.step / 2 - 1) }, `Go just below the midpoint (+${h.fmtNum(task.step / 2 - 1)}) so the decision digit is still 4!`),
    };
  }

  function getSolution(task, state, h) {
    if (task.kind === 'round') {
      const rule = task.decisionDigit >= 5 ? '≥ 5 → ↑' : '≤ 4 → ↓';
      return {
        html: `${h.fmtNum(task.n)} (${h.t('rdLegendDecision', null, 'Decision digit')} = <b>${task.decisionDigit}</b>, ${rule}) ⇒ <b>${h.fmtNum(task.answer)}</b>`,
      };
    }
    return {
      html: `<b>${h.fmtNum(task.answer)}</b> ≈ ${h.fmtNum(task.target)} (Window: ${h.fmtNum(task.lo)} … ${h.fmtNum(task.hi)})`,
    };
  }

  function getTrickkiste(task, state, h) {
    return {
      heading: h.t('rdTrickHeading', null, 'The Golden Rounding Rule:'),
      formulaHtml: h.t('rdTrickFormula', null, '0, 1, 2, 3, 4 → round DOWN<br>5, 6, 7, 8, 9 → round UP'),
      descHtml: h.t('rdTrickDesc', null, 'Look <b>only</b> at the digit immediately to the right of the rounding place. Never chain-round!'),
      miniSvgHtml: `<svg viewBox="0 0 218 46" role="img" aria-label="0 to 4 down, 5 to 9 up">
        <rect x="6" y="8" width="96" height="30" rx="7" fill="rgba(108,99,255,0.22)" stroke="#6c63ff"/>
        <text x="54" y="27" fill="#fff" font-size="11" font-weight="800" text-anchor="middle">0 1 2 3 4 ↓</text>
        <rect x="116" y="8" width="96" height="30" rx="7" fill="rgba(56,239,125,0.22)" stroke="#38ef7d"/>
        <text x="164" y="27" fill="#7ef9ae" font-size="11" font-weight="800" text-anchor="middle">5 6 7 8 9 ↑</text>
      </svg>`,
      miniDesc: h.t('rdMiniDesc', null, 'All digits to the right become 0 ✅'),
      asideTipHtml: h.t('rdAsideTip', null, 'Tip: Rounding down keeps the rounding digit — it never subtracts 1!'),
    };
  }

  const def = {
    id: 'rounding',
    chapter: 1,
    prefix: 'rd',
    icon: '🎯',
    roundSize: 8,
    ranges: [10000, 100000, 1000000],
    defaultRange: 100000,
    levels: [
      { id: 0, labelKey: 'rdTier0', chipKey: 'rdChip0' },
      { id: 1, labelKey: 'rdTier1', chipKey: 'rdChip1' },
      { id: 2, labelKey: 'rdTier2', chipKey: 'rdChip2' },
    ],
    buildRound,
    renderVisual,
    checkAnswer,
    getHint,
    getSolution,
    getTrickkiste,
    roundTo,
    chainedRound,
    makeRoundTask,
    makeInverseTask,
  };

  if (typeof LabHost !== 'undefined' && LabHost.register) LabHost.register(def);
  return def;
})();
