// Klasse 4 Lab 9: Geometrie-Labor II (Achsensymmetrie, Maßstab, Würfelgebäude & Würfelnetze)
// PIKAS Grade 4: Spiegeln am Gitter, Vergrößern & Verkleinern (1:2, 2:1, 1:10), Baupläne & Würfelnetze.

const GeometryLab = (() => {
  'use strict';

  // ---- Tier 0: Mirror Symmetry on a 5x6 grid (vertical axis between col 2 and col 3) ----
  function makeSymmetryTask(leftCoords) {
    const t = LabHost.t;
    const rows = 5, halfCols = 3;
    const expectedRight = leftCoords.map(([r, c]) => `${r},${halfCols - 1 - c}`).sort();
    // Translation trap: copying leftCoords onto right half WITHOUT flipping horizontally!
    const translatedRight = leftCoords.map(([r, c]) => `${r},${c}`).sort();
    return {
      tier: 0,
      kind: 'symmetry',
      rows,
      halfCols,
      leftCoords,
      expectedRight,
      translatedRight,
      prompt: t('gmPromptSym', null, 'Mirror the purple pattern across the yellow axis!'),
      subtitle: t('gmSubSym', null, 'Tap squares on the right side so the left and right halves fold exactly onto each other.'),
    };
  }

  // ---- Tier 1: Maßstab (Scale 2:1, 1:2, 1:10) ----
  function makeScaleTask(origW, origH, scaleLabel, factor) {
    const t = LabHost.t;
    const newW = origW * factor;
    const newH = origH * factor;
    return {
      tier: 1,
      kind: 'scale',
      origW,
      origH,
      scaleLabel,
      factor,
      newW,
      newH,
      twoStep: true,
      prompt: t('gmPromptScale', {
        w: origW, h: origH, scale: scaleLabel,
      }, `Scale a ${origW} cm × ${origH} cm rectangle with scale ${scaleLabel}!`),
      subtitle: t('gmSubScale', null, 'Remember: Scaling changes BOTH the width and the height by the same factor!'),
      fields: [
        { id: 'w', label: t('gmWidthLabel', null, '1. New width:'), unit: 'cm', placeholder: '' },
        { id: 'h', label: t('gmHeightLabel', null, '2. New height:'), unit: 'cm', placeholder: '' },
      ],
    };
  }

  // ---- Tier 2: Würfelgebäude ↔ Bauplan & Würfelnetze ----
  function makeBauplanTask(heights) {
    const t = LabHost.t;
    const total = heights.flat().reduce((a, b) => a + b, 0);
    // Visible-only trap: forgetting bottom hidden cubes under towers > 1
    let hidden = 0;
    heights.forEach(row => row.forEach(h => { if (h > 1) hidden += h - 1; }));
    return {
      tier: 2,
      kind: 'bauplan',
      heights, // 2x3 or 3x3 height matrix
      answer: total,
      hiddenCount: hidden,
      prompt: t('gmPromptBauplan', null, 'How many unit cubes build this cube tower (including hidden bottom cubes)?'),
      subtitle: t('gmSubBauplan', null, 'Read the Bauplan numbers — each number tells how many cubes stand stacked in that spot!'),
      fields: [{ id: 'ans', label: t('gmCubesLabel', null, 'Total cubes:'), placeholder: '' }],
    };
  }

  // Valid & invalid 6-square cube nets (relative coords [r, c])
  const VALID_NETS = [
    { name: 'cross',  coords: [[0,1],[1,0],[1,1],[1,2],[1,3],[2,1]] },
    { name: 'T',      coords: [[0,0],[1,0],[1,1],[1,2],[1,3],[2,0]] },
    { name: 'stairs', coords: [[0,0],[0,1],[1,1],[1,2],[2,2],[2,3]] },
    { name: 'Z',      coords: [[0,0],[0,1],[1,1],[1,2],[1,3],[2,3]] },
  ];
  const INVALID_NETS = [
    { name: '2x3block', coords: [[0,0],[0,1],[0,2],[1,0],[1,1],[1,2]], reason: 'gmNetReasonOverlap' },
    { name: 'sameSide', coords: [[0,0],[0,2],[1,0],[1,1],[1,2],[1,3]], reason: 'gmNetReasonSameSide' },
    { name: 'line6',    coords: [[0,0],[0,1],[0,2],[0,3],[0,4],[0,5]], reason: 'gmNetReasonLine' },
  ];

  function makeCubeNetTask(netObj, isValid) {
    const t = LabHost.t;
    return {
      tier: 2,
      kind: 'cubenet',
      net: netObj,
      isValid,
      answer: isValid ? 'yes' : 'no',
      hideSubmitBtn: true,
      prompt: t('gmPromptNet', null, 'Can this 6-square net fold into a closed cube (Würfelnetz)?'),
      subtitle: t('gmSubNet', null, 'Imagine folding up the walls — does every face cover a unique side without overlapping?'),
    };
  }

  function buildCourse() {
    return [
      makeSymmetryTask([[0,2],[1,1],[1,2],[2,0],[2,2],[3,1],[4,2]]),
      makeSymmetryTask([[0,0],[1,0],[1,1],[2,2],[3,1],[4,0]]),
      makeScaleTask(3, 2, '2 : 1', 2),
      makeScaleTask(8, 6, '1 : 2', 0.5),
      makeScaleTask(4, 3, '3 : 1', 3),
      makeBauplanTask([[3, 2, 1], [1, 2, 0]]),
      makeCubeNetTask(VALID_NETS[0], true),
      makeCubeNetTask(INVALID_NETS[1], false),
    ];
  }

  function genTask(tier) {
    if (tier === 0) {
      const coords = [];
      const seen = new Set();
      while (coords.length < 6) {
        const r = LabHost.randInt(0, 4), c = LabHost.randInt(0, 2);
        const k = `${r},${c}`;
        if (!seen.has(k)) { seen.add(k); coords.push([r, c]); }
      }
      return makeSymmetryTask(coords);
    }
    if (tier === 1) {
      const cfg = LabHost.pick([
        { label: '2 : 1', factor: 2,   w: LabHost.randInt(2, 6), h: LabHost.randInt(2, 5) },
        { label: '1 : 2', factor: 0.5, w: LabHost.randInt(2, 6) * 2, h: LabHost.randInt(2, 5) * 2 },
        { label: '1 : 10', factor: 0.1, w: LabHost.randInt(2, 9) * 10, h: LabHost.randInt(2, 6) * 10 },
      ]);
      return makeScaleTask(cfg.w, cfg.h, cfg.label, cfg.factor);
    }
    if (Math.random() < 0.5) {
      const mat = [
        [LabHost.randInt(2, 4), LabHost.randInt(1, 3), LabHost.randInt(0, 2)],
        [LabHost.randInt(1, 2), LabHost.randInt(1, 2), LabHost.randInt(0, 1)],
      ];
      return makeBauplanTask(mat);
    }
    const valid = Math.random() < 0.5;
    return makeCubeNetTask(LabHost.pick(valid ? VALID_NETS : INVALID_NETS), valid);
  }

  function buildRound({ mode, tier }) {
    if (mode === 'course') return buildCourse();
    const tiers = tier === 'mixed' ? [0, 0, 1, 1, 1, 2, 2, 2] : Array(8).fill(tier);
    return tiers.map(ti => genTask(ti));
  }

  // ---- Interactive Visuals ----
  function renderVisual(container, task, state, h) {
    if (task.kind === 'symmetry') {
      if (!state.customState.rightPicked) state.customState.rightPicked = new Set();
      const picked = state.customState.rightPicked;
      const leftSet = new Set(task.leftCoords.map(([r, c]) => `${r},${c}`));
      const expectedSet = new Set(task.expectedRight);
      const cell = 42, pad = 16;
      const w = task.halfCols * 2 * cell + pad * 2;
      const hSvg = task.rows * cell + pad * 2;
      const axisX = pad + task.halfCols * cell;

      let svg = '';
      for (let r = 0; r < task.rows; r++) {
        for (let c = 0; c < task.halfCols; c++) {
          const on = leftSet.has(`${r},${c}`);
          svg += `<rect x="${pad + c * cell}" y="${pad + r * cell}" width="${cell}" height="${cell}"
            fill="${on ? 'rgba(108,99,255,0.65)' : 'rgba(255,255,255,0.04)'}" stroke="rgba(255,255,255,0.22)"/>`;
        }
        for (let c = 0; c < task.halfCols; c++) {
          const k = `${r},${c}`;
          const on = picked.has(k) || (state.showSolutionVisual && expectedSet.has(k));
          const hintGlow = state.showHintVisual && expectedSet.has(k) && !picked.has(k);
          svg += `<rect class="gm-sym-cell" data-k="${k}" x="${axisX + c * cell}" y="${pad + r * cell}" width="${cell}" height="${cell}"
            fill="${on ? 'rgba(56,239,125,0.52)' : hintGlow ? 'rgba(255,209,102,0.18)' : 'rgba(255,255,255,0.04)'}"
            stroke="${hintGlow ? '#ffd166' : 'rgba(255,255,255,0.22)'}" style="cursor:pointer"/>`;
        }
      }
      svg += `<line x1="${axisX}" y1="6" x2="${axisX}" y2="${hSvg - 6}" stroke="#ffd166" stroke-width="4" stroke-dasharray="6 4"/>`;

      container.innerHTML = `<svg viewBox="0 0 ${w} ${hSvg}" style="max-width:${w}px" role="img" aria-label="Mirror symmetry grid">${svg}</svg>`;
      if (!state.solved) {
        container.querySelectorAll('.gm-sym-cell').forEach(el => {
          el.addEventListener('click', () => {
            const k = el.dataset.k;
            if (picked.has(k)) picked.delete(k); else picked.add(k);
            h.setInteractiveValue(Array.from(picked).sort());
            h.redraw();
          });
        });
      }
      return;
    }

    if (task.kind === 'scale') {
      const box1W = 90, box1H = Math.max(44, Math.round(90 * (task.origH / task.origW)));
      const mult = task.factor >= 1 ? 1.45 : 0.65;
      const box2W = Math.round(box1W * mult), box2H = Math.round(box1H * mult);
      container.innerHTML = `
        <svg viewBox="0 0 420 150" role="img" aria-label="Scale comparison">
          <rect x="34" y="${75 - box1H / 2}" width="${box1W}" height="${box1H}" rx="4" fill="rgba(108,99,255,0.35)" stroke="#6c63ff" stroke-width="2.5"/>
          <text x="${34 + box1W / 2}" y="${75 - box1H / 2 - 8}" fill="#e8ecff" font-size="12" font-weight="800" text-anchor="middle">${task.origW} cm</text>
          <text x="18" y="79" fill="#e8ecff" font-size="12" font-weight="800" text-anchor="middle">${task.origH}</text>
          <text x="188" y="68" fill="#ffd166" font-size="14" font-weight="900" text-anchor="middle">${h.esc(task.scaleLabel)}</text>
          <text x="188" y="88" fill="#7ef9ae" font-size="18" font-weight="900" text-anchor="middle">→</text>
          <rect x="242" y="${75 - box2H / 2}" width="${box2W}" height="${box2H}" rx="4" fill="rgba(56,239,125,0.28)" stroke="#38ef7d" stroke-width="2.5"/>
          <text x="${242 + box2W / 2}" y="${75 - box2H / 2 - 8}" fill="#7ef9ae" font-size="12" font-weight="800" text-anchor="middle">${(state.stepIdx > 0 || state.solved) ? `${task.newW} cm` : '? cm'}</text>
          <text x="${242 + box2W + 22}" y="79" fill="#7ef9ae" font-size="12" font-weight="800" text-anchor="middle">${state.solved ? `${task.newH} cm` : '?'}</text>
        </svg>
      `;
      return;
    }

    if (task.kind === 'bauplan') {
      // Render isometric 3D cube stack SVG + Bauplan matrix side-by-side
      const dx = 28, dy = 15, dz = 24;
      let cubesSvg = '';
      const ox = 120, oy = 115;
      for (let r = 0; r < task.heights.length; r++) {
        for (let c = 0; c < task.heights[r].length; c++) {
          const stack = task.heights[r][c];
          for (let z = 0; z < stack; z++) {
            const x = ox + (c - r) * dx;
            const y = oy + (c + r) * dy - z * dz;
            // Top face, left face, right face
            cubesSvg += `<polygon points="${x},${y - dz} ${x + dx},${y - dz + dy} ${x},${y - dz + 2 * dy} ${x - dx},${y - dz + dy}" fill="#7f78ff" stroke="#181b38" stroke-width="1.2"/>`;
            cubesSvg += `<polygon points="${x - dx},${y - dz + dy} ${x},${y - dz + 2 * dy} ${x},${y + 2 * dy} ${x - dx},${y + dy}" fill="#5049c9" stroke="#181b38" stroke-width="1.2"/>`;
            cubesSvg += `<polygon points="${x + dx},${y - dz + dy} ${x},${y - dz + 2 * dy} ${x},${y + 2 * dy} ${x + dx},${y + dy}" fill="#38ef7d" fill-opacity="0.72" stroke="#181b38" stroke-width="1.2"/>`;
          }
        }
      }
      const bpRows = task.heights.map(row => row.map(v => `<div class="gm-bp-cell" style="display:flex;align-items:center;justify-content:center;cursor:default">${v}</div>`).join('')).join('');
      container.innerHTML = `
        <div style="display:flex;flex-wrap:wrap;gap:18px;align-items:center;justify-content:center">
          <svg viewBox="0 0 260 175" style="max-width:250px" role="img" aria-label="3D cube building">${cubesSvg}</svg>
          <div>
            <div style="font-size:0.8rem;font-weight:800;color:#ffd166;margin-bottom:5px;text-align:center">Bauplan</div>
            <div class="gm-bauplan" style="grid-template-columns:repeat(${task.heights[0].length}, 44px)">${bpRows}</div>
          </div>
        </div>
      `;
      return;
    }

    // Cube net visual
    const coords = task.net.coords;
    const maxR = Math.max(...coords.map(p => p[0])) + 1;
    const maxC = Math.max(...coords.map(p => p[1])) + 1;
    const cell = 42, pad = 16;
    const w = maxC * cell + pad * 2, hSvg = maxR * cell + pad * 2;
    const rects = coords.map(([r, c], idx) => `
      <rect x="${pad + c * cell}" y="${pad + r * cell}" width="${cell}" height="${cell}"
        fill="${idx === 1 ? 'rgba(255,209,102,0.42)' : 'rgba(108,99,255,0.45)'}"
        stroke="#f0f2ff" stroke-width="2"/>
      ${idx === 1 ? `<text x="${pad + c * cell + cell / 2}" y="${pad + r * cell + cell / 2 + 4}" fill="#ffd166" font-size="11" font-weight="900" text-anchor="middle">B</text>` : ''}
    `).join('');
    container.innerHTML = `<svg viewBox="0 0 ${w} ${hSvg}" style="max-width:${w}px" role="img" aria-label="Cube net candidate">${rects}</svg>
      <div style="font-size:0.8rem;color:#b8c4e6">B = ${h.esc(h.t('gmBaseLabel', null, 'Bottom face (Grundfläche)'))}</div>`;
  }

  function renderInputs(container, task, state, h) {
    if (task.kind === 'symmetry') {
      container.innerHTML = '';
      return;
    }
    if (task.kind === 'cubenet') {
      container.innerHTML = `<div class="lh-choice-grid">
        <button type="button" class="lh-choice-btn ${state.interactiveValue === 'yes' ? 'active' : ''}" data-ch="yes" ${state.solved ? 'disabled' : ''}>✅ ${h.esc(h.t('gmNetYes', null, 'Yes, folds into a cube!'))}</button>
        <button type="button" class="lh-choice-btn ${state.interactiveValue === 'no' ? 'active' : ''}" data-ch="no" ${state.solved ? 'disabled' : ''}>❌ ${h.esc(h.t('gmNetNo', null, 'No, faces overlap / gap!'))}</button>
      </div>`;
      container.querySelectorAll('.lh-choice-btn').forEach(btn => {
        btn.addEventListener('click', () => h.submitDirect(btn.dataset.ch));
      });
      return;
    }

    const fields = task.fields || [];
    let html = `<div class="nl-fieldset ${fields.length > 1 ? '' : 'lh-fieldset-single'}">`;
    fields.forEach((f, idx) => {
      const isLocked = task.twoStep && idx > state.stepIdx && !state.solved;
      const isDone = task.twoStep && idx < state.stepIdx;
      const disabled = (isLocked || state.solved) ? 'disabled' : '';
      const val = f._value != null ? h.esc(f._value) : '';
      html += `<div class="nl-field ${isLocked ? 'nl-field-locked' : isDone ? 'nl-field-done' : ''}">
        <label for="lh-in-${f.id}">${h.esc(f.label)}</label>
        <div class="lh-input-row">
          <input id="lh-in-${f.id}" name="${f.id}" type="text" inputmode="numeric" autocomplete="off" value="${val}" ${disabled}>
          ${f.unit ? `<span class="lh-unit-tag">${h.esc(f.unit)}</span>` : ''}
        </div>
      </div>`;
    });
    html += `</div>`;
    container.innerHTML = html;
  }

  // ---- Diagnostic Error Engine ----
  function checkAnswer(task, submission, state, h) {
    if (task.kind === 'symmetry') {
      const picked = (submission.interactive || Array.from(state.customState.rightPicked || [])).slice().sort();
      if (picked.length === 0) return { empty: true, title: h.t('gmSymEmpty', null, 'Tap squares on the right side of the mirror axis first!') };
      if (picked.join('|') === task.expectedRight.join('|')) {
        return { ok: true, title: h.t('gmGoodTitle', null, 'Perfect mirror reflection!'), message: h.t('gmSymGoodMsg', null, 'Every square sits at the exact same distance from the mirror axis.') };
      }
      if (picked.join('|') === task.translatedRight.join('|') && task.translatedRight.join('|') !== task.expectedRight.join('|')) {
        return {
          ok: false,
          category: 'translation_not_reflection',
          showHintVisual: true,
          title: h.t('gmErrTransTitle', null, 'That is a shifted copy, not a mirror reflection!'),
          message: h.t('gmErrTransMsg', null, 'Close to the yellow mirror axis stays close to the axis — far from the axis stays far away!'),
        };
      }
      return {
        ok: false,
        category: 'symmetry_slip',
        showHintVisual: true,
        title: h.t('gmErrSymTitle', null, 'Check the distance to the mirror axis!'),
        message: h.t('gmErrSymMsg', null, 'Count how many squares each purple tile sits from the yellow line, then place its twin at the same distance on the right.'),
      };
    }

    if (task.kind === 'scale') {
      const isW = submission.stepIdx === 0;
      const expected = isW ? task.newW : task.newH;
      const orig = isW ? task.origW : task.origH;
      const val = h.parseDec(isW ? submission.values.w : submission.values.h);
      if (isNaN(val)) return { empty: true };
      if (Math.abs(val - expected) < 0.001) {
        if (isW) {
          return { ok: true, nextStep: true, title: `${task.newW} cm ✓`, message: h.t('gmScaleStep2', null, 'Now scale the height by the exact same factor!') };
        }
        return { ok: true, title: h.t('gmGoodTitle', null, 'Scaled cleanly!'), message: `${task.origW}×${task.origH} cm → <b>${task.newW}×${task.newH} cm</b>` };
      }
      if (val === orig) {
        return {
          ok: false,
          category: 'unscaled_dimension',
          title: h.t('gmErrUnscaledTitle', null, 'Scale BOTH sides!'),
          message: h.t('gmErrUnscaledMsg', { scale: task.scaleLabel }, `In scale <b>${task.scaleLabel}</b>, both width and height change together.`),
        };
      }
      if (Math.abs(val - orig / task.factor) < 0.001) {
        return {
          ok: false,
          category: 'inverted_scale',
          title: h.t('gmErrInvScaleTitle', null, 'Check enlarge vs. shrink!'),
          message: task.factor > 1
            ? h.t('gmErrEnlargeMsg', { scale: task.scaleLabel }, `<b>${task.scaleLabel}</b> means enlarge (multiply)!`)
            : h.t('gmErrShrinkMsg', { scale: task.scaleLabel }, `<b>${task.scaleLabel}</b> means shrink (divide)!`),
        };
      }
      return { ok: false, category: 'scale_slip', title: h.t('labTryAgainTitle', null, 'Check the scale factor!'), message: `Scale ${task.scaleLabel}` };
    }

    if (task.kind === 'bauplan') {
      const val = h.parseNum(submission.values.ans);
      if (isNaN(val)) return { empty: true };
      if (val === task.answer) {
        return { ok: true, title: h.t('gmGoodTitle', null, 'All cubes counted!'), message: `<b>${task.answer}</b> cubes` };
      }
      if (val < task.answer && val >= task.answer - task.hiddenCount) {
        return {
          ok: false,
          category: 'hidden_cubes_missed',
          title: h.t('gmErrHiddenTitle', null, 'Don\'t forget the hidden bottom cubes!'),
          message: h.t('gmErrHiddenMsg', null, 'Tall towers stand on hidden cubes underneath — simply add up every number in the <b>Bauplan</b>!'),
        };
      }
      return { ok: false, category: 'bauplan_sum', title: h.t('labTryAgainTitle', null, 'Add up all numbers in the Bauplan!'), message: '' };
    }

    // Cube net
    const ch = submission.interactive;
    if (!ch) return { empty: true };
    if (ch === task.answer) {
      return { ok: true, title: h.t('gmGoodTitle', null, 'Great spatial thinking!'), message: task.isValid ? h.t('gmNetGoodYes', null, 'Every face folds neatly into one of the 6 sides of the cube.') : h.t('gmNetGoodNo', null, 'Right — two faces would overlap when folded!') };
    }
    return {
      ok: false,
      category: 'cubenet_overlap',
      title: h.t('gmErrNetTitle', null, 'Fold it mentally from the yellow base B!'),
      message: task.isValid
        ? h.t('gmErrNetValid', null, 'Try folding the 4 sides around B up by 90° — the last square closes the lid cleanly!')
        : h.t('gmErrNetInvalid', null, 'When you fold around B, two squares land on the exact same side while another side stays open!'),
    };
  }

  function getHint(task, state, level, h) {
    if (task.kind === 'symmetry') return { title: h.t('labHintTitle', null, '💡 Hint'), html: h.t('gmHintSym', null, 'The golden outlines show where the mirrored tiles belong!') };
    if (task.kind === 'bauplan') return { title: h.t('labHintTitle', null, '💡 Hint'), html: h.t('gmHintBauplan', { sum: task.heights.flat().filter(v => v > 0).join(' + ') }, `Add the Bauplan numbers: <b>${task.heights.flat().filter(v => v > 0).join(' + ')}</b>`) };
    if (task.kind === 'scale') return { title: h.t('labHintTitle', null, '💡 Hint'), html: task.factor > 1 ? `Multiply both sides by ${task.factor}.` : `Divide both sides by ${Math.round(1 / task.factor)}.` };
    return { title: h.t('labHintTitle', null, '💡 Hint'), html: h.t('gmHintNet', null, 'A cube has 6 faces: bottom, 4 walls, and 1 lid. A 2×3 block or 6-in-a-row can never fold into a cube!') };
  }

  function getSolution(task, state, h) {
    if (task.kind === 'bauplan') return { html: `${task.heights.flat().filter(v => v > 0).join(' + ')} = <b>${task.answer}</b>` };
    if (task.kind === 'scale') return { html: `${task.origW} cm → <b>${task.newW} cm</b> · ${task.origH} cm → <b>${task.newH} cm</b>` };
    if (task.kind === 'cubenet') return { html: task.isValid ? h.t('gmNetYes', null, 'Valid cube net ✓') : h.t('gmNetNo', null, 'Invalid cube net ✗') };
    return { html: h.t('gmSymGoodMsg', null, 'Mirrored across the axis ✓') };
  }

  function getTrickkiste(task, state, h) {
    return {
      heading: h.t('gmTrickHeading', null, 'Geometry II Essentials:'),
      formulaHtml: h.t('gmTrickFormula', null, 'Mirror: equal distance to axis<br>Scale 2:1 = ×2 · 1:2 = ÷2'),
      descHtml: h.t('gmTrickDesc', null, 'In a <b>Bauplan</b>, adding all numbers automatically counts every hidden cube underneath!'),
      miniSvgHtml: `<svg viewBox="0 0 218 46" role="img" aria-label="Symmetry reflection">
        <rect x="44" y="10" width="24" height="24" fill="#6c63ff"/>
        <line x1="109" y1="4" x2="109" y2="42" stroke="#ffd166" stroke-width="3" stroke-dasharray="4 3"/>
        <rect x="150" y="10" width="24" height="24" fill="#38ef7d"/>
      </svg>`,
      miniDesc: h.t('gmMiniDesc', null, 'Same distance on both sides ✅'),
      asideTipHtml: h.t('gmAsideTip', null, 'Tip: A valid cube net has 6 squares and never contains a 2×2 block!'),
    };
  }

  const def = {
    id: 'geometry',
    chapter: 3,
    prefix: 'gm',
    icon: '🪞',
    roundSize: 8,
    levels: [
      { id: 0, labelKey: 'gmTier0', chipKey: 'gmChip0' },
      { id: 1, labelKey: 'gmTier1', chipKey: 'gmChip1' },
      { id: 2, labelKey: 'gmTier2', chipKey: 'gmChip2' },
    ],
    buildRound,
    renderVisual,
    renderInputs,
    checkAnswer,
    getHint,
    getSolution,
    getTrickkiste,
    makeSymmetryTask,
    makeScaleTask,
    makeBauplanTask,
    makeCubeNetTask,
  };

  if (typeof LabHost !== 'undefined' && LabHost.register) LabHost.register(def);
  return def;
})();
