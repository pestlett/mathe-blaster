// Klasse 4 Lab 1: Stellenwert-Labor (Place Value, Bundling & Plättchen)
// PIKAS Grade 4: Stellenwerttafel (M–E), Bündeln/Entbündeln, Zerlegungsaufgaben, Plättchen verschieben.

const PlaceValueLab = (() => {
  'use strict';

  const COLS = [
    { key: 'M',  val: 1000000 },
    { key: 'HT', val: 100000 },
    { key: 'ZT', val: 10000 },
    { key: 'T',  val: 1000 },
    { key: 'H',  val: 100 },
    { key: 'Z',  val: 10 },
    { key: 'E',  val: 1 },
  ];

  function digitsOf(n) {
    return COLS.map(c => Math.floor(n / c.val) % 10);
  }

  function activeColsForRange(range) {
    if (range <= 10000) return COLS.slice(2); // ZT..E
    if (range <= 100000) return COLS.slice(1); // HT..E
    return COLS; // M..E
  }

  // German number word generator (exact primary-school spelling up to 1 000 000)
  const ONES = ['', 'ein', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun'];
  const TEENS = ['zehn', 'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn'];
  const TENS = ['', 'zehn', 'zwanzig', 'dreißig', 'vierzig', 'fünfzig', 'sechzig', 'siebzig', 'achtzig', 'neunzig'];

  function under1000De(n) {
    if (n === 0) return '';
    let out = '';
    const h = Math.floor(n / 100);
    const rem = n % 100;
    if (h > 0) out += ONES[h] + 'hundert';
    if (rem === 1) out += 'eins';
    else if (rem > 1 && rem < 10) out += ONES[rem];
    else if (rem >= 10 && rem < 20) out += TEENS[rem - 10];
    else if (rem >= 20) {
      const o = rem % 10;
      const t = Math.floor(rem / 10);
      out += (o > 0 ? ONES[o] + 'und' : '') + TENS[t];
    }
    return out;
  }

  function numberToGermanWord(n) {
    if (n === 0) return 'null';
    if (n === 1000000) return 'eine Million';
    const th = Math.floor(n / 1000);
    const lo = n % 1000;
    let s = '';
    if (th > 0) {
      s += (th === 1 ? 'ein' : under1000De(th).replace(/eins$/, 'ein')) + 'tausend';
    }
    if (lo > 0) s += under1000De(lo);
    return s;
  }

  function expandedForm(n) {
    const parts = [];
    COLS.forEach(c => {
      const d = Math.floor(n / c.val) % 10;
      if (d > 0) parts.push(LabHost.fmtNum(d * c.val));
    });
    return parts.join(' + ');
  }

  // ---- Curated Course (8 tasks, 3 tiers) ----
  function buildCourse() {
    return [
      makeReadTask(403050, 1000000, 'word'),
      makeReadTask(720408, 1000000, 'expanded'),
      makeReadTask(50809, 100000, 'table'),
      makeBundleTask({ T: 4, H: 15, Z: 3, E: 6 }, 100000),
      makeBundleTask({ ZT: 3, T: 12, H: 14, Z: 0, E: 5 }, 100000),
      makeBundleTask({ HT: 2, ZT: 13, T: 0, H: 25, Z: 4, E: 0 }, 1000000),
      makeShiftTask(35420, 'T', 'ZT', 100000),
      makeShiftTask(240630, 'H', 'HT', 1000000),
    ];
  }

  function makeReadTask(n, range, variant) {
    const t = LabHost.t;
    const promptKey = variant === 'word'
      ? 'pvPromptWord'
      : variant === 'expanded'
      ? 'pvPromptExpanded'
      : 'pvPromptTable';
    const word = numberToGermanWord(n);
    const exp = expandedForm(n);
    return {
      tier: 0,
      kind: 'read',
      variant,
      range,
      answer: n,
      word,
      exp,
      counts: digitsOf(n),
      prompt: t(promptKey, { word, exp },
        variant === 'word' ? `Write as a number: "${word}"`
        : variant === 'expanded' ? `Combine into one number: ${exp}`
        : 'Read the number from the place-value table.'),
      subtitle: t('pvSubZeroHint', null, 'Watch out for empty columns — write a 0 for every empty place!'),
      fields: [{ id: 'ans', label: t('pvInputLabel', null, 'Number:'), placeholder: 'e.g. 403 050' }],
    };
  }

  function makeBundleTask(colMap, range) {
    const t = LabHost.t;
    const counts = COLS.map(c => colMap[c.key] || 0);
    let total = 0;
    const terms = [];
    COLS.forEach((c, i) => {
      if (counts[i] > 0) {
        total += counts[i] * c.val;
        terms.push(`${counts[i]} ${c.key}`);
      }
    });
    const expr = terms.join(' + ');
    return {
      tier: 1,
      kind: 'bundle',
      range,
      answer: total,
      counts,
      expr,
      prompt: t('pvPromptBundle', { expr }, `Bundle into one number: ${expr}`),
      subtitle: t('pvSubBundle', null, 'Whenever a column has 10 or more, tap "Bundle 10 → 1" to trade up!'),
      fields: [{ id: 'ans', label: t('pvInputLabel', null, 'Number:'), placeholder: 'e.g. 5 536' }],
    };
  }

  function makeShiftTask(base, fromKey, toKey, range) {
    const t = LabHost.t;
    const fromCol = COLS.find(c => c.key === fromKey);
    const toCol = COLS.find(c => c.key === toKey);
    const delta = toCol.val - fromCol.val;
    const answer = base + delta;
    return {
      tier: 2,
      kind: 'shift',
      range,
      base,
      fromKey,
      toKey,
      delta,
      answer,
      counts: digitsOf(base),
      prompt: t('pvPromptShift', {
        base: LabHost.fmtNum(base),
        from: fromKey,
        to: toKey,
      }, `Start with ${LabHost.fmtNum(base)}. Move 1 counter from ${fromKey} to ${toKey}. What is the new number?`),
      subtitle: t('pvSubShift', null, 'You can test the move directly in the place-value table below!'),
      fields: [{ id: 'ans', label: t('pvNewNumberLabel', null, 'New number:'), placeholder: 'e.g. 44 420' }],
    };
  }

  // ---- Procedural Generator ----
  function randomWithZero(range) {
    const max = range - 1;
    const min = Math.floor(range / 10);
    let n = LabHost.randInt(min, max);
    // Guarantee at least one interior zero for pedagogical value
    const s = String(n).split('');
    const zeroPos = LabHost.randInt(1, s.length - 2);
    s[zeroPos] = '0';
    return parseInt(s.join(''), 10);
  }

  function genTask(tier, range) {
    if (tier === 0) {
      const n = randomWithZero(range);
      const variant = LabHost.pick(['word', 'expanded', 'table']);
      return makeReadTask(n, range, variant);
    }
    if (tier === 1) {
      const cols = activeColsForRange(range);
      // cols[0] has val === range (e.g. ZT for 10 000); keep bundled sum strictly < range
      const subCols = cols.slice(1);
      const map = {};
      const overflowIdx = LabHost.randInt(1, subCols.length - 2);
      subCols.forEach((c, idx) => {
        if (idx === overflowIdx) {
          map[c.key] = LabHost.randInt(12, 24);
        } else if (idx === 0) {
          map[c.key] = LabHost.randInt(1, 6);
        } else if (Math.random() < 0.65) {
          map[c.key] = LabHost.randInt(1, 12);
        }
      });
      // Guarantee bundled total stays strictly within range
      let tot = 0;
      COLS.forEach(c => { tot += (map[c.key] || 0) * c.val; });
      if (tot >= range) map[subCols[0].key] = 1;
      return makeBundleTask(map, range);
    }
    // Tier 2: Plättchen shift
    const cols = activeColsForRange(range);
    const base = randomWithZero(range);
    const d = digitsOf(base);
    // Find columns that have at least 1 counter and a target column with <= 8 counters
    const nonZeroCols = cols.filter(c => {
      const idx = COLS.indexOf(c);
      return d[idx] >= 1;
    });
    const fromCol = LabHost.pick(nonZeroCols);
    const targetCandidates = cols.filter(c => {
      const idx = COLS.indexOf(c);
      return c.key !== fromCol.key && d[idx] <= 8 && (base + c.val - fromCol.val) > 0 && (base + c.val - fromCol.val) < range;
    });
    const toCol = LabHost.pick(targetCandidates.length ? targetCandidates : [cols[cols.length - 1]]);
    return makeShiftTask(base, fromCol.key, toCol.key, range);
  }

  function buildRound({ mode, tier, range }) {
    if (mode === 'course') return buildCourse();
    const r = range || 100000;
    const tiers = tier === 'mixed' ? [0, 0, 1, 1, 1, 2, 2, 2] : Array(8).fill(tier);
    return tiers.map(ti => genTask(ti, r));
  }

  // ---- Interactive Stellenwerttafel Visual ----
  function renderVisual(container, task, state, h) {
    const cols = activeColsForRange(task.range);
    const offset = COLS.length - cols.length;

    if (!state.customState.counts) {
      state.customState.counts = task.counts.slice();
    }
    const counts = state.customState.counts;

    const showBanner = task.kind === 'read' && (task.variant === 'word' || task.variant === 'expanded');
    let html = '';
    if (showBanner) {
      html += `<div class="pv-prompt-card">${task.variant === 'word' ? h.esc(task.word) : h.esc(task.exp)}</div>`;
    }
    if (task.kind === 'bundle') {
      html += `<div class="pv-prompt-card">${h.esc(task.expr)}</div>`;
    }

    const interactive = (task.kind === 'bundle' || task.kind === 'shift' || task.variant !== 'table') && !state.solved;
    const hideDots = task.kind === 'read' && (task.variant === 'word' || task.variant === 'expanded') && !state.showHintVisual && !state.showSolutionVisual;

    if (!hideDots) {
      html += `<table class="pv-table" aria-label="Place value table"><thead><tr>`;
      cols.forEach((c, ci) => {
        const hi = (task.kind === 'shift' && (c.key === task.fromKey || c.key === task.toKey)) ||
                   (counts[offset + ci] >= 10);
        html += `<th class="${hi ? 'pv-col-hi' : ''}">${c.key}</th>`;
      });
      html += `</tr></thead><tbody>`;

      // Digit / count row
      html += `<tr>`;
      cols.forEach((c, ci) => {
        const cnt = counts[offset + ci];
        html += `<td class="pv-digit-cell">${cnt}</td>`;
      });
      html += `</tr>`;

      // Plättchen row
      html += `<tr>`;
      cols.forEach((c, ci) => {
        const gIdx = offset + ci;
        const cnt = counts[gIdx];
        const dots = [];
        const visibleDots = Math.min(cnt, 20);
        for (let k = 0; k < visibleDots; k++) {
          dots.push(`<span class="pv-dot ${cnt >= 10 ? 'pv-dot-overflow' : ''}"></span>`);
        }
        const extra = cnt > 20 ? `<span style="font-size:0.72rem;color:#ffd166">+${cnt - 20}</span>` : '';
        html += `<td class="pv-dots-cell" data-col-idx="${gIdx}">
          <div class="pv-dots-wrap">${dots.join('')}${extra}</div>
          ${interactive ? `<div class="pv-col-btns">
            <button type="button" class="pv-mini-btn" data-act="dec" data-idx="${gIdx}" aria-label="Remove counter from ${c.key}">−</button>
            <button type="button" class="pv-mini-btn" data-act="inc" data-idx="${gIdx}" aria-label="Add counter to ${c.key}">+</button>
          </div>` : ''}
        </td>`;
      });
      html += `</tr></tbody></table>`;

      // Helper bar with Bundle 10 -> 1 button & Reset button
      const hasOverflow = counts.some((cnt, i) => cnt >= 10 && i > 0);
      if (interactive) {
        html += `<div class="lh-helper-bar">
          <span>${h.esc(h.t('pvTableHelper', null, 'Tap + / − to test counters in the table'))}</span>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            ${hasOverflow ? `<button type="button" class="nl-chip-btn active" id="pv-bundle-btn">${h.esc(h.t('pvBundleBtn', null, '✨ Bundle 10 → 1'))}</button>` : ''}
            <button type="button" class="nl-chip-btn" id="pv-reset-btn">${h.esc(h.t('nlGapsClear', null, '↺ Reset'))}</button>
          </div>
        </div>`;
      }
    }

    container.innerHTML = html;

    container.querySelectorAll('.pv-mini-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx, 10);
        if (btn.dataset.act === 'inc' && counts[idx] < 30) counts[idx] += 1;
        if (btn.dataset.act === 'dec' && counts[idx] > 0) counts[idx] -= 1;
        h.redraw();
      });
    });

    const bundleBtn = container.querySelector('#pv-bundle-btn');
    if (bundleBtn) {
      bundleBtn.addEventListener('click', () => {
        for (let i = counts.length - 1; i > 0; i--) {
          if (counts[i] >= 10) {
            counts[i] -= 10;
            counts[i - 1] += 1;
            break;
          }
        }
        h.redraw();
      });
    }

    const resetBtn = container.querySelector('#pv-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        state.customState.counts = task.counts.slice();
        h.redraw();
      });
    }
  }

  // ---- Diagnostic Error Engine ----
  function checkAnswer(task, submission, state, h) {
    const val = h.parseNum(submission.values.ans);
    if (isNaN(val)) {
      return { empty: true, title: h.t('labEmptyTitle', null, 'Enter a number first') };
    }
    if (val === task.answer) {
      return {
        ok: true,
        title: h.t('pvGoodTitle', null, 'Spot on!'),
        message: h.t('pvGoodMsg', { ans: h.fmtNum(task.answer) }, `<strong>${h.fmtNum(task.answer)}</strong> sits cleanly in the place-value table.`),
      };
    }

    const ansStr = String(task.answer);
    const valStr = String(val);

    // 1. Missing interior zeros (e.g. 403050 -> 4350 or 43050)
    if (ansStr.includes('0') && valStr.replace(/0/g, '') === ansStr.replace(/0/g, '') && valStr.length < ansStr.length) {
      return {
        ok: false,
        category: 'missing_zero',
        showHintVisual: true,
        title: h.t('pvErrZeroTitle', null, 'A zero placeholder is missing!'),
        message: h.t('pvErrZeroMsg', null, 'Every empty column in the place-value table still needs a <b>0</b> so the bigger digits stay in the right place.'),
        tip: h.t('pvErrZeroTip', null, 'Check each column from left to right (HT · ZT · T · H · Z · E) and write 0 for any empty column.'),
      };
    }

    // 2. German Zahlendreher (last 2 digits swapped, e.g. 47 vs 74)
    if (ansStr.length === valStr.length && ansStr.length >= 2) {
      const swapped = ansStr.slice(0, -2) + ansStr[ansStr.length - 1] + ansStr[ansStr.length - 2];
      if (valStr === swapped) {
        return {
          ok: false,
          category: 'zahlendreher',
          title: h.t('pvErrSwapTitle', null, 'Careful — tens and ones are swapped!'),
          message: h.t('pvErrSwapMsg', null, 'In German we speak the ones before the tens ("vier-und-siebzig" = 74), but we write <b>tens first, ones last</b>.'),
        };
      }
    }

    // 3. Unbundled concatenation (e.g. 4 T + 15 H + 3 Z + 6 E -> 41536)
    if (task.kind === 'bundle') {
      const concat = parseInt(task.counts.filter(c => c > 0).join(''), 10);
      if (val === concat) {
        return {
          ok: false,
          category: 'unbundled_concat',
          showHintVisual: true,
          title: h.t('pvErrBundleTitle', null, 'Remember to bundle 10 into the next column!'),
          message: h.t('pvErrBundleMsg', null, 'Only a single digit (0–9) fits in each place-value column. Trade every group of 10 into 1 counter in the column to the left.'),
        };
      }
    }

    // 4. Shifted in opposite direction on Tier 2
    if (task.kind === 'shift' && val === task.base - task.delta) {
      return {
        ok: false,
        category: 'wrong_shift_dir',
        showHintVisual: true,
        title: h.t('pvErrShiftDirTitle', null, 'Check which direction the counter moved!'),
        message: h.t('pvErrShiftDirMsg', { from: task.fromKey, to: task.toKey }, `Take 1 away from <b>${task.fromKey}</b> and add 1 to <b>${task.toKey}</b>.`),
      };
    }

    // 5. Off by 10x / /10
    if (val === task.answer * 10 || val * 10 === task.answer) {
      return {
        ok: false,
        category: 'scale_10x',
        showHintVisual: true,
        title: h.t('pvErrScaleTitle', null, 'Shifted by one column (×10 or ÷10)!'),
        message: h.t('pvErrScaleMsg', null, 'Count the zeros carefully — one column left multiplies by 10, one column right divides by 10.'),
      };
    }

    return {
      ok: false,
      category: 'general',
      showHintVisual: true,
      title: h.t('labTryAgainTitle', null, 'Not quite yet — check the table!'),
      message: h.t('pvErrGeneral', null, 'Look at each column in the place-value table and check every digit from left to right.'),
    };
  }

  function getHint(task, state, level, h) {
    if (task.kind === 'bundle') {
      return {
        title: h.t('labHintTitle', null, '💡 Hint'),
        html: h.t('pvHintBundle', null, 'Tap the glowing <b>Bundle 10 → 1</b> button until every column holds a number from 0 to 9, then read the digits left to right!'),
      };
    }
    if (task.kind === 'shift') {
      const sign = task.delta >= 0 ? '+' : '−';
      return {
        title: h.t('labHintTitle', null, '💡 Hint'),
        html: h.t('pvHintShift', {
          from: task.fromKey,
          to: task.toKey,
          diff: `${sign}${h.fmtNum(Math.abs(task.delta))}`,
        }, `Moving 1 counter from <b>${task.fromKey}</b> to <b>${task.toKey}</b> changes the number by <b>${sign}${h.fmtNum(Math.abs(task.delta))}</b>.`),
      };
    }
    const cols = activeColsForRange(task.range);
    const d = digitsOf(task.answer);
    const offset = COLS.length - cols.length;
    const summary = cols.map((c, i) => `${d[offset + i]} ${c.key}`).join(' · ');
    return {
      title: h.t('labHintTitle', null, '💡 Hint'),
      html: level >= 2
        ? h.t('pvHintDigits', { summary }, `Place-value columns: <b>${summary}</b>`)
        : h.t('pvHintZero', null, 'Fill every column from left to right. Any empty column gets a <b>0</b>!'),
    };
  }

  function getSolution(task, state, h) {
    const exp = expandedForm(task.answer);
    const probe = task.kind === 'shift'
      ? `${h.fmtNum(task.base)} ${task.delta >= 0 ? '+' : '−'} ${h.fmtNum(Math.abs(task.delta))} = <b>${h.fmtNum(task.answer)}</b>`
      : `${exp} = <b>${h.fmtNum(task.answer)}</b>`;
    return {
      html: `<div>${h.t('pvSolExpanded', { probe }, `Step-by-step: ${probe}`)}</div>
             <div>${h.t('pvSolWord', { word: numberToGermanWord(task.answer) }, `Number word: <em>${numberToGermanWord(task.answer)}</em>`)}</div>`,
    };
  }

  function getTrickkiste(task, state, h) {
    return {
      heading: h.t('pvTrickHeading', null, 'The 10-for-1 Bundling Rule:'),
      formulaHtml: h.t('pvTrickFormula', null, '10 E = 1 Z · 10 Z = 1 H<br>10 H = 1 T · 10 T = 1 ZT'),
      descHtml: h.t('pvTrickDesc', null, 'Each column holds <b>0 to 9</b>. Never leave an empty middle column blank — write a <b>0</b>!'),
      miniSvgHtml: `<svg viewBox="0 0 218 58" role="img" aria-label="Place value bundling 10 H equals 1 T">
        <rect x="8" y="8" width="90" height="42" rx="8" fill="rgba(255,107,107,0.18)" stroke="#ff6b6b"/>
        <text x="53" y="25" fill="#ffd166" font-size="11" font-weight="800" text-anchor="middle">10 H</text>
        <text x="53" y="42" fill="#fff" font-size="12" font-weight="900" text-anchor="middle">1 000</text>
        <text x="109" y="34" fill="#38ef7d" font-size="16" font-weight="900" text-anchor="middle">→</text>
        <rect x="120" y="8" width="90" height="42" rx="8" fill="rgba(56,239,125,0.18)" stroke="#38ef7d"/>
        <text x="165" y="25" fill="#7ef9ae" font-size="11" font-weight="800" text-anchor="middle">1 T</text>
        <text x="165" y="42" fill="#fff" font-size="12" font-weight="900" text-anchor="middle">1 000</text>
      </svg>`,
      miniDesc: h.t('pvMiniDesc', null, '10 in one column → 1 on the left ✅'),
      asideTipHtml: h.t('pvAsideTip', null, 'Tip: Say the thousands group first, then the last three digits — and check every zero!'),
    };
  }

  const def = {
    id: 'placevalue',
    chapter: 1,
    prefix: 'pv',
    icon: '🧱',
    roundSize: 8,
    ranges: [10000, 100000, 1000000],
    defaultRange: 100000,
    levels: [
      { id: 0, labelKey: 'pvTier0', chipKey: 'pvChip0' },
      { id: 1, labelKey: 'pvTier1', chipKey: 'pvChip1' },
      { id: 2, labelKey: 'pvTier2', chipKey: 'pvChip2' },
    ],
    buildRound,
    renderVisual,
    checkAnswer,
    getHint,
    getSolution,
    getTrickkiste,
    // Helpers exposed for unit testing
    numberToGermanWord,
    expandedForm,
    makeReadTask,
    makeBundleTask,
    makeShiftTask,
  };

  if (typeof LabHost !== 'undefined' && LabHost.register) LabHost.register(def);
  return def;
})();
