// Klasse 4 Lab 6: Schriftliche Multiplikation Labor (Malkreuz → Written Multiplication)
// PIKAS Grade 4: 1-stelliger Faktor, Zehnerzahlen & Malkreuz-Brücke, 2-stelliger Faktor inkl. Null im Faktor, Überschlag.

const WrittenMulLab = (() => {
  'use strict';

  function roundFront(n) {
    if (n < 10) return n;
    const mag = Math.pow(10, Math.floor(Math.log10(n)));
    return Math.round(n / mag) * mag;
  }

  function makeMulTask(a, b, tier) {
    const t = LabHost.t;
    const answer = a * b;
    const estA = roundFront(a);
    const estB = b >= 10 ? Math.round(b / 10) * 10 : b;
    const estimate = estA * estB;
    const bTens = Math.floor(b / 10) * 10;
    const bOnes = b % 10;
    const partialTens = a * bTens;
    const partialOnes = a * bOnes;
    return {
      tier,
      a,
      b,
      answer,
      estA,
      estB,
      estimate,
      bTens,
      bOnes,
      partialTens,
      partialOnes,
      prompt: t('wmPromptMul', {
        a: LabHost.fmtNum(a),
        b: LabHost.fmtNum(b),
      }, `Multiply: ${LabHost.fmtNum(a)} · ${LabHost.fmtNum(b)}`),
      subtitle: tier === 2
        ? t('wmSubTwoDigit', null, 'Multiply by the tens first (remember the placeholder 0!), then by the ones, then add both partial products.')
        : tier === 1
        ? t('wmSubTens', null, 'Use the Malkreuz or multiply by the tens digit and shift one place (×10).')
        : t('wmSubOneDigit', null, 'Estimate (Überschlag) first, then multiply right to left adding each carry AFTER multiplying!'),
      fields: [{ id: 'ans', label: t('wmInputLabel', null, 'Product:'), placeholder: '' }],
    };
  }

  function buildCourse() {
    return [
      makeMulTask(436, 7, 0),
      makeMulTask(2308, 6, 0),    // Interior zero with 1-digit!
      makeMulTask(348, 20, 1),
      makeMulTask(407, 30, 1),
      makeMulTask(348, 27, 2),
      makeMulTask(524, 34, 2),
      makeMulTask(407, 36, 2),    // Interior zero with 2-digit!
      makeMulTask(1235, 24, 2),
    ];
  }

  function genTask(tier) {
    if (tier === 0) {
      const a = Math.random() < 0.4
        ? LabHost.randInt(2, 9) * 100 + LabHost.randInt(1, 9) // interior zero e.g. 407
        : LabHost.randInt(125, 2480);
      const b = LabHost.randInt(3, 9);
      return makeMulTask(a, b, 0);
    }
    if (tier === 1) {
      const a = LabHost.randInt(124, 896);
      const b = LabHost.randInt(2, 9) * 10;
      return makeMulTask(a, b, 1);
    }
    const a = Math.random() < 0.35
      ? LabHost.randInt(2, 8) * 100 + LabHost.randInt(2, 9)
      : LabHost.randInt(134, 985);
    const b = LabHost.randInt(12, 89);
    const cleanB = b % 10 === 0 ? b + LabHost.randInt(2, 8) : b;
    return makeMulTask(a, cleanB, 2);
  }

  function buildRound({ mode, tier }) {
    if (mode === 'course') return buildCourse();
    const tiers = tier === 'mixed' ? [0, 0, 1, 1, 2, 2, 2, 2] : Array(8).fill(tier);
    return tiers.map(ti => genTask(ti));
  }

  // ---- German Written Multiplication + Malkreuz Visual ----
  function renderVisual(container, task, state, h) {
    const showDetails = state.showHintVisual || state.showSolutionVisual;
    const isTwoDigit = task.b >= 10 && task.bOnes > 0;

    // German horizontal written notation: 348 · 27
    let writtenHtml = `<div class="wd-box" style="text-align:right;min-width:210px">
      <div style="border-bottom:2px solid #f0f2ff;padding-bottom:4px;margin-bottom:4px;font-weight:900">${h.fmtNum(task.a)} · ${h.fmtNum(task.b)}</div>`;
    if (isTwoDigit) {
      const p1 = showDetails ? h.fmtNum(task.partialTens) : `· · · <span class="wd-zero-hi">0</span>`;
      const p2 = showDetails ? h.fmtNum(task.partialOnes) : `· · · ·`;
      writtenHtml += `<div style="color:#a9b8ff">${p1}</div>`;
      writtenHtml += `<div style="color:#ffd166;border-bottom:2px solid #f0f2ff;padding-bottom:4px;margin-bottom:4px">+ ${p2}</div>`;
    }
    writtenHtml += `<div style="color:${state.solved ? '#7ef9ae' : '#9ba8ce'};font-weight:900">${state.solved ? h.fmtNum(task.answer) : '?'}</div></div>`;

    // Malkreuz bridge shown for Tier 1 or when hint/solution is active on 2-digit tasks
    let malkreuzHtml = '';
    if (task.tier === 1 || (isTwoDigit && showDetails)) {
      const aParts = [];
      String(task.a).split('').forEach((ch, idx, arr) => {
        const val = parseInt(ch, 10) * Math.pow(10, arr.length - 1 - idx);
        if (val > 0) aParts.push(val);
      });
      const bParts = task.bOnes > 0 ? [task.bTens, task.bOnes] : [task.b];
      malkreuzHtml = `<table class="wm-malkreuz" aria-label="Malkreuz decomposition">
        <thead><tr><th>·</th>${aParts.map(p => `<th>${h.fmtNum(p)}</th>`).join('')}</tr></thead>
        <tbody>${bParts.map(bp => `<tr><th>${h.fmtNum(bp)}</th>${aParts.map(ap => `<td>${showDetails ? h.fmtNum(ap * bp) : '?'}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>`;
    }

    container.innerHTML = `
      <div style="display:flex;flex-wrap:wrap;gap:14px;align-items:center;justify-content:center">
        ${writtenHtml}
        ${malkreuzHtml}
      </div>
      <div style="font-size:0.84rem;color:#ffd166;font-weight:700">
        ${h.t('wmEstBanner', { ea: h.fmtNum(task.estA), eb: h.fmtNum(task.estB), est: h.fmtNum(task.estimate) }, `Überschlag: ${h.fmtNum(task.estA)} · ${h.fmtNum(task.estB)} ≈ ${h.fmtNum(task.estimate)}`)}
      </div>
    `;
  }

  // ---- Diagnostic Error Engine ----
  function checkAnswer(task, submission, state, h) {
    const val = h.parseNum(submission.values.ans);
    if (isNaN(val)) return { empty: true };
    if (val === task.answer) {
      return {
        ok: true,
        title: h.t('wmGoodTitle', null, 'Product spot on!'),
        message: `${h.fmtNum(task.a)} · ${h.fmtNum(task.b)} = <b>${h.fmtNum(task.answer)}</b>`,
      };
    }

    // 1. Missing tens-shift zero on 2-digit multiplication: a*(bTens/10) + a*bOnes
    if (task.b >= 10 && task.bOnes > 0) {
      const noShift = task.a * (task.bTens / 10) + task.a * task.bOnes;
      if (val === noShift) {
        return {
          ok: false,
          category: 'missing_tens_zero',
          showHintVisual: true,
          title: h.t('wmErrShiftTitle', null, 'The tens-place 0 is missing!'),
          message: h.t('wmErrShiftMsg', {
            a: h.fmtNum(task.a), tens: task.bTens, p1: h.fmtNum(task.partialTens),
          }, `The first partial product is ${h.fmtNum(task.a)} · <b>${task.bTens}</b> = <b>${h.fmtNum(task.partialTens)}</b> (don't forget the trailing 0 for the tens!).`),
        };
      }
    }

    // 2. Interior zero slip: 0 * b treated as b (for 1-digit)
    if (task.b < 10 && String(task.a).includes('0')) {
      const s = String(task.a);
      let slipVal = task.answer;
      for (let i = 0; i < s.length; i++) {
        if (s[i] === '0') {
          const place = Math.pow(10, s.length - 1 - i);
          if (val === task.answer + task.b * place) {
            return {
              ok: false,
              category: 'zero_times_n_slip',
              showHintVisual: true,
              title: h.t('wmErrZeroTitle', null, 'Remember: 0 times anything is 0!'),
              message: h.t('wmErrZeroMsg', { b: task.b }, `0 · ${task.b} = <b>0</b> (plus any carry from the column to the right).`),
            };
          }
        }
      }
      void slipVal;
    }

    // 3. Order of magnitude error (off by x10 or /10 vs Überschlag)
    if (val === task.answer * 10 || val * 10 === task.answer || val < task.estimate * 0.25 || val > task.estimate * 4) {
      return {
        ok: false,
        category: 'magnitude_off',
        showHintVisual: true,
        title: h.t('wmErrMagTitle', null, 'Check against the Überschlag!'),
        message: h.t('wmErrMagMsg', { est: h.fmtNum(task.estimate) }, `Our estimation is about <b>${h.fmtNum(task.estimate)}</b> — your answer is in a very different size range!`),
      };
    }

    // 4. Carry order / partial sum slip
    return {
      ok: false,
      category: 'carry_slip',
      showHintVisual: true,
      title: h.t('wmErrCarryTitle', null, 'Check your carries and partial sums!'),
      message: h.t('wmErrCarryMsg', null, 'Always multiply the digit first, and <b>then</b> add the carry — never add the carry before multiplying!'),
    };
  }

  function getHint(task, state, level, h) {
    if (task.b >= 10 && task.bOnes > 0) {
      return {
        title: h.t('labHintTitle', null, '💡 Hint'),
        html: h.t('wmHintTwoDigit', {
          a: h.fmtNum(task.a), bt: task.bTens, bo: task.bOnes,
          p1: h.fmtNum(task.partialTens), p2: h.fmtNum(task.partialOnes),
        }, `Split into two parts: ${h.fmtNum(task.a)} · ${task.bTens} = <b>${h.fmtNum(task.partialTens)}</b> and ${h.fmtNum(task.a)} · ${task.bOnes} = <b>${h.fmtNum(task.partialOnes)}</b>. Now add them!`),
      };
    }
    return {
      title: h.t('labHintTitle', null, '💡 Hint'),
      html: h.t('wmHintOneDigit', { est: h.fmtNum(task.estimate) }, `Use the Malkreuz table to break ${h.fmtNum(task.a)} into place-value parts! Überschlag ≈ <b>${h.fmtNum(task.estimate)}</b>.`),
    };
  }

  function getSolution(task, state, h) {
    if (task.b >= 10 && task.bOnes > 0) {
      return {
        html: `<div>${h.fmtNum(task.a)} · ${task.bTens} = ${h.fmtNum(task.partialTens)}</div>
               <div>${h.fmtNum(task.a)} · ${task.bOnes} = ${h.fmtNum(task.partialOnes)}</div>
               <div>${h.fmtNum(task.partialTens)} + ${h.fmtNum(task.partialOnes)} = <b>${h.fmtNum(task.answer)}</b> (Überschlag ≈ ${h.fmtNum(task.estimate)} ✓)</div>`,
      };
    }
    return {
      html: `${h.fmtNum(task.a)} · ${h.fmtNum(task.b)} = <b>${h.fmtNum(task.answer)}</b> (Überschlag ≈ ${h.fmtNum(task.estimate)} ✓)`,
    };
  }

  function getTrickkiste(task, state, h) {
    return {
      heading: h.t('wmTrickHeading', null, 'Written Multiplication Rules:'),
      formulaHtml: h.t('wmTrickFormula', null, '1. Multiply digit first, THEN add carry<br>2. Tens row always starts with 0'),
      descHtml: h.t('wmTrickDesc', null, 'Always check your answer with an <b>Überschlag</b> (rounded estimation) so no zero gets lost!'),
      miniSvgHtml: `<svg viewBox="0 0 218 50" role="img" aria-label="Tens partial product ends in 0">
        <text x="109" y="18" fill="#fff" font-size="12" font-weight="800" text-anchor="middle">348 · 27</text>
        <line x1="40" y1="23" x2="178" y2="23" stroke="#8fa3cf" stroke-width="1.5"/>
        <text x="109" y="40" fill="#ffd166" font-size="12" font-weight="900" text-anchor="middle">6960 + 2436 = 9396</text>
      </svg>`,
      miniDesc: h.t('wmMiniDesc', null, 'Don\'t forget the tens placeholder 0 ✅'),
      asideTipHtml: h.t('wmAsideTip', null, 'Tip: 0 · any number = 0 — never skip a zero in the middle!'),
    };
  }

  const def = {
    id: 'written-mul',
    chapter: 2,
    prefix: 'wm',
    icon: '✖️',
    roundSize: 8,
    levels: [
      { id: 0, labelKey: 'wmTier0', chipKey: 'wmChip0' },
      { id: 1, labelKey: 'wmTier1', chipKey: 'wmChip1' },
      { id: 2, labelKey: 'wmTier2', chipKey: 'wmChip2' },
    ],
    buildRound,
    renderVisual,
    checkAnswer,
    getHint,
    getSolution,
    getTrickkiste,
    makeMulTask,
  };

  if (typeof LabHost !== 'undefined' && LabHost.register) LabHost.register(def);
  return def;
})();
