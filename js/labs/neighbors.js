// Klasse 4 Lab 2: Nachbar- & Ordnungs-Labor (Comparing, Ordering, Place-Value Neighbors & Sequences)
// PIKAS Grade 4: Vergleichen (<, =, >), Ordnen, Nachbarzahlen (V/N, VZ/NZ, VH/NH, VT/NT, VZT/NZT, VHT/NHT), Zahlenfolgen.

const NeighborsLab = (() => {
  'use strict';

  const NEIGHBOR_TYPES = [
    { key: 'E',  step: 1,      left: 'V',   right: 'N' },
    { key: 'Z',  step: 10,     left: 'VZ',  right: 'NZ' },
    { key: 'H',  step: 100,    left: 'VH',  right: 'NH' },
    { key: 'T',  step: 1000,   left: 'VT',  right: 'NT' },
    { key: 'ZT', step: 10000,  left: 'VZT', right: 'NZT' },
    { key: 'HT', step: 100000, left: 'VHT', right: 'NHT' },
  ];

  function computeNeighbors(n, step) {
    if (step === 1) return { left: n - 1, right: n + 1 };
    const rem = n % step;
    if (rem === 0) return { left: n - step, right: n + step };
    return { left: n - rem, right: n - rem + step };
  }

  function makeCompareTask(a, b, range) {
    const t = LabHost.t;
    const answer = a < b ? '<' : a > b ? '>' : '=';
    return {
      tier: 0,
      kind: 'compare',
      range,
      a,
      b,
      answer,
      hideSubmitBtn: true,
      prompt: t('nbPromptCompare', null, 'Which sign belongs between the two numbers?'),
      subtitle: t('nbSubCompare', null, 'Count the digits first! More digits always means a bigger number.'),
    };
  }

  function makeOrderTask(nums, range) {
    const t = LabHost.t;
    const sorted = nums.slice().sort((x, y) => x - y);
    return {
      tier: 0,
      kind: 'order',
      range,
      nums: LabHost.shuffle(nums),
      answer: sorted,
      prompt: t('nbPromptOrder', null, 'Order the numbers from smallest to largest!'),
      subtitle: t('nbSubOrder', null, 'Tap the number cards in order from smallest to largest.'),
    };
  }

  function makeNeighborTask(n, typeKey, range, tier) {
    const t = LabHost.t;
    const nt = NEIGHBOR_TYPES.find(x => x.key === typeKey) || NEIGHBOR_TYPES[3];
    const { left, right } = computeNeighbors(n, nt.step);
    return {
      tier: tier != null ? tier : 1,
      kind: 'neighbor',
      twoStep: true,
      range,
      n,
      nt,
      left,
      right,
      prompt: t('nbPromptNeighbor', {
        left: nt.left,
        right: nt.right,
        n: LabHost.fmtNum(n),
      }, `Find ${nt.left} and ${nt.right} for ${LabHost.fmtNum(n)}.`),
      subtitle: t('nbSubNeighbor', { step: LabHost.fmtNum(nt.step) }, `Both neighbors are multiples of ${LabHost.fmtNum(nt.step)} (all smaller places are 0).`),
      fields: [
        { id: 'left',  label: t('nbLeftLabel', { label: nt.left }, `1. Smaller neighbor (${nt.left}):`), placeholder: LabHost.fmtNum(left) },
        { id: 'right', label: t('nbRightLabel', { label: nt.right }, `2. Bigger neighbor (${nt.right}):`), placeholder: LabHost.fmtNum(right) },
      ],
    };
  }

  function makeSequenceTask(start, delta, range) {
    const t = LabHost.t;
    const shown = [start, start + delta, start + 2 * delta, start + 3 * delta];
    const answer = start + 4 * delta;
    return {
      tier: 2,
      kind: 'sequence',
      range,
      shown,
      delta,
      answer,
      prompt: t('nbPromptSeq', null, 'Continue the number sequence! What comes next?'),
      subtitle: t('nbSubSeq', null, 'Spot the constant step between neighbors first, then jump across the boundary.'),
      fields: [{ id: 'ans', label: t('nbSeqLabel', null, 'Next number:'), placeholder: '' }],
    };
  }

  function buildCourse() {
    return [
      makeCompareTask(98765, 100002, 1000000),
      makeOrderTask([45090, 40590, 45900, 9980], 100000),
      makeNeighborTask(43267, 'T', 100000, 1),
      makeNeighborTask(68450, 'ZT', 100000, 1),
      makeNeighborTask(512380, 'HT', 1000000, 1),
      makeNeighborTask(100000, 'E', 1000000, 2),
      makeNeighborTask(40000, 'T', 100000, 2),
      makeSequenceTask(99700, 100, 1000000),
    ];
  }

  function genTask(tier, range) {
    if (tier === 0) {
      if (Math.random() < 0.55) {
        // Intentionally mix a digit-count trap sometimes!
        if (Math.random() < 0.45) {
          const smaller = LabHost.randInt(Math.floor(range / 10) - 2000, Math.floor(range / 10) - 1);
          const bigger = Math.floor(range / 10) + LabHost.randInt(1, 500);
          return Math.random() < 0.5 ? makeCompareTask(smaller, bigger, range) : makeCompareTask(bigger, smaller, range);
        }
        const base = LabHost.randInt(Math.floor(range / 10), range - 1000);
        const diff = LabHost.pick([-1000, -100, -10, 10, 100, 1000]);
        return makeCompareTask(base, Math.max(100, base + diff), range);
      }
      const base = LabHost.randInt(Math.floor(range / 5), Math.floor(range * 0.8));
      const d = Math.floor(range / 100);
      const set = new Set([base, base + d, base - d, base + 9 * d]);
      while (set.size < 4) set.add(LabHost.randInt(Math.floor(range / 10), range - 1));
      return makeOrderTask(Array.from(set).slice(0, 4), range);
    }

    if (tier === 1) {
      const allowed = range <= 10000 ? ['Z', 'H', 'T'] : range <= 100000 ? ['H', 'T', 'ZT'] : ['T', 'ZT', 'HT'];
      const key = LabHost.pick(allowed);
      const nt = NEIGHBOR_TYPES.find(x => x.key === key);
      let n = LabHost.randInt(nt.step + 1, range - nt.step - 1);
      if (n % nt.step === 0) n += LabHost.randInt(1, Math.min(99, nt.step - 1));
      return makeNeighborTask(n, key, range, 1);
    }

    // Tier 2: Boundary crossing (exact multiple or 999.. transition) or sequence
    if (Math.random() < 0.5) {
      const step = range <= 10000 ? 1000 : range <= 100000 ? 10000 : 100000;
      const boundary = LabHost.randInt(1, 8) * step;
      const typeKey = Math.random() < 0.5 ? 'E' : (range <= 10000 ? 'H' : 'T');
      return makeNeighborTask(boundary, typeKey, range, 2);
    }
    const delta = LabHost.pick(range <= 10000 ? [50, 100, 250, -100] : [100, 500, 1000, -1000]);
    const boundary = LabHost.randInt(2, 9) * (range <= 10000 ? 1000 : 10000);
    const start = boundary - 2 * delta - (delta > 0 ? Math.abs(delta) : -Math.abs(delta));
    return makeSequenceTask(Math.max(100, start), delta, range);
  }

  function buildRound({ mode, tier, range }) {
    if (mode === 'course') return buildCourse();
    const r = range || 100000;
    const tiers = tier === 'mixed' ? [0, 0, 1, 1, 1, 2, 2, 2] : Array(8).fill(tier);
    return tiers.map(ti => genTask(ti, r));
  }

  // ---- Visuals & Custom Inputs ----
  function renderVisual(container, task, state, h) {
    if (task.kind === 'compare') {
      const sign = state.solved ? task.answer : (state.interactiveValue || '?');
      const lenA = String(task.a).length;
      const lenB = String(task.b).length;
      const hintLine = state.showHintVisual
        ? `<div class="lh-helper-bar" style="justify-content:center"><span>${h.fmtNum(task.a)}: <b>${lenA}</b> ${h.t('nbDigitsWord', null, 'digits')} · ${h.fmtNum(task.b)}: <b>${lenB}</b> ${h.t('nbDigitsWord', null, 'digits')}</span></div>`
        : '';
      container.innerHTML = `
        <div class="nb-ladder">
          <div class="nb-card"><span class="nb-card-label">A</span><span class="nb-card-val">${h.fmtNum(task.a)}</span></div>
          <div class="nb-card nb-card-center" style="min-width:64px"><span class="nb-card-val">${h.esc(sign)}</span></div>
          <div class="nb-card"><span class="nb-card-label">B</span><span class="nb-card-val">${h.fmtNum(task.b)}</span></div>
        </div>
        ${hintLine}
      `;
      return;
    }

    if (task.kind === 'order') {
      if (!state.customState.picked) state.customState.picked = [];
      const picked = state.customState.picked;
      const slotsHtml = task.answer.map((_, idx) => {
        const val = picked[idx];
        return `<div class="nb-order-slot" data-slot="${idx}">${val != null ? h.fmtNum(val) : `${idx + 1}.`}</div>${idx < task.answer.length - 1 ? '<span style="font-weight:900;color:#9ba8ce">&lt;</span>' : ''}`;
      }).join('');
      const chipsHtml = task.nums.map((n, i) => {
        const used = picked.includes(n);
        return `<button type="button" class="nb-order-chip ${used ? 'used' : ''}" data-num="${n}" ${used || state.solved ? 'disabled' : ''}>${h.fmtNum(n)}</button>`;
      }).join('');

      container.innerHTML = `
        <div class="nb-order-slots">${slotsHtml}</div>
        <div class="nb-order-slots" style="margin-top:8px">${chipsHtml}</div>
        ${!state.solved && picked.length > 0 ? `<button type="button" class="nl-chip-btn" id="nb-order-clear">${h.esc(h.t('nlGapsClear', null, '↺ Reset'))}</button>` : ''}
      `;

      container.querySelectorAll('.nb-order-chip').forEach(btn => {
        btn.addEventListener('click', () => {
          const val = parseInt(btn.dataset.num, 10);
          if (!picked.includes(val)) {
            picked.push(val);
            h.setInteractiveValue(picked.slice());
            h.redraw();
          }
        });
      });
      container.querySelectorAll('.nb-order-slot').forEach(slot => {
        slot.addEventListener('click', () => {
          if (state.solved) return;
          const idx = parseInt(slot.dataset.slot, 10);
          if (picked[idx] != null) {
            picked.splice(idx, 1);
            h.setInteractiveValue(picked.slice());
            h.redraw();
          }
        });
      });
      const clearBtn = container.querySelector('#nb-order-clear');
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          state.customState.picked = [];
          h.setInteractiveValue([]);
          h.redraw();
        });
      }
      return;
    }

    if (task.kind === 'neighbor') {
      const leftShow = (state.stepIdx > 0 || state.solved) ? h.fmtNum(task.left) : '?';
      const rightShow = state.solved ? h.fmtNum(task.right) : '?';
      container.innerHTML = `
        <div class="nb-ladder">
          <div class="nb-card"><span class="nb-card-label">${task.nt.left}</span><span class="nb-card-val">${leftShow}</span></div>
          <span style="font-weight:900;color:#7ef9ae">←</span>
          <div class="nb-card nb-card-center"><span class="nb-card-label">${h.esc(h.t('nbCenterLabel', null, 'Number'))}</span><span class="nb-card-val">${h.fmtNum(task.n)}</span></div>
          <span style="font-weight:900;color:#7ef9ae">→</span>
          <div class="nb-card"><span class="nb-card-label">${task.nt.right}</span><span class="nb-card-val">${rightShow}</span></div>
        </div>
      `;
      return;
    }

    // Sequence visual
    const deltaHint = state.showHintVisual || state.showSolutionVisual
      ? `<div class="lh-helper-bar" style="justify-content:center"><span>${h.t('nbSeqStepHint', { step: (task.delta > 0 ? '+' : '−') + h.fmtNum(Math.abs(task.delta)) }, `Step: <b>${(task.delta > 0 ? '+' : '−') + h.fmtNum(Math.abs(task.delta))}</b>`)}</span></div>`
      : '';
    container.innerHTML = `
      <div class="nb-ladder">
        ${task.shown.map(v => `<div class="nb-card"><span class="nb-card-val">${h.fmtNum(v)}</span></div>`).join('<span style="color:#9ba8ce;font-weight:900">→</span>')}
        <span style="color:#38ef7d;font-weight:900">→</span>
        <div class="nb-card nb-card-center"><span class="nb-card-val">${state.solved ? h.fmtNum(task.answer) : '?'}</span></div>
      </div>
      ${deltaHint}
    `;
  }

  function renderInputs(container, task, state, h) {
    if (task.kind === 'compare') {
      const signs = ['<', '=', '>'];
      container.innerHTML = `<div class="lh-choice-grid">${signs.map(s => `
        <button type="button" class="lh-choice-btn ${state.interactiveValue === s ? 'active' : ''}" data-sign="${h.esc(s)}" ${state.solved ? 'disabled' : ''}>${h.esc(s)}</button>
      `).join('')}</div>`;
      container.querySelectorAll('.lh-choice-btn').forEach(btn => {
        btn.addEventListener('click', () => h.submitDirect(btn.dataset.sign));
      });
      return;
    }

    if (task.kind === 'order') {
      container.innerHTML = ''; // Ordering happens in visual cards; standard Submit checks order
      return;
    }

    // Fallback to default LabHost field rendering by building the standard DOM
    const fields = task.fields || [];
    const isMulti = fields.length > 1;
    let html = `<div class="nl-fieldset ${isMulti ? '' : 'lh-fieldset-single'}">`;
    fields.forEach((f, idx) => {
      const isLocked = task.twoStep && idx > state.stepIdx && !state.solved;
      const isDone = task.twoStep && idx < state.stepIdx;
      const disabled = (isLocked || state.solved) ? 'disabled' : '';
      const val = f._value != null ? h.esc(f._value) : '';
      html += `<div class="nl-field ${isLocked ? 'nl-field-locked' : isDone ? 'nl-field-done' : ''}">
        <label for="lh-in-${f.id}">${h.esc(f.label)}</label>
        <input id="lh-in-${f.id}" name="${f.id}" type="text" inputmode="numeric" autocomplete="off" placeholder="${h.esc(f.placeholder || '')}" value="${val}" ${disabled}>
      </div>`;
    });
    html += `</div>`;
    container.innerHTML = html;
    if (!state.solved) {
      const focusField = task.twoStep ? fields[state.stepIdx] : fields[0];
      const inp = focusField && container.querySelector(`#lh-in-${focusField.id}`);
      if (inp && !inp.disabled) setTimeout(() => { try { inp.focus(); } catch {} }, 10);
    }
  }

  // ---- Diagnostic Error Engine ----
  function checkAnswer(task, submission, state, h) {
    if (task.kind === 'compare') {
      const chosen = submission.interactive;
      if (!chosen) return { empty: true };
      if (chosen === task.answer) {
        return {
          ok: true,
          title: h.t('nbGoodTitle', null, 'Correct!'),
          message: `${h.fmtNum(task.a)} <b>${h.esc(task.answer)}</b> ${h.fmtNum(task.b)}`,
        };
      }
      // Classic Klasse 4 mistake: comparing first digit while ignoring digit count (e.g. 98 765 > 100 002)
      if (String(task.a).length !== String(task.b).length) {
        return {
          ok: false,
          category: 'digit_count_ignore',
          showHintVisual: true,
          title: h.t('nbErrDigitsTitle', null, 'Count the digits first!'),
          message: h.t('nbErrDigitsMsg', {
            a: h.fmtNum(task.a), la: String(task.a).length,
            b: h.fmtNum(task.b), lb: String(task.b).length,
          }, `${h.fmtNum(task.a)} has <b>${String(task.a).length}</b> digits, while ${h.fmtNum(task.b)} has <b>${String(task.b).length}</b> digits. More digits is always bigger!`),
        };
      }
      return {
        ok: false,
        category: 'compare_place',
        showHintVisual: true,
        title: h.t('nbErrCompareTitle', null, 'Compare from left to right!'),
        message: h.t('nbErrCompareMsg', null, 'Both numbers have the same number of digits — find the first column from the left where their digits differ.'),
      };
    }

    if (task.kind === 'order') {
      const picked = submission.interactive || [];
      if (picked.length < task.answer.length) {
        return { empty: true, title: h.t('nbOrderIncomplete', null, 'Tap all 4 numbers into the slots first!') };
      }
      const ok = task.answer.every((v, i) => picked[i] === v);
      if (ok) {
        return {
          ok: true,
          title: h.t('nbGoodTitle', null, 'Perfectly ordered!'),
          message: task.answer.map(v => h.fmtNum(v)).join(' &lt; '),
        };
      }
      const reversed = task.answer.slice().reverse().every((v, i) => picked[i] === v);
      if (reversed) {
        return {
          ok: false,
          category: 'order_reversed',
          title: h.t('nbErrRevTitle', null, 'Smallest to largest!'),
          message: h.t('nbErrRevMsg', null, 'You ordered them from largest to smallest — start with the smallest number on the left.'),
        };
      }
      return {
        ok: false,
        category: 'digit_count_ignore',
        title: h.t('nbErrOrderTitle', null, 'Check two neighboring cards!'),
        message: h.t('nbErrOrderMsg', null, 'First check digit counts, then compare the highest place-value column left to right.'),
      };
    }

    if (task.kind === 'neighbor') {
      const isLeft = submission.stepIdx === 0;
      const expected = isLeft ? task.left : task.right;
      const other = isLeft ? task.right : task.left;
      const val = h.parseNum(isLeft ? submission.values.left : submission.values.right);
      if (isNaN(val)) return { empty: true };

      if (val === expected) {
        if (isLeft) {
          return {
            ok: true,
            nextStep: true,
            title: h.t('nbStep1Good', { label: task.nt.left, val: h.fmtNum(expected) }, `${task.nt.left} = ${h.fmtNum(expected)} ✓`),
            message: h.t('nbStep2Prompt', { label: task.nt.right }, `Now find <b>${task.nt.right}</b>!`),
          };
        }
        return {
          ok: true,
          title: h.t('nbGoodTitle', null, 'Both neighbors correct!'),
          message: `${h.fmtNum(task.left)} &lt; <b>${h.fmtNum(task.n)}</b> &lt; ${h.fmtNum(task.right)}`,
        };
      }

      if (val === other) {
        return {
          ok: false,
          category: 'swapped_neighbors',
          title: h.t('nbErrSwapTitle', null, 'That is the neighbor on the other side!'),
          message: isLeft
            ? h.t('nbErrSwapLeft', { label: task.nt.left }, `<b>${task.nt.left}</b> must be <b>smaller</b> than ${h.fmtNum(task.n)}.`)
            : h.t('nbErrSwapRight', { label: task.nt.right }, `<b>${task.nt.right}</b> must be <b>bigger</b> than ${h.fmtNum(task.n)}.`),
        };
      }
      if (val === task.n && task.n % task.nt.step === 0) {
        return {
          ok: false,
          category: 'exact_multiple_same',
          title: h.t('nbErrSameTitle', null, 'A neighbor is never the number itself!'),
          message: h.t('nbErrSameMsg', { step: h.fmtNum(task.nt.step) }, `${h.fmtNum(task.n)} is already an exact multiple — step one full <b>${h.fmtNum(task.nt.step)}</b> away!`),
        };
      }
      if (task.nt.step > 1 && val % task.nt.step !== 0) {
        return {
          ok: false,
          category: 'unzeroed_tail',
          title: h.t('nbErrTailTitle', null, 'Don\'t forget the zeros at the end!'),
          message: h.t('nbErrTailMsg', { label: isLeft ? task.nt.left : task.nt.right, step: h.fmtNum(task.nt.step) }, `Every <b>${isLeft ? task.nt.left : task.nt.right}</b> ends with clean zeros (a multiple of ${h.fmtNum(task.nt.step)}).`),
        };
      }
      return {
        ok: false,
        category: 'boundary_9_0',
        title: h.t('nbErrBoundTitle', null, 'Watch the place-value boundary!'),
        message: h.t('nbErrBoundMsg', { step: h.fmtNum(task.nt.step) }, `Check carefully when crossing a 9→0 or 0→9 boundary in steps of ${h.fmtNum(task.nt.step)}.`),
      };
    }

    // Sequence task
    const val = h.parseNum(submission.values.ans);
    if (isNaN(val)) return { empty: true };
    if (val === task.answer) {
      return {
        ok: true,
        title: h.t('nbGoodTitle', null, 'Sequence mastered!'),
        message: `${h.fmtNum(task.shown[3])} ${task.delta > 0 ? '+' : '−'} ${h.fmtNum(Math.abs(task.delta))} = <b>${h.fmtNum(task.answer)}</b>`,
      };
    }
    if (val === task.shown[3] - task.delta) {
      return {
        ok: false,
        category: 'swapped_neighbors',
        showHintVisual: true,
        title: h.t('nbErrSeqDirTitle', null, 'Check whether the sequence goes up or down!'),
        message: h.t('nbErrSeqDirMsg', null, 'Look at the first two numbers to check if we add or subtract each step.'),
      };
    }
    return {
      ok: false,
      category: 'boundary_9_0',
      showHintVisual: true,
      title: h.t('nbErrBoundTitle', null, 'Watch the boundary crossing!'),
      message: h.t('nbErrSeqMsg', { step: (task.delta > 0 ? '+' : '−') + h.fmtNum(Math.abs(task.delta)) }, `Each jump is <b>${(task.delta > 0 ? '+' : '−') + h.fmtNum(Math.abs(task.delta))}</b>.`),
    };
  }

  function getHint(task, state, level, h) {
    if (task.kind === 'neighbor') {
      return {
        title: h.t('labHintTitle', null, '💡 Hint'),
        html: h.t('nbHintNeighbor', {
          step: h.fmtNum(task.nt.step),
          n: h.fmtNum(task.n),
        }, `Find the multiples of <b>${h.fmtNum(task.nt.step)}</b> just below and just above <b>${h.fmtNum(task.n)}</b>.`),
      };
    }
    if (task.kind === 'sequence') {
      const sign = task.delta > 0 ? '+' : '−';
      return {
        title: h.t('labHintTitle', null, '💡 Hint'),
        html: h.t('nbHintSeq', { step: `${sign}${h.fmtNum(Math.abs(task.delta))}` }, `Each step changes by <b>${sign}${h.fmtNum(Math.abs(task.delta))}</b>.`),
      };
    }
    return {
      title: h.t('labHintTitle', null, '💡 Hint'),
      html: h.t('nbHintCompare', null, 'Step 1: Count digits. Step 2: If equal, compare the leftmost differing digit!'),
    };
  }

  function getSolution(task, state, h) {
    if (task.kind === 'compare') {
      return { html: `${h.fmtNum(task.a)} <b>${h.esc(task.answer)}</b> ${h.fmtNum(task.b)}` };
    }
    if (task.kind === 'order') {
      return { html: task.answer.map(v => `<b>${h.fmtNum(v)}</b>`).join(' &lt; ') };
    }
    if (task.kind === 'neighbor') {
      return {
        html: `${task.nt.left}: <b>${h.fmtNum(task.left)}</b> · ${task.nt.right}: <b>${h.fmtNum(task.right)}</b><br>Probe: ${h.fmtNum(task.right)} − ${h.fmtNum(task.left)} = ${h.fmtNum(task.right - task.left)}`,
      };
    }
    const sign = task.delta > 0 ? '+' : '−';
    return {
      html: `${h.fmtNum(task.shown[3])} ${sign} ${h.fmtNum(Math.abs(task.delta))} = <b>${h.fmtNum(task.answer)}</b>`,
    };
  }

  function getTrickkiste(task, state, h) {
    return {
      heading: h.t('nbTrickHeading', null, 'Neighbor & Ordering Rules:'),
      formulaHtml: h.t('nbTrickFormula', null, '1. Count digits first<br>2. Place-value neighbors end in 0s'),
      descHtml: h.t('nbTrickDesc', null, '<b>VT / NT</b> = neighbor thousands (end in 000). If the number is already a multiple, step a full unit away!'),
      miniSvgHtml: `<svg viewBox="0 0 218 52" role="img" aria-label="43000 to 43267 to 44000">
        <text x="26" y="18" fill="#7ef9ae" font-size="10" font-weight="800" text-anchor="middle">VT</text>
        <text x="26" y="38" fill="#fff" font-size="11" font-weight="900" text-anchor="middle">43 000</text>
        <text x="109" y="18" fill="#ffd166" font-size="10" font-weight="800" text-anchor="middle">Zahl</text>
        <text x="109" y="38" fill="#ffd166" font-size="12" font-weight="900" text-anchor="middle">43 267</text>
        <text x="192" y="18" fill="#7ef9ae" font-size="10" font-weight="800" text-anchor="middle">NT</text>
        <text x="192" y="38" fill="#fff" font-size="11" font-weight="900" text-anchor="middle">44 000</text>
      </svg>`,
      miniDesc: h.t('nbMiniDesc', null, '43 000 < 43 267 < 44 000 ✅'),
      asideTipHtml: h.t('nbAsideTip', null, 'Tip: Watch 9→0 transitions like 99 999 → 100 000!'),
    };
  }

  const def = {
    id: 'neighbors',
    chapter: 1,
    prefix: 'nb',
    icon: '🔢',
    roundSize: 8,
    ranges: [10000, 100000, 1000000],
    defaultRange: 100000,
    levels: [
      { id: 0, labelKey: 'nbTier0', chipKey: 'nbChip0' },
      { id: 1, labelKey: 'nbTier1', chipKey: 'nbChip1' },
      { id: 2, labelKey: 'nbTier2', chipKey: 'nbChip2' },
    ],
    buildRound,
    renderVisual,
    renderInputs,
    checkAnswer,
    getHint,
    getSolution,
    getTrickkiste,
    computeNeighbors,
    makeCompareTask,
    makeNeighborTask,
  };

  if (typeof LabHost !== 'undefined' && LabHost.register) LabHost.register(def);
  return def;
})();
