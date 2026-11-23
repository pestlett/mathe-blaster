// Klasse 4 Lab 5: Schriftlich +/− Labor (Written Addition & Subtraction up to 1 000 000)
// PIKAS Grade 4: Aufgabenblick (Kopf vs. schriftlich), Stellenwert-Spalten, Übertrag/Entbündeln,
// Abziehverfahren (default) vs. Ergänzungsverfahren toggle, Nullen im Minuenden, Probe (Umkehraufgabe).

const WrittenAddSubLab = (() => {
  'use strict';

  const COL_HEADERS = ['M', 'HT', 'ZT', 'T', 'H', 'Z', 'E'];

  // Helper: simulates forgetting all carries/borrows
  function noRegroupResult(a, b, op) {
    const sa = String(a).padStart(7, '0');
    const sb = String(b).padStart(7, '0');
    let out = '';
    for (let i = 0; i < 7; i++) {
      const da = parseInt(sa[i], 10), db = parseInt(sb[i], 10);
      if (op === '+') out += String((da + db) % 10);
      else out += String((da - db + 10) % 10);
    }
    return parseInt(out, 10);
  }

  // Helper: simulates classic "always subtract smaller digit from larger" (|da - db|)
  function absDigitSub(a, b) {
    const sa = String(a).padStart(7, '0');
    const sb = String(b).padStart(7, '0');
    let out = '';
    for (let i = 0; i < 7; i++) {
      out += String(Math.abs(parseInt(sa[i], 10) - parseInt(sb[i], 10)));
    }
    return parseInt(out, 10);
  }

  function hasZeroInMinuend(a, b) {
    const sa = String(a);
    const sb = String(b).padStart(sa.length, '0');
    for (let i = 1; i < sa.length; i++) {
      if (sa[i] === '0' && parseInt(sb[i], 10) > 0) return true;
    }
    return false;
  }

  function makeBlickTask(a, b, op, smartChoice, reasonKey, range) {
    const t = LabHost.t;
    const answer = op === '+' ? a + b : a - b;
    return {
      tier: 0,
      kind: 'blick',
      op,
      a,
      b,
      answer,
      smartChoice, // 'mental' | 'written'
      reasonKey,
      range,
      hideSubmitBtn: true,
      prompt: t('waPromptBlick', {
        expr: `${LabHost.fmtNum(a)} ${op === '+' ? '+' : '−'} ${LabHost.fmtNum(b)}`,
      }, `Aufgabenblick: Would you solve ${LabHost.fmtNum(a)} ${op === '+' ? '+' : '−'} ${LabHost.fmtNum(b)} mentally or in written columns?`),
      subtitle: t('waSubBlick', null, 'Smart mathematicians look first before reaching for written columns!'),
    };
  }

  function makeCalcTask(a, b, op, tier, range) {
    const t = LabHost.t;
    const answer = op === '+' ? a + b : a - b;
    return {
      tier,
      kind: 'calc',
      op,
      a,
      b,
      answer,
      range,
      prompt: t(op === '+' ? 'waPromptAdd' : 'waPromptSub', {
        a: LabHost.fmtNum(a),
        b: LabHost.fmtNum(b),
      }, `Calculate in written columns: ${LabHost.fmtNum(a)} ${op === '+' ? '+' : '−'} ${LabHost.fmtNum(b)}`),
      subtitle: t('waSubCalc', null, 'Work column by column from right (E) to left — use the yellow scratch row for carries/borrows!'),
      fields: [{ id: 'ans', label: t('waResultLabel', null, 'Result:'), placeholder: '' }],
    };
  }

  function buildCourse() {
    return [
      makeBlickTask(40000, 2, '-', 'mental', 'waBlickNearRound', 100000),
      makeBlickTask(43817, 19468, '-', 'written', 'waBlickManyDigits', 100000),
      makeCalcTask(23415, 14263, '+', 0, 100000),
      makeCalcTask(36748, 28594, '+', 1, 100000),
      makeCalcTask(74325, 28649, '-', 1, 100000),
      makeCalcTask(284670, 159485, '+', 1, 1000000),
      makeCalcTask(500042, 137685, '-', 2, 1000000),
      makeCalcTask(100000, 43268, '-', 2, 100000),
    ];
  }

  function genTask(tier, range) {
    const hi = Math.floor(range * 0.85);
    const lo = Math.floor(range * 0.15);
    if (tier === 0) {
      if (Math.random() < 0.45) {
        const mental = Math.random() < 0.5;
        if (mental) {
          const roundBase = LabHost.randInt(2, 8) * Math.floor(range / 10);
          return makeBlickTask(roundBase, LabHost.pick([1, 2, 3, 10, 100]), '-', 'mental', 'waBlickNearRound', range);
        }
        const a = LabHost.randInt(lo * 3, hi);
        const b = LabHost.randInt(lo, Math.floor(a * 0.7));
        return makeBlickTask(a, b, '-', 'written', 'waBlickManyDigits', range);
      }
      // No-regrouping addition
      const len = String(range - 1).length;
      let aStr = '', bStr = '';
      for (let i = 0; i < len; i++) {
        const da = LabHost.randInt(i === 0 ? 1 : 0, 5);
        const db = LabHost.randInt(i === 0 ? 1 : 0, 9 - da);
        aStr += da; bStr += db;
      }
      return makeCalcTask(parseInt(aStr, 10), parseInt(bStr, 10), '+', 0, range);
    }

    if (tier === 1) {
      const op = Math.random() < 0.5 ? '+' : '-';
      if (op === '+') {
        const a = LabHost.randInt(lo, Math.floor(range * 0.48));
        const b = LabHost.randInt(lo, Math.floor(range * 0.48));
        return makeCalcTask(a, b, '+', 1, range);
      }
      const a = LabHost.randInt(Math.floor(range * 0.4), hi);
      const b = LabHost.randInt(lo, a - Math.floor(range * 0.1));
      return makeCalcTask(a, b, '-', 1, range);
    }

    // Tier 2: Zeros in minuend (e.g. 400 035 - 168 479)
    const lead = LabHost.randInt(2, 8);
    const tail = LabHost.randInt(12, 89);
    const a = lead * Math.floor(range / 10) + tail;
    const b = LabHost.randInt(Math.floor(range / 10), a - Math.floor(range / 10));
    return makeCalcTask(a, b, '-', 2, range);
  }

  function buildRound({ mode, tier, range }) {
    if (mode === 'course') return buildCourse();
    const r = range || 100000;
    const tiers = tier === 'mixed' ? [0, 0, 1, 1, 1, 1, 2, 2] : Array(8).fill(tier);
    return tiers.map(ti => genTask(ti, r));
  }

  // ---- Place-Value Column Visual ----
  function renderVisual(container, task, state, h) {
    if (task.kind === 'blick') {
      const opSym = task.op === '+' ? '+' : '−';
      container.innerHTML = `
        <div class="pv-prompt-card" style="font-size:1.45rem;font-weight:900">
          ${h.fmtNum(task.a)} ${opSym} ${h.fmtNum(task.b)}
        </div>
      `;
      return;
    }

    const method = (state.options && state.options.method) || 'abzieh';
    const maxVal = Math.max(task.a, task.b, task.answer);
    const numCols = Math.max(4, String(maxVal).length);
    const headers = COL_HEADERS.slice(COL_HEADERS.length - numCols);
    const aDigits = String(task.a).padStart(numCols, ' ').split('');
    const bDigits = String(task.b).padStart(numCols, ' ').split('');
    const ansDigits = String(task.answer).padStart(numCols, ' ').split('');
    const opSym = task.op === '+' ? '+' : '−';

    if (!state.customState.carries) state.customState.carries = Array(numCols).fill('');
    const carries = state.customState.carries;

    const methodNote = task.op === '-'
      ? (method === 'abzieh'
        ? h.t('waMethodAbziehNote', null, 'Method: Abziehverfahren (unbundle from the left column)')
        : h.t('waMethodErgaenzNote', null, 'Method: Ergänzungsverfahren (add carry to bottom digit)'))
      : h.t('waCarryNote', null, 'Jot carries in the yellow row');

    let html = `<div class="wa-grid-wrap">
      <table class="wa-table" aria-label="Written column arithmetic">
        <thead><tr><th></th>${headers.map(ch => `<th>${ch}</th>`).join('')}</tr></thead>
        <tbody>`;

    // For Abziehverfahren subtraction, unbundling scratch row sits ABOVE top number
    if (task.op === '-' && method === 'abzieh') {
      html += `<tr class="wa-carry"><td></td>${carries.map((v, i) => `<td><input type="text" maxlength="2" class="wa-carry-in" data-ci="${i}" value="${h.esc(v)}" aria-label="Borrow scratch ${headers[i]}"></td>`).join('')}</tr>`;
    }

    html += `<tr><td></td>${aDigits.map(d => `<td>${d === ' ' ? '' : d}</td>`).join('')}</tr>`;
    html += `<tr><td style="color:#ffd166">${opSym}</td>${bDigits.map(d => `<td>${d === ' ' ? '' : d}</td>`).join('')}</tr>`;

    // For Addition or Ergänzungsverfahren, carry row sits between 2nd operand and sum line
    if (task.op === '+' || method === 'ergaenz') {
      html += `<tr class="wa-carry"><td></td>${carries.map((v, i) => `<td><input type="text" maxlength="2" class="wa-carry-in" data-ci="${i}" value="${h.esc(v)}" aria-label="Carry scratch ${headers[i]}"></td>`).join('')}</tr>`;
    }

    html += `<tr class="wa-line"><td>=</td>${ansDigits.map(d => `<td style="color:${state.solved ? '#7ef9ae' : '#9ba8ce'}">${state.solved ? (d === ' ' ? '' : d) : '·'}</td>`).join('')}</tr>`;
    html += `</tbody></table></div>
      <div style="font-size:0.82rem;color:#b8c4e6;text-align:center">${h.esc(methodNote)}</div>`;

    container.innerHTML = html;
    container.querySelectorAll('.wa-carry-in').forEach(inp => {
      inp.addEventListener('input', () => {
        carries[parseInt(inp.dataset.ci, 10)] = inp.value;
      });
    });
  }

  function renderInputs(container, task, state, h) {
    if (task.kind === 'blick') {
      container.innerHTML = `<div class="lh-choice-grid">
        <button type="button" class="lh-choice-btn ${state.interactiveValue === 'mental' ? 'active' : ''}" data-ch="mental" ${state.solved ? 'disabled' : ''}>🧠 ${h.esc(h.t('waChoiceMental', null, 'In my head (Kopfrechnen)'))}</button>
        <button type="button" class="lh-choice-btn ${state.interactiveValue === 'written' ? 'active' : ''}" data-ch="written" ${state.solved ? 'disabled' : ''}>📝 ${h.esc(h.t('waChoiceWritten', null, 'Written columns'))}</button>
      </div>`;
      container.querySelectorAll('.lh-choice-btn').forEach(btn => {
        btn.addEventListener('click', () => h.submitDirect(btn.dataset.ch));
      });
      return;
    }
    const f = task.fields[0];
    const val = f._value != null ? h.esc(f._value) : '';
    container.innerHTML = `<div class="nl-fieldset lh-fieldset-single">
      <div class="nl-field">
        <label for="lh-in-ans">${h.esc(f.label)}</label>
        <input id="lh-in-ans" name="ans" type="text" inputmode="numeric" autocomplete="off" value="${val}" ${state.solved ? 'disabled' : ''}>
      </div>
    </div>`;
    if (!state.solved) {
      const inp = container.querySelector('#lh-in-ans');
      if (inp) setTimeout(() => { try { inp.focus(); } catch {} }, 10);
    }
  }

  // ---- Diagnostic Error Engine ----
  function checkAnswer(task, submission, state, h) {
    if (task.kind === 'blick') {
      const ch = submission.interactive;
      if (!ch) return { empty: true };
      if (ch === task.smartChoice) {
        return {
          ok: true,
          title: h.t('waBlickGoodTitle', null, 'Sharp Aufgabenblick!'),
          message: `${h.t(task.reasonKey, null, '')} (${h.fmtNum(task.a)} ${task.op === '+' ? '+' : '−'} ${h.fmtNum(task.b)} = <b>${h.fmtNum(task.answer)}</b>)`,
        };
      }
      return {
        ok: false,
        category: 'aufgabenblick',
        title: h.t('waBlickWarnTitle', null, 'Look closely at the numbers first!'),
        message: task.smartChoice === 'mental'
          ? h.t('waBlickTipMental', null, 'One number is a clean round number and the other is tiny — much faster and safer in your head!')
          : h.t('waBlickTipWritten', null, 'Both numbers have many non-zero digits and multiple regroupings — written columns keep every place safe!'),
      };
    }

    const val = h.parseNum(submission.values.ans);
    if (isNaN(val)) return { empty: true };
    if (val === task.answer) {
      return {
        ok: true,
        title: h.t('waGoodTitle', null, 'Column calculation spot on!'),
        message: `${h.fmtNum(task.a)} ${task.op === '+' ? '+' : '−'} ${h.fmtNum(task.b)} = <b>${h.fmtNum(task.answer)}</b>`,
      };
    }

    // 1. Wrong operation (+ vs -)
    const wrongOpAns = task.op === '+' ? Math.abs(task.a - task.b) : task.a + task.b;
    if (val === wrongOpAns) {
      return {
        ok: false,
        category: 'wrong_operation',
        title: h.t('waErrOpTitle', null, 'Check the + / − sign!'),
        message: h.t('waErrOpMsg', { op: task.op === '+' ? '+' : '−' }, `This task uses <b>${task.op === '+' ? '+' : '−'}</b> — check whether the result should get bigger or smaller.`),
      };
    }

    // 2. Classic subtraction error: smaller digit from larger (|da - db|)
    if (task.op === '-' && val === absDigitSub(task.a, task.b)) {
      return {
        ok: false,
        category: 'smaller_from_larger',
        title: h.t('waErrAbsTitle', null, 'Always subtract bottom from top!'),
        message: h.t('waErrAbsMsg', null, 'If the top digit is smaller than the bottom digit (e.g. 2 − 7), you cannot swap them — unbundle 10 from the column to the left!'),
      };
    }

    // 3. Forgotten carry / borrow
    if (val === noRegroupResult(task.a, task.b, task.op)) {
      return {
        ok: false,
        category: 'forgotten_carry',
        title: h.t('waErrCarryTitle', null, 'A carry or borrow was forgotten!'),
        message: h.t('waErrCarryMsg', null, 'Write every small 1 in the yellow scratch row so you don\'t forget to add/subtract it in the next column.'),
      };
    }

    // 4. Zero-borrow collapse in minuend
    if (task.op === '-' && hasZeroInMinuend(task.a, task.b)) {
      return {
        ok: false,
        category: 'zero_borrow_collapse',
        title: h.t('waErrZeroBorrowTitle', null, 'Watch the zeros in the top number!'),
        message: h.t('waErrZeroBorrowMsg', null, 'When you borrow across a 0, that 0 turns into a <b>9</b> (10 minus the 1 passed to the right). Check with the inverse addition!'),
      };
    }

    return {
      ok: false,
      category: 'column_slip',
      title: h.t('labTryAgainTitle', null, 'Check each column from right to left!'),
      message: h.t('waErrGeneral', null, 'Check your ones, tens, hundreds columns — and try an estimation (Überschlag) to see if the size fits.'),
    };
  }

  function getHint(task, state, level, h) {
    if (task.kind === 'blick') {
      return { title: h.t('labHintTitle', null, '💡 Hint'), html: h.t('waHintBlick', null, 'Round numbers + small steps are fast in your head; multi-digit carries are safer in written columns.') };
    }
    const step = task.range >= 100000 ? 10000 : 1000;
    const ra = Math.round(task.a / step) * step;
    const rb = Math.round(task.b / step) * step;
    const est = task.op === '+' ? ra + rb : ra - rb;
    return {
      title: h.t('labHintTitle', null, '💡 Hint'),
      html: h.t('waHintEst', {
        ra: h.fmtNum(ra), rb: h.fmtNum(rb), op: task.op === '+' ? '+' : '−', est: h.fmtNum(est),
      }, `<b>Überschlag:</b> ${h.fmtNum(ra)} ${task.op === '+' ? '+' : '−'} ${h.fmtNum(rb)} ≈ <b>${h.fmtNum(est)}</b>. Check your ones digit first: ${task.a % 10} ${task.op === '+' ? '+' : '−'} ${task.b % 10}.`),
    };
  }

  function getSolution(task, state, h) {
    const opSym = task.op === '+' ? '+' : '−';
    const probe = task.op === '+'
      ? `${h.fmtNum(task.answer)} − ${h.fmtNum(task.b)} = ${h.fmtNum(task.a)}`
      : `${h.fmtNum(task.answer)} + ${h.fmtNum(task.b)} = ${h.fmtNum(task.a)}`;
    return {
      html: `<div>${h.fmtNum(task.a)} ${opSym} ${h.fmtNum(task.b)} = <b>${h.fmtNum(task.answer)}</b></div>
             <div><b>Probe:</b> ${probe} ✓</div>`,
    };
  }

  function getTrickkiste(task, state, h) {
    return {
      heading: h.t('waTrickHeading', null, 'Column & Check Rules:'),
      formulaHtml: h.t('waTrickFormula', null, 'Right to left: E → Z → H → T<br>Probe: Result + Subtrahend = Start'),
      descHtml: h.t('waTrickDesc', null, 'Always align ones under ones! When borrowing across <b>0</b>, the 0 becomes <b>9</b>.'),
      miniSvgHtml: `<svg viewBox="0 0 218 46" role="img" aria-label="Align columns E Z H T right to left">
        <rect x="10" y="6" width="198" height="34" rx="8" fill="rgba(108,99,255,0.16)" stroke="#6c63ff"/>
        <text x="109" y="28" fill="#ffd166" font-size="12" font-weight="900" text-anchor="middle">T · H · Z · E  ← right to left</text>
      </svg>`,
      miniDesc: h.t('waMiniDesc', null, 'Always verify subtraction with addition Probe ✅'),
      asideTipHtml: h.t('waAsideTip', null, 'Tip: Switch between Abzieh- and Ergänzungsverfahren above to match your school!'),
    };
  }

  const def = {
    id: 'written-addsub',
    chapter: 2,
    prefix: 'wa',
    icon: '➕',
    roundSize: 8,
    ranges: [10000, 100000, 1000000],
    defaultRange: 100000,
    defaultOptions: { method: 'abzieh' },
    optionControls: [
      {
        key: 'method',
        labelKey: 'waMethodLabel',
        choices: [
          { value: 'abzieh',  labelKey: 'waMethodAbzieh' },
          { value: 'ergaenz', labelKey: 'waMethodErgaenz' },
        ],
      },
    ],
    levels: [
      { id: 0, labelKey: 'waTier0', chipKey: 'waChip0' },
      { id: 1, labelKey: 'waTier1', chipKey: 'waChip1' },
      { id: 2, labelKey: 'waTier2', chipKey: 'waChip2' },
    ],
    buildRound,
    renderVisual,
    renderInputs,
    checkAnswer,
    getHint,
    getSolution,
    getTrickkiste,
    noRegroupResult,
    absDigitSub,
    makeCalcTask,
  };

  if (typeof LabHost !== 'undefined' && LabHost.register) LabHost.register(def);
  return def;
})();
