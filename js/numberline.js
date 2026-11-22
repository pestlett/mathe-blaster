// numberline.js — Klasse 4 Zahlenstrahl-Labor (Number Line Lab)
// Untimed, PIKAS-aligned interactive number line trainer isolated from arcade mastery.

const NumberLine = (() => {
  'use strict';

  // Curated 8-question Probearbeit course (Zahlenraum bis 1 000 000)
  // All indices are 0-based tick indices; known ticks may be at endpoints or interior.
  const CURATED_QUESTIONS = [
    { ticks: 9,  known: [{ i: 0, v: 458000 }, { i: 8, v: 482000 }], a: 5, tier: 0, subtitleKey: 'nlSub0' },
    { ticks: 7,  known: [{ i: 0, v: 620000 }, { i: 6, v: 650000 }], a: 4, tier: 0, subtitleKey: 'nlSub1' },
    { ticks: 9,  known: [{ i: 0, v: 704000 }, { i: 8, v: 728000 }], a: 2, tier: 0, subtitleKey: 'nlSub2' },
    { ticks: 8,  known: [{ i: 0, v: 360000 }, { i: 7, v: 388000 }], a: 5, tier: 1, subtitleKey: 'nlSub3' },
    { ticks: 9,  known: [{ i: 0, v: 875000 }, { i: 8, v: 915000 }], a: 6, tier: 1, subtitleKey: 'nlSub4' },
    { ticks: 9,  known: [{ i: 0, v: 243000 }, { i: 8, v: 291000 }], a: 6, tier: 1, subtitleKey: 'nlSub5', backward: true },
    { ticks: 9,  known: [{ i: 2, v: 532000 }, { i: 6, v: 548000 }], a: 4, tier: 2, subtitleKey: 'nlSub6' },
    { ticks: 10, known: [{ i: 1, v: 695000 }, { i: 8, v: 723000 }], a: 5, tier: 2, subtitleKey: 'nlSub7' },
  ];

  // Discrete PIKAS Klasse 4 number ranges (never continuous, never mixed in one round)
  const RANGE_CONFIGS = {
    10000: {
      max: 10000,
      majorBlock: 1000,
      steps: [100, 200, 250, 500, 1000],
    },
    100000: {
      max: 100000,
      majorBlock: 10000,
      steps: [1000, 2000, 2500, 3000, 4000, 5000, 10000],
    },
    1000000: {
      max: 1000000,
      majorBlock: 100000,
      steps: [1000, 2000, 2500, 3000, 4000, 5000, 10000, 20000, 25000, 50000, 100000],
    },
  };

  // Clean Einmaleins / Zehnerrechnen interval divisors
  const CLEAN_INTERVALS = [2, 3, 4, 5, 6, 8, 10];

  // Format integer with consistent thin/space thousand grouping (avoids . vs , confusion)
  function fmt(n) {
    return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  // Forgiving integer parser: strips spaces, dots, commas, NBSP, narrow NBSP
  function parseNumber(s) {
    if (typeof s !== 'string' && typeof s !== 'number') return NaN;
    const v = String(s).trim().replace(/[\s.,\u00A0\u202F]/g, '');
    return /^\d+$/.test(v) ? Number(v) : NaN;
  }

  // Pure calculation of step size, distance, intervals, and target value at A
  function calc(q) {
    const left = q.known[0];
    const right = q.known[1];
    const intervals = right.i - left.i;
    const dist = right.v - left.v;
    const step = dist / intervals;
    const target = left.v + (q.a - left.i) * step;
    const minVal = left.v - left.i * step;
    const maxVal = left.v + (q.ticks - 1 - left.i) * step;
    return { left, right, intervals, dist, step, target, minVal, maxVal };
  }

  // Validate structural & mathematical integrity of a question
  function assertQuestion(q) {
    if (!q || !Array.isArray(q.known) || q.known.length !== 2) {
      throw new Error('Invalid exercise: requires two known ticks');
    }
    const c = calc(q);
    if (!Number.isInteger(q.ticks) || q.ticks < 3) {
      throw new Error('Invalid exercise: ticks must be integer >= 3');
    }
    if (c.left.i < 0 || c.right.i >= q.ticks || c.intervals <= 0) {
      throw new Error('Invalid exercise: invalid known tick indices');
    }
    if (!Number.isInteger(c.step) || c.step <= 0) {
      throw new Error('Invalid exercise: step must be a positive integer');
    }
    if (!Number.isInteger(q.a) || q.a < 0 || q.a >= q.ticks || q.a === c.left.i || q.a === c.right.i) {
      throw new Error('Invalid exercise: target A out of bounds or on known tick');
    }
    if (c.minVal < 0) {
      throw new Error('Invalid exercise: number line goes below 0');
    }
    return true;
  }

  // Validate curated course at module load time
  CURATED_QUESTIONS.forEach(assertQuestion);

  function _pick(arr, rng) {
    return arr[Math.floor(rng() * arr.length)];
  }

  function _randInt(min, max, rng) {
    return min + Math.floor(rng() * (max - min + 1));
  }

  // Generate one PIKAS-clean procedural question for a given tier (0, 1, 2) and rangeMax (10000 | 100000 | 1000000)
  function generateQuestion(tier = 0, rangeMax = 1000000, rng = Math.random) {
    const cfg = RANGE_CONFIGS[rangeMax] || RANGE_CONFIGS[1000000];
    const maxVal = cfg.max;
    const block = cfg.majorBlock;
    const numBlocks = Math.floor(maxVal / block);

    for (let attempt = 0; attempt < 200; attempt++) {
      if (tier === 0) {
        // Tier 0 (Level 1): endpoints labelled, NO major place-value boundary crossing, forward counting
        const intervals = _pick([4, 5, 6, 8], rng);
        const validSteps = cfg.steps.filter(s => s * intervals <= block - s);
        if (!validSteps.length) continue;
        const step = _pick(validSteps, rng);
        const span = step * intervals;
        const blockIdx = _randInt(1, numBlocks - 1, rng);
        const blockStart = blockIdx * block;
        const blockEnd = blockStart + block;
        const maxOffsetSteps = Math.floor((block - span - step) / step);
        if (maxOffsetSteps < 0) continue;
        const offsetSteps = _randInt(0, maxOffsetSteps, rng);
        const leftV = blockStart + offsetSteps * step;
        const rightV = leftV + span;
        if (Math.floor(leftV / block) !== Math.floor(rightV / block) || rightV >= blockEnd) continue;
        const maxA = Math.max(1, Math.min(intervals - 1, Math.ceil(intervals * 0.65)));
        const a = _randInt(1, maxA, rng);
        const q = {
          ticks: intervals + 1,
          known: [{ i: 0, v: leftV }, { i: intervals, v: rightV }],
          a,
          tier: 0,
          subtitleKey: 'nlGenSub0',
        };
        assertQuestion(q);
        return q;
      }

      if (tier === 1) {
        // Tier 1 (Level 2): endpoints labelled, ALWAYS crosses a major boundary, often backward from right
        const intervals = _pick([4, 5, 6, 8, 10], rng);
        const validSteps = cfg.steps.filter(s => s * intervals <= maxVal * 0.5 && s * intervals >= block * 0.15);
        if (!validSteps.length) continue;
        const step = _pick(validSteps, rng);
        const span = step * intervals;
        const boundaryBlock = _randInt(2, numBlocks - 1, rng);
        const boundary = boundaryBlock * block;
        // Place leftV strictly before boundary and rightV strictly after boundary
        const minStepsBefore = 1;
        const maxStepsBefore = intervals - 1;
        const stepsBefore = _randInt(minStepsBefore, maxStepsBefore, rng);
        // Shift slightly by clean sub-unit or exact step multiple so boundary falls inside (leftV, rightV)
        const leftV = boundary - stepsBefore * step;
        const rightV = leftV + span;
        if (leftV <= 0 || rightV > maxVal) continue;
        if (Math.floor(leftV / block) === Math.floor(rightV / block)) continue;

        // Pick A avoiding exact midpoint when possible, favoring right half half the time for backward practice
        const candidates = [];
        for (let idx = 1; idx < intervals; idx++) {
          if (intervals % 2 === 0 && idx === intervals / 2) continue;
          candidates.push(idx);
        }
        const a = _pick(candidates.length ? candidates : [1], rng);
        const backward = (intervals - a) < a;
        const q = {
          ticks: intervals + 1,
          known: [{ i: 0, v: leftV }, { i: intervals, v: rightV }],
          a,
          tier: 1,
          backward,
          subtitleKey: backward ? 'nlGenSub1Back' : 'nlGenSub1Cross',
        };
        assertQuestion(q);
        return q;
      }

      // Tier 2 (Level 3): interior labelled anchors, A either between or outside the labelled span
      const ticks = _pick([8, 9, 10], rng);
      const validIntervals = CLEAN_INTERVALS.filter(iv => iv >= 3 && iv <= ticks - 3);
      const intervals = _pick(validIntervals, rng);
      const leftIdx = _randInt(1, ticks - 2 - intervals, rng);
      const rightIdx = leftIdx + intervals;
      const validSteps = cfg.steps.filter(s => s * (ticks - 1) <= maxVal * 0.6);
      if (!validSteps.length) continue;
      const step = _pick(validSteps, rng);
      const totalSpan = step * (ticks - 1);
      const minStart = Math.max(step, Math.floor(maxVal * 0.1 / step) * step);
      const maxStart = Math.floor((maxVal - totalSpan) / step) * step;
      if (maxStart <= minStart) continue;
      const startUnits = _randInt(Math.floor(minStart / step), Math.floor(maxStart / step), rng);
      const minLineV = startUnits * step;
      const leftV = minLineV + leftIdx * step;
      const rightV = minLineV + rightIdx * step;
      if (minLineV < 0 || minLineV + totalSpan > maxVal) continue;

      const candidates = [];
      for (let idx = 0; idx < ticks; idx++) {
        if (idx !== leftIdx && idx !== rightIdx) candidates.push(idx);
      }
      const a = _pick(candidates, rng);
      const isOutside = a < leftIdx || a > rightIdx;
      const distLeft = Math.abs(a - leftIdx);
      const distRight = Math.abs(a - rightIdx);
      const backward = distRight < distLeft;
      const q = {
        ticks,
        known: [{ i: leftIdx, v: leftV }, { i: rightIdx, v: rightV }],
        a,
        tier: 2,
        backward,
        subtitleKey: isOutside ? 'nlGenSub2Outside' : 'nlGenSub2Inside',
      };
      assertQuestion(q);
      return q;
    }

    // Deterministic safe fallback (guaranteed valid)
    const fbStep = cfg.steps[0];
    const fbIntervals = 4;
    const fbStart = cfg.majorBlock;
    const fb = {
      ticks: fbIntervals + 1,
      known: [{ i: 0, v: fbStart }, { i: fbIntervals, v: fbStart + fbStep * fbIntervals }],
      a: 2,
      tier: Math.min(2, Math.max(0, tier)),
      subtitleKey: 'nlGenSub0',
    };
    assertQuestion(fb);
    return fb;
  }

  // Generate an 8-question practice round for 'mixed' or a specific tier (0 | 1 | 2)
  function generateRound(modeTier = 'mixed', rangeMax = 1000000, count = 8, rng = Math.random) {
    const tiers = modeTier === 'mixed'
      ? [0, 0, 0, 1, 1, 1, 2, 2].slice(0, count)
      : Array.from({ length: count }, () => Number(modeTier));

    const seen = new Set();
    const list = [];
    for (const t of tiers) {
      let q = null;
      for (let tries = 0; tries < 30; tries++) {
        const cand = generateQuestion(t, rangeMax, rng);
        const key = `${cand.known[0].v}-${cand.known[1].v}-${cand.a}`;
        if (!seen.has(key)) {
          seen.add(key);
          q = cand;
          break;
        }
      }
      list.push(q || generateQuestion(t, rangeMax, rng));
    }
    return list;
  }

  // Translation helper (safe fallback if I18n not loaded in isolated unit tests)
  function _t(key, vars = {}) {
    if (typeof I18n !== 'undefined' && I18n && typeof I18n.t === 'function') {
      return I18n.t(key, vars);
    }
    return key;
  }

  // Diagnose a Step 1 (step size) guess — returns { ok, code, message }
  function diagnoseStep(q, stepGuess) {
    const c = calc(q);
    if (stepGuess === c.step) {
      return { ok: true, code: 'correct', message: _t('nlDiagStepOk', { step: fmt(c.step) }) };
    }

    // 1. Place-value ×10 / ÷10 / ×100 / ÷100 error (PIKAS Condition #5)
    if (
      stepGuess === c.step * 10 ||
      stepGuess === c.step * 100 ||
      (c.step >= 10 && stepGuess === c.step / 10) ||
      (c.step >= 100 && stepGuess === c.step / 100)
    ) {
      return {
        ok: false,
        code: 'place_value',
        message: _t('nlDiagStepPlaceValue', {
          guess: fmt(stepGuess),
          dist: fmt(c.dist),
          intervals: c.intervals,
        }),
      };
    }

    // 2. Counted ticks instead of gaps: dist / (intervals + 1)
    const wronglyTicks = c.dist / (c.intervals + 1);
    if (Math.abs(stepGuess - wronglyTicks) <= 1) {
      return {
        ok: false,
        code: 'ticks_not_gaps',
        message: _t('nlDiagStepTicks', {
          ticks: c.intervals + 1,
          intervals: c.intervals,
        }),
      };
    }

    // 3. Missed one gap: dist / (intervals - 1)
    if (c.intervals > 1) {
      const wronglyOneLess = c.dist / (c.intervals - 1);
      if (Math.abs(stepGuess - wronglyOneLess) <= 1) {
        return {
          ok: false,
          code: 'missed_gap',
          message: _t('nlDiagStepMissedGap', { intervals: c.intervals }),
        };
      }
    }

    // 4. Entered the full distance instead of one step
    if (stepGuess === c.dist) {
      return {
        ok: false,
        code: 'total_span',
        message: _t('nlDiagStepTotalSpan', {
          dist: fmt(c.dist),
          intervals: c.intervals,
        }),
      };
    }

    // 5. Combined 2 or 3 steps into one
    if (stepGuess === c.step * 2 || stepGuess === c.step * 3) {
      return {
        ok: false,
        code: 'grouped_steps',
        message: _t('nlDiagStepGrouped'),
      };
    }

    // 6. Generic step guidance
    return {
      ok: false,
      code: 'generic',
      message: _t('nlDiagStepGeneric', {
        right: fmt(c.right.v),
        left: fmt(c.left.v),
        dist: fmt(c.dist),
        intervals: c.intervals,
      }),
    };
  }

  // Diagnose a Step 2 (value at A) guess (Step 1 is already known/confirmed)
  function diagnoseValue(q, valueGuess) {
    const c = calc(q);
    if (valueGuess === c.target) {
      return { ok: true, code: 'correct', message: _t('nlDiagValOk', { target: fmt(c.target) }) };
    }

    // 1. Place-value ×10 / ÷10 mistake on A or on the jump offset
    const diff = Math.abs(valueGuess - c.target);
    if (
      valueGuess === c.target * 10 ||
      (c.target >= 10 && valueGuess === c.target / 10) ||
      (diff > 0 && diff === c.step * 10 && Math.abs(q.a - c.left.i) < 10)
    ) {
      return {
        ok: false,
        code: 'place_value',
        message: _t('nlDiagValPlaceValue', {
          guess: fmt(valueGuess),
          step: fmt(c.step),
        }),
      };
    }

    // 2. One step too far
    if (valueGuess === c.target + c.step) {
      return {
        ok: false,
        code: 'one_too_far',
        message: _t('nlDiagValTooFar'),
      };
    }

    // 3. One step too short
    if (valueGuess === c.target - c.step) {
      return {
        ok: false,
        code: 'one_too_short',
        message: _t('nlDiagValTooShort'),
      };
    }

    // 4. Counted from left edge (index 0) instead of interior labelled tick
    if (c.left.i > 0 && valueGuess === c.left.v + q.a * c.step) {
      return {
        ok: false,
        code: 'left_edge_anchor',
        message: _t('nlDiagValLeftEdge', { left: fmt(c.left.v) }),
      };
    }

    // 5. Went in the wrong direction from the anchor (e.g. added when A is left of anchor)
    if (q.a < c.left.i && valueGuess === c.left.v + (c.left.i - q.a) * c.step) {
      return {
        ok: false,
        code: 'wrong_direction',
        message: _t('nlDiagValWrongDirLeft', { left: fmt(c.left.v) }),
      };
    }
    if (q.a < c.right.i && valueGuess === c.right.v + (c.right.i - q.a) * c.step) {
      return {
        ok: false,
        code: 'wrong_direction',
        message: _t('nlDiagValWrongDirBack', { right: fmt(c.right.v) }),
      };
    }

    // 6. Not aligned to step multiples
    if ((valueGuess - c.left.v) % c.step !== 0) {
      return {
        ok: false,
        code: 'not_aligned',
        message: _t('nlDiagValNotAligned', { step: fmt(c.step) }),
      };
    }

    // 7. Generic counting-from-anchor guidance
    const anchor = _bestAnchor(q, c);
    return {
      ok: false,
      code: 'generic',
      message: _t('nlDiagValGeneric', { anchor: fmt(anchor.v) }),
    };
  }

  function _bestAnchor(q, c) {
    if (q.backward) return c.right;
    const distLeft = Math.abs(q.a - c.left.i);
    const distRight = Math.abs(q.a - c.right.i);
    return distRight < distLeft ? c.right : c.left;
  }

  // Build step-by-step worked solution including PIKAS inverse check (Umkehraufgabe)
  function buildWorkedSteps(q) {
    const c = calc(q);
    const anchor = _bestAnchor(q, c);
    const k = Math.abs(q.a - anchor.i);
    const dir = q.a >= anchor.i ? '+' : '−';
    return [
      _t('nlWork1', { right: fmt(c.right.v), left: fmt(c.left.v), dist: fmt(c.dist) }),
      _t('nlWork2', { intervals: c.intervals, dist: fmt(c.dist), step: fmt(c.step) }),
      _t('nlWorkCheck', { intervals: c.intervals, step: fmt(c.step), dist: fmt(c.dist) }),
      _t('nlWork3', { anchor: fmt(anchor.v), k }),
      _t('nlWork4', { anchor: fmt(anchor.v), dir, k, step: fmt(c.step), target: fmt(c.target) }),
      _t('nlWorkDone', { step: fmt(c.step), target: fmt(c.target) }),
    ];
  }

  // Build strictly proportional SVG number line with optional jump arcs and interactive gap counters
  function buildLineSvg(q, opts = {}) {
    const {
      showAll = false,
      showIntervalArcs = false,
      showTargetArcs = false,
      clickedGaps = new Set(),
      interactive = true,
      compact = false,
    } = opts;

    const c = calc(q);
    const vbW = compact ? 460 : 780;
    const x0 = compact ? 42 : 56;
    const x1 = compact ? 418 : 724;
    const stepX = (x1 - x0) / (q.ticks - 1);
    const y = compact ? 98 : 92;
    const arcLift = compact ? 40 : 44;
    const know = new Map(q.known.map(p => [p.i, p.v]));

    // 1. Optional dashed hint arcs between the two labelled numbers (Step 1 hint)
    let hintArcsSvg = '';
    if (showIntervalArcs && !showTargetArcs) {
      const parts = [];
      let num = 1;
      for (let i = c.left.i; i < c.right.i; i++) {
        const gx0 = x0 + i * stepX;
        const gx1 = x0 + (i + 1) * stepX;
        const mid = (gx0 + gx1) / 2;
        parts.push(
          `<path d="M ${gx0 + 2} ${y - 14} Q ${mid} ${y - arcLift} ${gx1 - 2} ${y - 14}" fill="none" stroke="#f7c948" stroke-width="2.5" stroke-dasharray="5 4" opacity="0.9"/>` +
          `<text x="${mid}" y="${y - (compact ? 31 : 34)}" text-anchor="middle" font-size="${compact ? 14 : 13}" font-weight="900" fill="#f7c948">${num}</text>`
        );
        num++;
      }
      hintArcsSvg = `<g class="nl-hint-arcs">${parts.join('')}</g>`;
    }

    // 2. Solution jump arcs from anchor to A (shown on solve/reveal)
    let targetArcsSvg = '';
    if (showTargetArcs) {
      const anchor = _bestAnchor(q, c);
      const from = anchor.i;
      const to = q.a;
      const dir = to >= from ? 1 : -1;
      const count = Math.abs(to - from);
      const showStepOnArc = !compact || stepX >= 68;
      const parts = [];
      for (let s = 0; s < count; s++) {
        const i0 = from + s * dir;
        const i1 = i0 + dir;
        const gx0 = x0 + i0 * stepX;
        const gx1 = x0 + i1 * stepX;
        const mid = (gx0 + gx1) / 2;
        const arcLabel = showStepOnArc ? `${dir > 0 ? '+' : '−'}${fmt(c.step)}` : `${s + 1}`;
        parts.push(
          `<path d="M ${gx0} ${y - 14} Q ${mid} ${y - (compact ? 42 : 46)} ${gx1} ${y - 14}" fill="none" stroke="#2ed573" stroke-width="2.8" stroke-linecap="round"/>` +
          `<text x="${mid}" y="${y - (compact ? 33 : 36)}" text-anchor="middle" font-size="${compact ? 13 : 12}" font-weight="900" fill="#2ed573">${arcLabel}</text>`
        );
      }
      targetArcsSvg = `<g class="nl-solution-arcs">${parts.join('')}</g>`;
    }

    // 3. Interactive clickable gap zones (so Emma can click/tap gaps to count jumps!)
    let interactiveGapsSvg = '';
    if (interactive && !showAll) {
      const sorted = Array.from(clickedGaps).sort((a, b) => a - b);
      const orderMap = new Map(sorted.map((gapIdx, pos) => [gapIdx, pos + 1]));
      const badgeR = compact ? 12 : 11;
      const parts = [];
      for (let i = 0; i < q.ticks - 1; i++) {
        const gx0 = x0 + i * stepX;
        const gx1 = x0 + (i + 1) * stepX;
        const mid = (gx0 + gx1) / 2;
        const isActive = orderMap.has(i);
        const arc = isActive
          ? `<path class="nl-user-arc" d="M ${gx0 + 2} ${y - 13} Q ${mid} ${y - arcLift} ${gx1 - 2} ${y - 13}" fill="none" stroke="#38ef7d" stroke-width="3" stroke-linecap="round"/>` +
            `<circle cx="${mid}" cy="${y - (compact ? 32 : 34)}" r="${badgeR}" fill="#183a2c" stroke="#38ef7d" stroke-width="2"/>` +
            `<text x="${mid}" y="${y - (compact ? 27.5 : 30)}" text-anchor="middle" font-size="${compact ? 13 : 12}" font-weight="900" fill="#38ef7d">${orderMap.get(i)}</text>`
          : `<path class="nl-gap-hover" d="M ${gx0 + 3} ${y - 13} Q ${mid} ${y - 34} ${gx1 - 3} ${y - 13}" fill="none" stroke="rgba(162,155,254,0.35)" stroke-width="2" stroke-dasharray="4 4"/>`;
        parts.push(
          `<g class="nl-gap-hit${isActive ? ' active' : ''}" data-gap="${i}" role="button" tabindex="0" aria-label="${_t('nlGapAria', { n: i + 1 })}">` +
          `<rect x="${gx0 + 1}" y="${y - 52}" width="${Math.max(12, stepX - 2)}" height="${compact ? 84 : 68}" fill="transparent"/>` +
          `${arc}</g>`
        );
      }
      interactiveGapsSvg = `<g class="nl-gaps-layer">${parts.join('')}</g>`;
    }

    // 4. Strictly equidistant ticks (identical height — PIKAS Condition #6)
    const ticksSvg = Array.from({ length: q.ticks }, (_, i) => {
      const x = x0 + i * stepX;
      const isKnown = know.has(i);
      const isA = i === q.a;
      let label = '';

      // Prevent edge labels from clipping on compact mobile viewBox
      let anchor = 'middle';
      let labelX = x;
      if (compact) {
        if (i === 0) { anchor = 'start'; labelX = Math.max(8, x - 28); }
        else if (i === q.ticks - 1) { anchor = 'end'; labelX = Math.min(vbW - 8, x + 28); }
      }

      if (isKnown) {
        label = `<text x="${labelX}" y="${compact ? 144 : 142}" text-anchor="${anchor}" font-size="${compact ? 18.5 : 18}" fill="#f0f0ff" font-weight="900">${fmt(know.get(i))}</text>`;
      } else if (showAll && !isA) {
        const val = c.left.v + (i - c.left.i) * c.step;
        const labelY = compact ? (i % 2 === 0 ? 142 : 162) : 142;
        label = `<text x="${labelX}" y="${labelY}" text-anchor="${anchor}" font-size="${compact ? 12 : 13.5}" fill="#a8b4d4" font-weight="700">${fmt(val)}</text>`;
      }
      if (showAll && isA) {
        const aLabelY = compact ? 166 : 142;
        label = `<text x="${labelX}" y="${aLabelY}" text-anchor="${anchor}" font-size="${compact ? 17.5 : 18}" fill="#f7c948" font-weight="900">${fmt(c.target)}</text>`;
      }
      const stroke = isA ? '#a29bfe' : isKnown ? '#f0f0ff' : '#7b8db5';
      const sw = isA ? '4' : isKnown ? '3.4' : '2.6';
      const tickHalf = compact ? 13 : 12;
      return `<line x1="${x}" y1="${y - tickHalf}" x2="${x}" y2="${y + tickHalf}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round"/>${label}`;
    }).join('');

    const aX = x0 + q.a * stepX;
    const badgeW = compact ? 42 : 40;
    const badgeH = compact ? 36 : 34;
    const badgeCenterX = compact ? Math.min(vbW - 24, Math.max(24, aX)) : aX;
    const lineStart = compact ? 16 : 22;
    const lineEnd = compact ? vbW - 16 : 758;
    const stepCaption = showAll
      ? `<text x="${vbW / 2}" y="${compact ? 190 : 170}" text-anchor="middle" font-size="${compact ? 15.5 : 15}" fill="#2ed573" font-weight="800">${_t('nlSvgOneJump', { step: fmt(c.step) })}</text>`
      : '';

    const titleText = _t('nlSvgTitle', {
      ticks: q.ticks,
      left: fmt(c.left.v),
      right: fmt(c.right.v),
    });

    return (
      `<title>${titleText}</title>` +
      `<line x1="${lineStart}" y1="${y}" x2="${lineEnd}" y2="${y}" stroke="#8fa3cf" stroke-width="3" stroke-linecap="round"/>` +
      `<path d="M${lineEnd - 8} ${y - 6} L${lineEnd + 2} ${y} L${lineEnd - 8} ${y + 6}" fill="none" stroke="#8fa3cf" stroke-width="3" stroke-linecap="round"/>` +
      hintArcsSvg +
      targetArcsSvg +
      interactiveGapsSvg +
      ticksSvg +
      `<line x1="${aX}" y1="${badgeH + 10}" x2="${aX}" y2="${y - 16}" stroke="#a29bfe" stroke-width="2" stroke-dasharray="4 4"/>` +
      `<rect x="${badgeCenterX - badgeW / 2}" y="8" width="${badgeW}" height="${badgeH}" rx="11" fill="#7c63e6"/>` +
      `<text x="${badgeCenterX}" y="${compact ? 33 : 31}" text-anchor="middle" font-size="${compact ? 21 : 20}" fill="#ffffff" font-weight="900">A</text>` +
      stepCaption
    );
  }

  // ---- Interactive Lab State & DOM Controller ----
  const state = {
    mode: 'course',        // 'course' | 'practice'
    practiceTier: 'mixed', // 'mixed' | '0' | '1' | '2'
    rangeMax: 1000000,     // 10000 | 100000 | 1000000
    questions: [],
    index: 0,
    phase: 'step1',        // 'step1' | 'step2' | 'done'
    stepTries: 0,
    valTries: 0,
    usedHint: false,
    stepRevealed: false,
    valRevealed: false,
    firstMistake: { step: false, value: false, placeValue: false },
    results: [],
    clickedGaps: new Set(),
    showIntervalArcs: false,
    inSummary: false,
    summarySaved: false,
    onBack: null,
    initialized: false,
  };

  function getState() { return state; }

  function _$(id) { return document.getElementById(id); }

  function _current() { return state.questions[state.index]; }

  function _getPlayerName() {
    if (typeof Progress !== 'undefined' && Progress && typeof Progress.getAll === 'function') {
      const n = Progress.getAll()?.player?.name;
      if (n && n.trim()) return n.trim();
    }
    const input = _$('input-name');
    return input?.value?.trim() || '';
  }

  function _renderModeControls() {
    const modeBtns = document.querySelectorAll('#screen-numberline .nl-mode-btn');
    modeBtns.forEach(b => b.classList.toggle('active', b.dataset.nlMode === state.mode));

    const practiceRow = _$('nl-practice-controls');
    if (practiceRow) practiceRow.hidden = state.mode !== 'practice';

    document.querySelectorAll('#screen-numberline .nl-tier-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.nlTier === String(state.practiceTier));
    });
    document.querySelectorAll('#screen-numberline .nl-range-btn').forEach(b => {
      b.classList.toggle('active', Number(b.dataset.nlRange) === state.rangeMax);
    });
  }

  function _renderSavedBadge() {
    const badge = _$('nl-saved-stats');
    if (!badge) return;
    if (typeof Progress === 'undefined' || !Progress.getNumberLineStats) {
      badge.hidden = true;
      return;
    }
    const stats = Progress.getNumberLineStats();
    if (!stats || !stats.roundsCompleted) {
      badge.hidden = true;
      return;
    }
    badge.hidden = false;
    badge.textContent = _t('nlSavedBadge', {
      rounds: stats.roundsCompleted,
      best: stats.bestFirstTryScore || 0,
    });
  }

  function _updateLevelDots(tier) {
    for (let i = 0; i < 3; i++) {
      const dot = _$('nl-level-dot-' + i);
      if (!dot) continue;
      dot.className = 'nl-dot' + (tier > i ? ' done' : tier === i ? ' current' : '');
    }
  }

  function _updateGapCounterBar() {
    const bar = _$('nl-gap-bar');
    const countEl = _$('nl-gap-count');
    const clearBtn = _$('nl-gap-clear');
    if (!bar || !countEl || !clearBtn) return;
    if (state.phase === 'done') {
      bar.hidden = true;
      return;
    }
    bar.hidden = false;
    const n = state.clickedGaps.size;
    if (n > 0) {
      countEl.textContent = _t('nlGapsCounted', { n });
      clearBtn.hidden = false;
    } else {
      countEl.textContent = _t('nlGapsPrompt');
      clearBtn.hidden = true;
    }
  }

  function _isCompactViewport() {
    return typeof window !== 'undefined' && typeof window.innerWidth === 'number' && window.innerWidth <= 640;
  }

  function _renderSvg() {
    const svg = _$('nl-svg');
    const q = _current();
    if (!svg || !q) return;
    const compact = _isCompactViewport();
    svg.setAttribute('viewBox', compact ? '0 0 460 198' : '0 0 780 184');
    svg.innerHTML = buildLineSvg(q, {
      showAll: state.phase === 'done',
      showIntervalArcs: state.showIntervalArcs,
      showTargetArcs: state.phase === 'done',
      clickedGaps: state.clickedGaps,
      interactive: state.phase !== 'done',
      compact,
    });
    _updateGapCounterBar();
  }

  function _setFeedback(kind, title, paragraphs) {
    const el = _$('nl-feedback');
    if (!el) return;
    el.className = 'nl-feedback ' + kind;
    el.innerHTML = `<div class="nl-feedback-title">${title}</div>${paragraphs.map(p => `<p>${p}</p>`).join('')}`;
    el.hidden = false;
  }

  function _hideFeedback() {
    const el = _$('nl-feedback');
    if (el) el.hidden = true;
  }

  function _renderStepLocks() {
    const stepField = _$('nl-field-step');
    const valField = _$('nl-field-value');
    const stepInput = _$('nl-step-input');
    const valInput = _$('nl-value-input');
    const stepBadge = _$('nl-step-badge');
    const checkBtn = _$('nl-check-btn');
    const revealStepBtn = _$('nl-reveal-step-btn');
    const revealSolBtn = _$('nl-reveal-solution-btn');
    const q = _current();
    if (!q) return;
    const c = calc(q);

    if (state.phase === 'step1') {
      stepField?.classList.remove('nl-field-done');
      valField?.classList.add('nl-field-locked');
      if (stepInput) { stepInput.disabled = false; }
      if (valInput) { valInput.disabled = true; }
      if (stepBadge) stepBadge.hidden = true;
      if (checkBtn) checkBtn.textContent = _t('nlCheckStep1');
      if (revealStepBtn) revealStepBtn.hidden = state.stepTries < 2;
      if (revealSolBtn) revealSolBtn.hidden = true;
    } else if (state.phase === 'step2') {
      stepField?.classList.add('nl-field-done');
      valField?.classList.remove('nl-field-locked');
      if (stepInput) { stepInput.disabled = true; stepInput.value = fmt(c.step); stepInput.setAttribute('aria-invalid', 'false'); }
      if (valInput) { valInput.disabled = false; }
      if (stepBadge) { stepBadge.hidden = false; stepBadge.textContent = _t('nlStepConfirmed', { step: fmt(c.step) }); }
      if (checkBtn) checkBtn.textContent = _t('nlCheckStep2');
      if (revealStepBtn) revealStepBtn.hidden = true;
      if (revealSolBtn) revealSolBtn.hidden = state.valTries < 2;
    } else {
      // done
      stepField?.classList.add('nl-field-done');
      valField?.classList.remove('nl-field-locked');
      if (stepInput) stepInput.disabled = true;
      if (valInput) valInput.disabled = true;
      if (revealStepBtn) revealStepBtn.hidden = true;
      if (revealSolBtn) revealSolBtn.hidden = true;
    }
  }

  function _renderQuestion() {
    if (state.index >= state.questions.length) {
      _renderSummary();
      return;
    }
    state.inSummary = false;
    const q = _current();
    const total = state.questions.length;

    const exerciseEl = _$('nl-exercise-view');
    const summaryEl = _$('nl-summary-view');
    const sidebarEl = _$('nl-sidebar');
    if (exerciseEl) exerciseEl.hidden = false;
    if (summaryEl) summaryEl.hidden = true;
    if (sidebarEl) sidebarEl.hidden = false;

    const progressText = _$('nl-progress-text');
    const starCount = _$('nl-star-count');
    const progressBar = _$('nl-progress-bar');
    const progressFill = _$('nl-progress-fill');
    const levelLabel = _$('nl-level-label');
    const qTitle = _$('nl-q-title');
    const qSubtitle = _$('nl-q-subtitle');

    const firstCount = state.results.filter(r => r.status === 'first').length;
    if (progressText) progressText.textContent = _t('nlProgress', { current: state.index + 1, total });
    if (starCount) starCount.textContent = _t('nlStarsFirst', { count: firstCount });
    if (progressBar) {
      progressBar.setAttribute('aria-valuemax', String(total));
      progressBar.setAttribute('aria-valuenow', String(state.index));
    }
    if (progressFill) progressFill.style.width = ((100 * state.index) / total) + '%';

    const levelKeys = ['nlLevelBadge0', 'nlLevelBadge1', 'nlLevelBadge2'];
    if (levelLabel) levelLabel.textContent = _t(levelKeys[q.tier] || 'nlLevelBadge0');
    if (qTitle) qTitle.textContent = _t('nlQuestionTitle');
    if (qSubtitle) qSubtitle.textContent = _t(q.subtitleKey || 'nlSubDefault');

    const stepInput = _$('nl-step-input');
    const valInput = _$('nl-value-input');
    if (stepInput) { stepInput.value = ''; stepInput.setAttribute('aria-invalid', 'false'); }
    if (valInput) { valInput.value = ''; valInput.setAttribute('aria-invalid', 'false'); }

    const formEl = _$('nl-answer-form');
    const followEl = _$('nl-follow-actions');
    const tipBox = _$('nl-tip-box');
    const hintBtn = _$('nl-hint-btn');
    if (formEl) formEl.hidden = false;
    if (followEl) followEl.hidden = true;
    if (tipBox) tipBox.hidden = true;
    if (hintBtn) hintBtn.textContent = _t('nlHintBtn');

    _hideFeedback();

    state.phase = 'step1';
    state.stepTries = 0;
    state.valTries = 0;
    state.usedHint = false;
    state.stepRevealed = false;
    state.valRevealed = false;
    state.firstMistake = { step: false, value: false, placeValue: false };
    state.clickedGaps = new Set();
    state.showIntervalArcs = false;

    _updateLevelDots(q.tier);
    _renderStepLocks();
    _renderSvg();
    _renderModeControls();
    _renderSavedBadge();

    if (stepInput && !('ontouchstart' in window && window.innerWidth < 768)) {
      stepInput.focus();
    }
  }

  function _buildHintHtml() {
    const q = _current();
    const c = calc(q);
    if (state.phase === 'step1') {
      return (
        `<strong>${_t('nlHintHeading')}</strong>` +
        `<p>${_t('nlHintStep1Dist', { left: fmt(c.left.v), right: fmt(c.right.v), dist: fmt(c.dist) })}</p>` +
        `<p>${_t('nlHintStep1Gaps', { intervals: c.intervals, dist: fmt(c.dist) })}</p>`
      );
    }
    const anchor = _bestAnchor(q, c);
    const dirKey = q.a >= anchor.i ? 'nlHintStep2Forward' : 'nlHintStep2Backward';
    return (
      `<strong>${_t('nlHintHeading')}</strong>` +
      `<p>${_t(dirKey, { anchor: fmt(anchor.v), step: fmt(c.step) })}</p>`
    );
  }

  function _recordAndFinishQuestion(status) {
    const q = _current();
    state.phase = 'done';
    state.results.push({
      tier: q.tier,
      status,
      usedHint: state.usedHint,
      firstMistake: { ...state.firstMistake },
    });

    const formEl = _$('nl-answer-form');
    const followEl = _$('nl-follow-actions');
    const tipBox = _$('nl-tip-box');
    const starCount = _$('nl-star-count');
    if (formEl) formEl.hidden = true;
    if (followEl) followEl.hidden = false;
    if (tipBox) tipBox.hidden = true;

    const firstCount = state.results.filter(r => r.status === 'first').length;
    if (starCount) starCount.textContent = _t('nlStarsFirst', { count: firstCount });

    _renderStepLocks();
    _renderSvg();

    const nextBtn = _$('nl-next-btn');
    if (nextBtn) {
      nextBtn.textContent = state.index + 1 < state.questions.length
        ? _t('nlNextBtn')
        : _t('nlSeeReportBtn');
      nextBtn.focus();
    }
  }

  function _handleSubmit(e) {
    if (e) e.preventDefault();
    if (state.phase === 'done') return;
    const q = _current();
    if (!q) return;

    const stepInput = _$('nl-step-input');
    const valInput = _$('nl-value-input');

    if (state.phase === 'step1') {
      const guess = parseNumber(stepInput?.value || '');
      if (!Number.isFinite(guess)) {
        stepInput?.setAttribute('aria-invalid', 'true');
        _setFeedback('try', _t('nlErrNumberTitle'), [_t('nlErrNumberBody')]);
        return;
      }
      const diag = diagnoseStep(q, guess);
      if (diag.ok) {
        state.phase = 'step2';
        state.showIntervalArcs = false;
        const tipBox = _$('nl-tip-box');
        const hintBtn = _$('nl-hint-btn');
        if (tipBox) tipBox.hidden = true;
        if (hintBtn) hintBtn.textContent = _t('nlHintBtn');
        _renderStepLocks();
        _renderSvg();
        _setFeedback('step-ok', _t('nlStep1CorrectTitle'), [diag.message, _t('nlNowFindA')]);
        if (valInput) valInput.focus();
        return;
      }

      if (state.stepTries === 0) {
        state.firstMistake.step = true;
        if (diag.code === 'place_value') state.firstMistake.placeValue = true;
      }
      state.stepTries++;
      stepInput?.setAttribute('aria-invalid', 'true');
      const retryNote = state.stepTries >= 2 ? _t('nlRetryOrRevealStep') : _t('nlRetryOnce');
      _setFeedback('try', _t('nlTryTitle'), [diag.message, retryNote]);
      _renderStepLocks();
      return;
    }

    if (state.phase === 'step2') {
      const guess = parseNumber(valInput?.value || '');
      if (!Number.isFinite(guess)) {
        valInput?.setAttribute('aria-invalid', 'true');
        _setFeedback('try', _t('nlErrNumberTitle'), [_t('nlErrNumberBody')]);
        return;
      }
      const diag = diagnoseValue(q, guess);
      if (diag.ok) {
        valInput?.setAttribute('aria-invalid', 'false');
        const isFirst = state.stepTries === 0 && state.valTries === 0 && !state.usedHint && !state.stepRevealed;
        const status = isFirst ? 'first' : 'corrected';
        const title = status === 'first' ? _t('nlGoodFirstTitle') : _t('nlGoodCorrectedTitle');
        _setFeedback('good', title, buildWorkedSteps(q));
        _recordAndFinishQuestion(status);
        return;
      }

      if (state.valTries === 0) {
        state.firstMistake.value = true;
        if (diag.code === 'place_value') state.firstMistake.placeValue = true;
      }
      state.valTries++;
      valInput?.setAttribute('aria-invalid', 'true');
      const retryNote = state.valTries >= 2 ? _t('nlRetryOrSolution') : _t('nlRetryOnce');
      _setFeedback('try', _t('nlTryTitle'), [diag.message, retryNote]);
      _renderStepLocks();
    }
  }

  function _handleRevealStep1() {
    if (state.phase !== 'step1') return;
    const q = _current();
    const c = calc(q);
    state.stepRevealed = true;
    state.phase = 'step2';
    state.showIntervalArcs = false;
    _renderStepLocks();
    _renderSvg();
    _setFeedback('solved', _t('nlStep1RevealedTitle'), [
      _t('nlWork1', { right: fmt(c.right.v), left: fmt(c.left.v), dist: fmt(c.dist) }),
      _t('nlWork2', { intervals: c.intervals, dist: fmt(c.dist), step: fmt(c.step) }),
      _t('nlNowFindA'),
    ]);
    _$('nl-value-input')?.focus();
  }

  function _handleRevealSolution() {
    if (state.phase === 'done') return;
    const q = _current();
    state.valRevealed = true;
    _setFeedback('solved', _t('nlSolvedTitle'), buildWorkedSteps(q));
    _recordAndFinishQuestion('solution');
  }

  function _handleToggleHint() {
    const tipBox = _$('nl-tip-box');
    const hintBtn = _$('nl-hint-btn');
    if (!tipBox || !hintBtn) return;
    state.usedHint = true;
    const willShow = tipBox.hidden;
    if (willShow) {
      tipBox.innerHTML = _buildHintHtml();
      tipBox.hidden = false;
      hintBtn.textContent = _t('nlHintHideBtn');
      if (state.phase === 'step1') {
        state.showIntervalArcs = true;
        _renderSvg();
      }
    } else {
      tipBox.hidden = true;
      hintBtn.textContent = _t('nlHintBtn');
    }
  }

  function _handleNext() {
    if (state.phase !== 'done') return;
    state.index++;
    if (state.index < state.questions.length) {
      _renderQuestion();
      _$('screen-numberline')?.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      _renderSummary();
    }
  }

  function _findWeakestTier() {
    const errs = [0, 0, 0];
    for (const r of state.results) {
      if (r.status !== 'first') errs[r.tier] = (errs[r.tier] || 0) + 1;
    }
    let bestTier = -1;
    let maxErr = 0;
    for (let t = 0; t < 3; t++) {
      if (errs[t] > maxErr) {
        maxErr = errs[t];
        bestTier = t;
      }
    }
    return bestTier;
  }

  function _renderSummary() {
    state.inSummary = true;
    const total = state.questions.length;
    const first = state.results.filter(r => r.status === 'first').length;
    const corrected = state.results.filter(r => r.status === 'corrected').length;
    const shown = state.results.filter(r => r.status === 'solution').length;
    const badStep = state.results.filter(r => r.firstMistake?.step).length;
    const badA = state.results.filter(r => r.firstMistake?.value).length;
    const badPlace = state.results.filter(r => r.firstMistake?.placeValue).length;

    // Persist lightweight isolated progress (once per finished round)
    if (!state.summarySaved && typeof Progress !== 'undefined' && typeof Progress.saveNumberLineRound === 'function') {
      state.summarySaved = true;
      Progress.saveNumberLineRound({
        total,
        firstTry: first,
        corrected,
        shown,
        badStep,
        badA,
      });
    }
    _renderSavedBadge();

    const name = _getPlayerName();
    const greeting = name
      ? _t('nlSummaryGreetingName', { name })
      : _t('nlSummaryGreetingGeneric');

    const advice = [];
    if (badStep > 0) advice.push(_t('nlAdviceStep', { count: badStep }));
    if (badA > 0) advice.push(_t('nlAdviceA', { count: badA }));
    if (badPlace > 0) advice.push(_t('nlAdvicePlaceValue'));
    if (!badStep && !badA) advice.push(_t('nlAdvicePerfect'));

    const weakestTier = _findWeakestTier();
    const weakBtnHtml = weakestTier >= 0
      ? `<button class="nl-btn nl-btn-secondary" type="button" id="nl-practice-weak-btn">${_t('nlPracticeWeakBtn', { level: weakestTier + 1 })}</button>`
      : '';

    const exerciseEl = _$('nl-exercise-view');
    const summaryEl = _$('nl-summary-view');
    const sidebarEl = _$('nl-sidebar');
    if (exerciseEl) exerciseEl.hidden = true;
    if (sidebarEl) sidebarEl.hidden = true;
    if (summaryEl) {
      summaryEl.hidden = false;
      summaryEl.innerHTML = `
        <div class="nl-finish">
          <div class="nl-finish-icon" aria-hidden="true">📐🏆</div>
          <p class="nl-eyebrow">${_t('nlSummaryEyebrow')}</p>
          <h2>${greeting}</h2>
          <p class="nl-finish-intro">${_t('nlSummaryIntro', { total })}</p>
          <div class="nl-summary-grid">
            <div class="nl-summary-stat"><b>${first}</b><span>${_t('nlStatFirst')}</span></div>
            <div class="nl-summary-stat"><b>${corrected}</b><span>${_t('nlStatCorrected')}</span></div>
            <div class="nl-summary-stat"><b>${shown}</b><span>${_t('nlStatSolution')}</span></div>
          </div>
          <div class="nl-summary-advice">
            <strong>${_t('nlReportTitle')}</strong>
            ${advice.map(p => `<p>${p}</p>`).join('')}
            <p class="nl-advice-next">${_t('nlAdviceKeepGoing')}</p>
          </div>
          <div class="nl-actions nl-actions-center">
            <button class="nl-btn nl-btn-primary" type="button" id="nl-restart-btn">${_t('nlRestartBtn')}</button>
            <button class="nl-btn nl-btn-secondary" type="button" id="nl-fresh-btn">${_t('nlFreshBtn')}</button>
            ${weakBtnHtml}
            <button class="nl-btn nl-btn-quiet" type="button" id="nl-print-btn">${_t('nlPrintBtn')}</button>
          </div>
        </div>
      `;

      _$('nl-restart-btn')?.addEventListener('click', () => {
        if (state.mode === 'course') startCourse();
        else startPractice(state.practiceTier, state.rangeMax);
      });
      _$('nl-fresh-btn')?.addEventListener('click', () => {
        startPractice('mixed', state.rangeMax);
      });
      _$('nl-practice-weak-btn')?.addEventListener('click', () => {
        startPractice(String(weakestTier), state.rangeMax);
      });
      _$('nl-print-btn')?.addEventListener('click', () => window.print());
    }

    _$('screen-numberline')?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function startCourse() {
    state.mode = 'course';
    state.questions = CURATED_QUESTIONS.map(q => ({ ...q, known: q.known.map(p => ({ ...p })) }));
    state.index = 0;
    state.results = [];
    state.summarySaved = false;
    _renderQuestion();
  }

  function startPractice(tier = 'mixed', rangeMax = 1000000) {
    state.mode = 'practice';
    state.practiceTier = String(tier);
    state.rangeMax = RANGE_CONFIGS[rangeMax] ? Number(rangeMax) : 1000000;
    state.questions = generateRound(state.practiceTier, state.rangeMax, 8);
    state.index = 0;
    state.results = [];
    state.summarySaved = false;
    _renderQuestion();
  }

  function open(onBack) {
    state.onBack = onBack || state.onBack;
    if (!state.initialized) init();
    if (!state.questions.length || state.inSummary) {
      startCourse();
    } else {
      _renderSavedBadge();
      _renderModeControls();
    }
  }

  function refreshLanguage() {
    if (!state.initialized || !state.questions.length) return;
    if (state.inSummary) {
      _renderSummary();
    } else {
      // Re-render current labels without wiping current inputs/tries
      const q = _current();
      if (!q) return;
      const total = state.questions.length;
      const firstCount = state.results.filter(r => r.status === 'first').length;
      const progressText = _$('nl-progress-text');
      const starCount = _$('nl-star-count');
      const levelLabel = _$('nl-level-label');
      const qTitle = _$('nl-q-title');
      const qSubtitle = _$('nl-q-subtitle');
      const levelKeys = ['nlLevelBadge0', 'nlLevelBadge1', 'nlLevelBadge2'];
      if (progressText) progressText.textContent = _t('nlProgress', { current: state.index + 1, total });
      if (starCount) starCount.textContent = _t('nlStarsFirst', { count: firstCount });
      if (levelLabel) levelLabel.textContent = _t(levelKeys[q.tier] || 'nlLevelBadge0');
      if (qTitle) qTitle.textContent = _t('nlQuestionTitle');
      if (qSubtitle) qSubtitle.textContent = _t(q.subtitleKey || 'nlSubDefault');
      _renderStepLocks();
      _renderSvg();
      _renderSavedBadge();
    }
  }

  function init() {
    if (state.initialized) return;
    state.initialized = true;

    _$('nl-back-btn')?.addEventListener('click', () => {
      if (typeof state.onBack === 'function') state.onBack();
    });

    _$('nl-answer-form')?.addEventListener('submit', _handleSubmit);
    _$('nl-hint-btn')?.addEventListener('click', _handleToggleHint);
    _$('nl-reveal-step-btn')?.addEventListener('click', _handleRevealStep1);
    _$('nl-reveal-solution-btn')?.addEventListener('click', _handleRevealSolution);
    _$('nl-next-btn')?.addEventListener('click', _handleNext);

    _$('nl-gap-clear')?.addEventListener('click', () => {
      state.clickedGaps.clear();
      _renderSvg();
    });

    // Click or keyboard-activate a gap on the SVG to count jumps
    const svg = _$('nl-svg');
    if (svg) {
      const toggleGapFromEvent = (target) => {
        if (state.phase === 'done') return;
        const g = target.closest?.('.nl-gap-hit');
        if (!g) return;
        const idx = Number(g.dataset.gap);
        if (!Number.isInteger(idx)) return;
        if (state.clickedGaps.has(idx)) state.clickedGaps.delete(idx);
        else state.clickedGaps.add(idx);
        _renderSvg();
      };
      svg.addEventListener('click', (e) => toggleGapFromEvent(e.target));
      svg.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleGapFromEvent(e.target);
        }
      });
    }

    // Mode switcher (Curated Course vs Procedural Practice)
    document.querySelectorAll('#screen-numberline .nl-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.nlMode === 'course') startCourse();
        else startPractice(state.practiceTier, state.rangeMax);
      });
    });

    // Practice tier selector
    document.querySelectorAll('#screen-numberline .nl-tier-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        startPractice(btn.dataset.nlTier, state.rangeMax);
      });
    });

    // Discrete PIKAS number range selector (10 000 / 100 000 / 1 000 000)
    document.querySelectorAll('#screen-numberline .nl-range-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        startPractice(state.practiceTier, Number(btn.dataset.nlRange));
      });
    });

    // Mobile collapsible Strategy Box (Trickkiste) toggle
    const trickToggle = _$('nl-trick-toggle');
    const sidebar = _$('nl-sidebar');
    if (trickToggle && sidebar) {
      trickToggle.addEventListener('click', () => {
        const isOpen = sidebar.classList.toggle('nl-sidebar-open');
        trickToggle.classList.toggle('active', isOpen);
        trickToggle.setAttribute('aria-expanded', String(isOpen));
      });
    }

    // Adapt SVG viewBox cleanly when rotating phone or resizing across 640px
    let lastCompact = _isCompactViewport();
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('resize', () => {
        const nowCompact = _isCompactViewport();
        if (nowCompact !== lastCompact) {
          lastCompact = nowCompact;
          _renderSvg();
        }
      });
    }
  }

  return {
    CURATED_QUESTIONS,
    RANGE_CONFIGS,
    CLEAN_INTERVALS,
    fmt,
    parseNumber,
    calc,
    assertQuestion,
    generateQuestion,
    generateRound,
    diagnoseStep,
    diagnoseValue,
    buildWorkedSteps,
    buildLineSvg,
    init,
    open,
    startCourse,
    startPractice,
    refreshLanguage,
    getState,
  };
})();
