// Klasse 4 Lab 10: Diagramm- & Überschlags-Labor (Scaled Bar Charts & Estimation Plausibility)
// PIKAS Grade 4: Säulendiagramme lesen (mit Skalierung & halben Kästchen), Säulen bauen, Überschlag prüfen.

const ChartsLab = (() => {
  'use strict';

  const BAR_LABELS = ['Mo', 'Di', 'Mi', 'Do'];

  function makeReadChartTask({ scale, units, targetIdx, askDiff = false, otherIdx = 0 }) {
    const t = LabHost.t;
    const values = units.map(u => Math.round(u * scale));
    const answer = askDiff ? Math.abs(values[targetIdx] - values[otherIdx]) : values[targetIdx];
    const targetLabel = BAR_LABELS[targetIdx];
    const otherLabel = BAR_LABELS[otherIdx];
    return {
      tier: 0,
      kind: 'read',
      scale,
      units,
      values,
      targetIdx,
      otherIdx,
      askDiff,
      gridCountTrap: askDiff ? Math.abs(units[targetIdx] - units[otherIdx]) : units[targetIdx],
      isHalf: !Number.isInteger(units[targetIdx]),
      answer,
      prompt: askDiff
        ? t('dgPromptDiff', { a: targetLabel, b: otherLabel }, `How much bigger is ${targetLabel} than ${otherLabel}?`)
        : t('dgPromptRead', { label: targetLabel }, `Read the value for "${targetLabel}" from the bar chart!`),
      subtitle: t('dgSubRead', { scale: LabHost.fmtNum(scale) }, `Check the scale on the left: 1 grid step = ${LabHost.fmtNum(scale)}!`),
      fields: [{ id: 'ans', label: t('dgValueLabel', null, 'Value:'), placeholder: '' }],
    };
  }

  function makeBuildChartTask(scale, targetUnits) {
    const t = LabHost.t;
    const targetValue = Math.round(targetUnits * scale);
    return {
      tier: 1,
      kind: 'build',
      scale,
      targetUnits,
      targetValue,
      maxUnits: 8,
      prompt: t('dgPromptBuild', { val: LabHost.fmtNum(targetValue), scale: LabHost.fmtNum(scale) },
        `Set the bar height to ${LabHost.fmtNum(targetValue)} (1 grid step = ${LabHost.fmtNum(scale)})!`),
      subtitle: t('dgSubBuild', null, 'Use + / − (half steps allowed!) to raise the bar to the exact value.'),
    };
  }

  function makePlausibilityTask(expr, exact, estText, options) {
    const t = LabHost.t;
    return {
      tier: 2,
      kind: 'plausibility',
      expr,
      exact,
      estText,
      options: LabHost.shuffle(options),
      answer: exact,
      hideSubmitBtn: true,
      prompt: t('dgPromptEst', { expr }, `Überschlag check: Which result is plausible for ${expr}?`),
      subtitle: t('dgSubEst', null, 'Don\'t compute every digit — round both numbers first and check which answer matches the size!'),
    };
  }

  function buildCourse() {
    return [
      makeReadChartTask({ scale: 1000, units: [3, 5, 2, 6], targetIdx: 1 }),
      makeReadChartTask({ scale: 2000, units: [2, 4.5, 3, 5], targetIdx: 1 }), // Halfway grid tick!
      makeReadChartTask({ scale: 500,  units: [4, 7, 3, 6], targetIdx: 1, askDiff: true, otherIdx: 2 }),
      makeBuildChartTask(2000, 3.5),
      makeBuildChartTask(5000, 6),
      makePlausibilityTask('39 840 + 21 150', 60990, '40 000 + 20 000 = 60 000', [
        { val: 60990, tag: 'ok' },
        { val: 6099,  tag: 'scale_10x' },
        { val: 40990, tag: 'implausible_exact_trap' },
      ]),
      makePlausibilityTask('498 · 19', 9462, '500 · 20 = 10 000', [
        { val: 9462,  tag: 'ok' },
        { val: 94620, tag: 'scale_10x' },
        { val: 4462,  tag: 'implausible_exact_trap' },
      ]),
      makePlausibilityTask('81 240 − 29 890', 51350, '80 000 − 30 000 = 50 000', [
        { val: 51350, tag: 'ok' },
        { val: 71350, tag: 'implausible_exact_trap' },
        { val: 5135,  tag: 'scale_10x' },
      ]),
    ];
  }

  function genTask(tier) {
    if (tier === 0) {
      const scale = LabHost.pick([500, 1000, 2000, 5000, 10000]);
      const units = [1, 2, 3, 4].map(() => LabHost.pick([2, 2.5, 3, 3.5, 4, 4.5, 5, 6]));
      const targetIdx = LabHost.randInt(0, 3);
      return makeReadChartTask({ scale, units, targetIdx });
    }
    if (tier === 1) {
      const scale = LabHost.pick([500, 1000, 2000, 10000]);
      const targetUnits = LabHost.pick([2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6]);
      return makeBuildChartTask(scale, targetUnits);
    }
    const a = LabHost.randInt(2, 6) * 100 + LabHost.randInt(-8, 8);
    const b = LabHost.randInt(2, 8) * 10 + LabHost.randInt(-2, 2);
    const exact = a * b;
    const ra = Math.round(a / 100) * 100;
    const rb = Math.round(b / 10) * 10;
    return makePlausibilityTask(`${LabHost.fmtNum(a)} · ${b}`, exact, `${LabHost.fmtNum(ra)} · ${rb} = ${LabHost.fmtNum(ra * rb)}`, [
      { val: exact, tag: 'ok' },
      { val: exact * 10, tag: 'scale_10x' },
      { val: Math.max(100, exact - ra * 10), tag: 'implausible_exact_trap' },
    ]);
  }

  function buildRound({ mode, tier }) {
    if (mode === 'course') return buildCourse();
    const tiers = tier === 'mixed' ? [0, 0, 0, 1, 1, 2, 2, 2] : Array(8).fill(tier);
    return tiers.map(ti => genTask(ti));
  }

  // ---- Interactive SVG Bar Chart & Estimation Visual ----
  function renderVisual(container, task, state, h) {
    if (task.kind === 'read') {
      const maxU = 7;
      const chartLeft = 74, chartBottom = 186, chartTop = 22, barW = 48, gap = 32;
      const stepPx = (chartBottom - chartTop) / maxU;
      let svg = '';

      // Horizontal grid lines + y-axis labels
      for (let u = 0; u <= maxU; u++) {
        const y = chartBottom - u * stepPx;
        svg += `<line x1="${chartLeft}" y1="${y}" x2="410" y2="${y}" stroke="rgba(255,255,255,0.16)" stroke-width="1"/>`;
        svg += `<text x="${chartLeft - 8}" y="${y + 4}" fill="#b8c4e6" font-size="11" font-weight="700" text-anchor="end">${h.fmtNum(u * task.scale)}</text>`;
      }

      // Bars
      task.units.forEach((u, i) => {
        const x = chartLeft + 24 + i * (barW + gap);
        const bh = u * stepPx;
        const y = chartBottom - bh;
        const isHi = i === task.targetIdx || (task.askDiff && i === task.otherIdx);
        svg += `<rect x="${x}" y="${y}" width="${barW}" height="${bh}" rx="6" fill="${isHi ? '#38ef7d' : '#6c63ff'}" fill-opacity="${isHi ? 0.78 : 0.45}" stroke="${isHi ? '#7ef9ae' : '#8fa3cf'}" stroke-width="2"/>`;
        svg += `<text x="${x + barW / 2}" y="${chartBottom + 18}" fill="#fff" font-size="12" font-weight="900" text-anchor="middle">${BAR_LABELS[i]}</text>`;
        if (isHi && (state.showHintVisual || state.showSolutionVisual)) {
          svg += `<line x1="${chartLeft}" y1="${y}" x2="${x}" y2="${y}" stroke="#ffd166" stroke-width="2.5" stroke-dasharray="5 3"/>`;
        }
        if (state.showSolutionVisual) {
          svg += `<text x="${x + barW / 2}" y="${y - 6}" fill="#ffd166" font-size="11" font-weight="900" text-anchor="middle">${h.fmtNum(task.values[i])}</text>`;
        }
      });

      container.innerHTML = `<svg viewBox="0 0 430 214" role="img" aria-label="Scaled bar chart">${svg}</svg>`;
      return;
    }

    if (task.kind === 'build') {
      if (state.customState.barUnits == null) state.customState.barUnits = 0;
      const curU = state.customState.barUnits;
      const maxU = task.maxUnits;
      const chartLeft = 74, chartBottom = 186, chartTop = 20;
      const stepPx = (chartBottom - chartTop) / maxU;
      let svg = '';
      for (let u = 0; u <= maxU; u++) {
        const y = chartBottom - u * stepPx;
        svg += `<line x1="${chartLeft}" y1="${y}" x2="320" y2="${y}" stroke="rgba(255,255,255,0.16)"/>`;
        svg += `<text x="${chartLeft - 8}" y="${y + 4}" fill="#b8c4e6" font-size="11" font-weight="700" text-anchor="end">${h.fmtNum(u * task.scale)}</text>`;
      }
      const bh = curU * stepPx;
      svg += `<rect x="150" y="${chartBottom - bh}" width="76" height="${bh}" rx="6" fill="rgba(56,239,125,0.68)" stroke="#38ef7d" stroke-width="2"/>`;
      if (curU > 0) {
        svg += `<text x="188" y="${chartBottom - bh - 6}" fill="#ffd166" font-size="12" font-weight="900" text-anchor="middle">${curU} ${h.esc(h.t('dgStepsWord', null, 'steps'))}</text>`;
      }

      container.innerHTML = `
        <svg viewBox="0 0 340 206" style="max-width:340px" role="img" aria-label="Interactive bar builder">${svg}</svg>
        ${!state.solved ? `<div class="lh-choice-grid" style="margin:4px 0">
          <button type="button" class="nl-chip-btn" id="dg-minus-1">− 1</button>
          <button type="button" class="nl-chip-btn" id="dg-minus-half">− ½</button>
          <button type="button" class="nl-chip-btn active" id="dg-plus-half">+ ½</button>
          <button type="button" class="nl-chip-btn active" id="dg-plus-1">+ 1</button>
        </div>` : ''}
      `;
      const updateU = delta => {
        const next = Math.max(0, Math.min(maxU, Math.round((curU + delta) * 2) / 2));
        state.customState.barUnits = next;
        h.setInteractiveValue(next);
        h.redraw();
      };
      const b1 = container.querySelector('#dg-minus-1'); if (b1) b1.addEventListener('click', () => updateU(-1));
      const b2 = container.querySelector('#dg-minus-half'); if (b2) b2.addEventListener('click', () => updateU(-0.5));
      const b3 = container.querySelector('#dg-plus-half'); if (b3) b3.addEventListener('click', () => updateU(0.5));
      const b4 = container.querySelector('#dg-plus-1'); if (b4) b4.addEventListener('click', () => updateU(1));
      return;
    }

    // Plausibility visual
    container.innerHTML = `
      <div class="pv-prompt-card" style="font-size:1.45rem;font-weight:900">${h.esc(task.expr)}</div>
      ${state.showHintVisual || state.showSolutionVisual
        ? `<div style="font-size:0.95rem;color:#ffd166;font-weight:800">Überschlag: ${h.esc(task.estText)}</div>`
        : ''}
    `;
  }

  function renderInputs(container, task, state, h) {
    if (task.kind === 'build') {
      container.innerHTML = '';
      return;
    }
    if (task.kind === 'plausibility') {
      container.innerHTML = `<div class="lh-choice-grid">${task.options.map(opt => `
        <button type="button" class="lh-choice-btn ${state.interactiveValue === opt.val ? 'active' : ''}" data-val="${opt.val}" ${state.solved ? 'disabled' : ''}>${h.fmtNum(opt.val)}</button>
      `).join('')}</div>`;
      container.querySelectorAll('.lh-choice-btn').forEach(btn => {
        btn.addEventListener('click', () => h.submitDirect(parseInt(btn.dataset.val, 10)));
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
  }

  // ---- Diagnostic Error Engine ----
  function checkAnswer(task, submission, state, h) {
    if (task.kind === 'read') {
      const val = h.parseDec(submission.values.ans);
      if (isNaN(val)) return { empty: true };
      if (Math.abs(val - task.answer) < 0.01) {
        return { ok: true, title: h.t('dgGoodTitle', null, 'Read accurately!'), message: `<b>${h.fmtNum(task.answer)}</b>` };
      }
      if (Math.abs(val - task.gridCountTrap) < 0.01) {
        return {
          ok: false,
          category: 'read_grid_count',
          showHintVisual: true,
          title: h.t('dgErrGridTitle', null, 'Remember the chart scale!'),
          message: h.t('dgErrGridMsg', { steps: task.gridCountTrap, scale: h.fmtNum(task.scale) }, `You counted <b>${task.gridCountTrap}</b> grid steps — multiply by the scale <b>${h.fmtNum(task.scale)}</b>!`),
        };
      }
      if (task.isHalf && Math.abs(val - task.answer) === task.scale / 2) {
        return {
          ok: false,
          category: 'halfway_tick_slip',
          showHintVisual: true,
          title: h.t('dgErrHalfTitle', null, 'The bar stops halfway between two lines!'),
          message: h.t('dgErrHalfMsg', { half: h.fmtNum(task.scale / 2) }, `Half a grid step is worth <b>${h.fmtNum(task.scale / 2)}</b>.`),
        };
      }
      if (val === task.answer * 10 || val * 10 === task.answer) {
        return {
          ok: false,
          category: 'scale_10x',
          showHintVisual: true,
          title: h.t('dgErrScale10Title', null, 'Check the zeros on the axis!'),
          message: h.t('dgErrScale10Msg', { scale: h.fmtNum(task.scale) }, `One step is <b>${h.fmtNum(task.scale)}</b> — check how many zeros belong on the end.`),
        };
      }
      return { ok: false, category: 'chart_read', showHintVisual: true, title: h.t('labTryAgainTitle', null, 'Trace horizontally to the axis!'), message: '' };
    }

    if (task.kind === 'build') {
      const curU = submission.interactive != null ? submission.interactive : (state.customState.barUnits || 0);
      if (curU === 0) return { empty: true, title: h.t('dgBuildEmpty', null, 'Tap + 1 or + ½ to raise the bar first!') };
      if (Math.abs(curU - task.targetUnits) < 0.001) {
        return { ok: true, title: h.t('dgGoodTitle', null, 'Exact bar height!'), message: `${curU} · ${h.fmtNum(task.scale)} = <b>${h.fmtNum(task.targetValue)}</b>` };
      }
      return {
        ok: false,
        category: 'build_height',
        title: h.t('dgErrBuildTitle', null, 'Adjust the bar height!'),
        message: h.t('dgErrBuildMsg', { cur: h.fmtNum(Math.round(curU * task.scale)), target: h.fmtNum(task.targetValue) }, `Your bar currently shows <b>${h.fmtNum(Math.round(curU * task.scale))}</b>, goal is <b>${h.fmtNum(task.targetValue)}</b>.`),
      };
    }

    // Plausibility check
    const ch = submission.interactive;
    if (ch == null) return { empty: true };
    if (ch === task.answer) {
      return { ok: true, title: h.t('dgGoodTitle', null, 'Sharp Überschlag!'), message: `${h.esc(task.estText)} → <b>${h.fmtNum(task.answer)}</b>` };
    }
    const chosenOpt = task.options.find(o => o.val === ch);
    return {
      ok: false,
      category: chosenOpt ? chosenOpt.tag : 'implausible_exact_trap',
      showHintVisual: true,
      title: h.t('dgErrEstTitle', null, 'Compare with the rounded Überschlag!'),
      message: h.t('dgErrEstMsg', { est: task.estText, chosen: h.fmtNum(ch) }, `The estimation gives <b>${h.esc(task.estText)}</b> — ${h.fmtNum(ch)} is much too far away!`),
    };
  }

  function getHint(task, state, level, h) {
    if (task.kind === 'read') {
      return { title: h.t('labHintTitle', null, '💡 Hint'), html: h.t('dgHintRead', { scale: h.fmtNum(task.scale) }, `Follow the golden dashed line to the axis. Each grid box = <b>${h.fmtNum(task.scale)}</b>, half a box = <b>${h.fmtNum(task.scale / 2)}</b>.`) };
    }
    if (task.kind === 'build') {
      return { title: h.t('labHintTitle', null, '💡 Hint'), html: h.t('dgHintBuild', { val: h.fmtNum(task.targetValue), scale: h.fmtNum(task.scale), steps: task.targetUnits }, `${h.fmtNum(task.targetValue)} ÷ ${h.fmtNum(task.scale)} = <b>${task.targetUnits}</b> grid steps!`) };
    }
    return { title: h.t('labHintTitle', null, '💡 Hint'), html: `Überschlag: <b>${h.esc(task.estText)}</b>` };
  }

  function getSolution(task, state, h) {
    if (task.kind === 'plausibility') return { html: `Überschlag: ${h.esc(task.estText)} ⇒ <b>${h.fmtNum(task.answer)}</b>` };
    if (task.kind === 'build') return { html: `${task.targetUnits} · ${h.fmtNum(task.scale)} = <b>${h.fmtNum(task.targetValue)}</b>` };
    return { html: `<b>${h.fmtNum(task.answer)}</b>` };
  }

  function getTrickkiste(task, state, h) {
    return {
      heading: h.t('dgTrickHeading', null, 'Reading Charts & Estimation:'),
      formulaHtml: h.t('dgTrickFormula', null, 'Value = grid steps × scale<br>Half box = ½ × scale'),
      descHtml: h.t('dgTrickDesc', null, 'Always inspect the <b>y-axis scale</b> before reading a bar — and round first for an <b>Überschlag</b>!'),
      miniSvgHtml: `<svg viewBox="0 0 218 46" role="img" aria-label="1 step equals 2000, half step equals 1000">
        <rect x="10" y="6" width="198" height="34" rx="8" fill="rgba(56,239,125,0.14)" stroke="#38ef7d"/>
        <text x="109" y="28" fill="#fff" font-size="11" font-weight="900" text-anchor="middle">1 step = 2 000 · ½ step = 1 000</text>
      </svg>`,
      miniDesc: h.t('dgMiniDesc', null, 'Always check the axis scale first ✅'),
      asideTipHtml: h.t('dgAsideTip', null, 'Tip: A quick Überschlag immediately catches missing or extra zeros!'),
    };
  }

  const def = {
    id: 'charts',
    chapter: 3,
    prefix: 'dg',
    icon: '📊',
    roundSize: 8,
    levels: [
      { id: 0, labelKey: 'dgTier0', chipKey: 'dgChip0' },
      { id: 1, labelKey: 'dgTier1', chipKey: 'dgChip1' },
      { id: 2, labelKey: 'dgTier2', chipKey: 'dgChip2' },
    ],
    buildRound,
    renderVisual,
    renderInputs,
    checkAnswer,
    getHint,
    getSolution,
    getTrickkiste,
    makeReadChartTask,
    makeBuildChartTask,
    makePlausibilityTask,
  };

  if (typeof LabHost !== 'undefined' && LabHost.register) LabHost.register(def);
  return def;
})();
