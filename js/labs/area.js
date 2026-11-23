// Klasse 4 Lab 4: Flächen- & Umfangs-Labor (Area & Perimeter on Interactive Karogitter)
// PIKAS Grade 4: Flächeninhalt (Einheitsquadrate inkl. halbe Quadrate), Umfang (Zaun ablaufen),
// flächengleiche Figuren mit unterschiedlichem Umfang.

const AreaLab = (() => {
  'use strict';

  // Grid cell types: 0 = empty, 1 = full square (1 cm²), 2 = half-square triangle (0.5 cm²)
  function computeArea(grid) {
    let total = 0;
    for (const row of grid) {
      for (const c of row) {
        if (c === 1) total += 1;
        else if (c === 2) total += 0.5;
      }
    }
    return total;
  }

  // Computes outer perimeter (unit edges) of full-square polyominoes (cells === 1)
  function computePerimeter(grid) {
    const rows = grid.length;
    const cols = grid[0].length;
    let edges = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] !== 1) continue;
        if (r === 0 || grid[r - 1][c] !== 1) edges += 1;
        if (r === rows - 1 || grid[r + 1][c] !== 1) edges += 1;
        if (c === 0 || grid[r][c - 1] !== 1) edges += 1;
        if (c === cols - 1 || grid[r][c + 1] !== 1) edges += 1;
      }
    }
    return edges;
  }

  function boundingBoxPerimeter(grid) {
    let minR = 99, maxR = -1, minC = 99, maxC = -1;
    grid.forEach((row, r) => row.forEach((v, c) => {
      if (v > 0) {
        minR = Math.min(minR, r); maxR = Math.max(maxR, r);
        minC = Math.min(minC, c); maxC = Math.max(maxC, c);
      }
    }));
    if (maxR < minR) return 0;
    return 2 * ((maxR - minR + 1) + (maxC - minC + 1));
  }

  function makeGrid(rows, cols, filledCoords, halfCoords = []) {
    const g = Array.from({ length: rows }, () => Array(cols).fill(0));
    filledCoords.forEach(([r, c]) => { if (g[r] && g[r][c] !== undefined) g[r][c] = 1; });
    halfCoords.forEach(([r, c]) => { if (g[r] && g[r][c] !== undefined) g[r][c] = 2; });
    return g;
  }

  function rectGrid(w, h) {
    const coords = [];
    for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) coords.push([r, c]);
    return makeGrid(h, w, coords);
  }

  function makeAreaTask(grid, label, tier = 0) {
    const t = LabHost.t;
    const area = computeArea(grid);
    const hasHalves = grid.some(r => r.includes(2));
    const perimeter = hasHalves ? null : computePerimeter(grid);
    const halfCount = grid.flat().filter(v => v === 2).length;
    return {
      tier,
      kind: 'area',
      label,
      grid,
      area,
      perimeter,
      halfCount,
      prompt: t('arPromptArea', null, 'How big is the area (Flächeninhalt) of this figure?'),
      subtitle: hasHalves
        ? t('arSubAreaHalf', null, 'Tip: Tap squares to count them! Two half-triangles together make 1 whole square.')
        : t('arSubArea', null, 'Tap squares on the grid to count them — each square is 1 cm².'),
      fields: [{ id: 'area', label: t('arAreaField', null, 'Area:'), unit: 'cm²', placeholder: '' }],
    };
  }

  function makePerimeterTask(grid, label, tier = 1) {
    const t = LabHost.t;
    const area = computeArea(grid);
    const perimeter = computePerimeter(grid);
    const bboxP = boundingBoxPerimeter(grid);
    return {
      tier,
      kind: 'perimeter',
      label,
      grid,
      area,
      perimeter,
      bboxP,
      prompt: t('arPromptPerim', null, 'How long is the perimeter (Umfang) around this figure?'),
      subtitle: t('arSubPerim', null, 'Imagine walking a fence all the way around the outside edge — tap edges to count them!'),
      fields: [{ id: 'perim', label: t('arPerimField', null, 'Perimeter:'), unit: 'cm', placeholder: '' }],
    };
  }

  function makeBothTask(grid, label) {
    const t = LabHost.t;
    const area = computeArea(grid);
    const perimeter = computePerimeter(grid);
    const bboxP = boundingBoxPerimeter(grid);
    return {
      tier: 2,
      kind: 'both',
      twoStep: true,
      label,
      grid,
      area,
      perimeter,
      bboxP,
      prompt: t('arPromptBoth', null, 'Find BOTH the area (cm²) and the perimeter (cm)!'),
      subtitle: t('arSubBoth', null, 'Step 1: Count the inside squares (Area). Step 2: Walk the outer fence (Perimeter).'),
      fields: [
        { id: 'area',  label: t('arStep1Area', null, '1. Area (inside squares):'), unit: 'cm²', placeholder: '' },
        { id: 'perim', label: t('arStep2Perim', null, '2. Perimeter (outer fence):'), unit: 'cm', placeholder: '' },
      ],
    };
  }

  function makeBuildTask(targetArea, targetPerim) {
    const t = LabHost.t;
    return {
      tier: 2,
      kind: 'build',
      targetArea,
      targetPerim,
      rows: 5,
      cols: 6,
      prompt: t('arPromptBuild', { a: targetArea, p: targetPerim }, `Paint a connected figure with Area = ${targetArea} cm² and Perimeter = ${targetPerim} cm!`),
      subtitle: t('arSubBuild', null, 'Tap grid squares to add or remove them — watch how the same area can have different perimeters!'),
    };
  }

  function buildCourse() {
    // Curated 8 tasks mirroring Grade 4 Probearbeit Fläche & Umfang
    const lShape = makeGrid(4, 4, [[0,0],[1,0],[2,0],[3,0],[3,1],[3,2],[3,3]]);
    const halfHouse = makeGrid(4, 4, [[1,0],[1,1],[1,2],[1,3],[2,0],[2,1],[2,2],[2,3]], [[0,1],[0,2]]);
    const uShape = makeGrid(3, 4, [[0,0],[1,0],[2,0],[2,1],[2,2],[2,3],[1,3],[0,3]]);
    const tShape = makeGrid(3, 4, [[0,0],[0,1],[0,2],[0,3],[1,1],[1,2],[2,1],[2,2]]);
    const stair = makeGrid(3, 4, [[2,0],[2,1],[2,2],[2,3],[1,1],[1,2],[1,3],[0,2],[0,3]]);
    return [
      makeAreaTask(rectGrid(5, 3), 'rect', 0),
      makeAreaTask(lShape, 'L', 0),
      makeAreaTask(halfHouse, 'halves', 0),
      makePerimeterTask(rectGrid(5, 3), 'rect', 1),
      makePerimeterTask(uShape, 'U', 1),
      makeBothTask(tShape, 'T'),
      makeBothTask(stair, 'stair'),
      makeBuildTask(6, 12), // 2x3 -> P=10, 1x6 -> P=14, L/T -> P=12!
    ];
  }

  function randomShape(tier) {
    const kind = LabHost.pick(['rect', 'L', 'U', 'T']);
    if (kind === 'rect') {
      return rectGrid(LabHost.randInt(2, 6), LabHost.randInt(2, 4));
    }
    if (kind === 'L') {
      const h = LabHost.randInt(3, 4), w = LabHost.randInt(3, 5);
      const coords = [];
      for (let r = 0; r < h; r++) coords.push([r, 0]);
      for (let c = 1; c < w; c++) coords.push([h - 1, c]);
      return makeGrid(h, w, coords);
    }
    if (kind === 'U') {
      const h = 3, w = LabHost.randInt(3, 5);
      const coords = [];
      for (let r = 0; r < h; r++) { coords.push([r, 0]); coords.push([r, w - 1]); }
      for (let c = 1; c < w - 1; c++) coords.push([h - 1, c]);
      return makeGrid(h, w, coords);
    }
    const w = LabHost.randInt(3, 5);
    const coords = [];
    for (let c = 0; c < w; c++) coords.push([0, c]);
    const mid = Math.floor(w / 2);
    coords.push([1, mid], [2, mid]);
    return makeGrid(3, w, coords);
  }

  function genTask(tier) {
    if (tier === 0) {
      if (Math.random() < 0.35) {
        const w = LabHost.randInt(3, 5);
        const full = [];
        for (let c = 0; c < w; c++) { full.push([1, c]); full.push([2, c]); }
        return makeAreaTask(makeGrid(3, w, full, [[0, 0], [0, w - 1]]), 'halves', 0);
      }
      return makeAreaTask(randomShape(0), 'shape', 0);
    }
    if (tier === 1) return makePerimeterTask(randomShape(1), 'shape', 1);
    if (Math.random() < 0.45) {
      const pair = LabHost.pick([[4, 8], [4, 10], [6, 10], [6, 12], [6, 14], [5, 12]]);
      return makeBuildTask(pair[0], pair[1]);
    }
    return makeBothTask(randomShape(2), 'shape');
  }

  function buildRound({ mode, tier }) {
    if (mode === 'course') return buildCourse();
    const tiers = tier === 'mixed' ? [0, 0, 1, 1, 1, 2, 2, 2] : Array(8).fill(tier);
    return tiers.map(ti => genTask(ti));
  }

  function isConnected(grid) {
    const cells = [];
    grid.forEach((row, r) => row.forEach((v, c) => { if (v === 1) cells.push([r, c]); }));
    if (cells.length === 0) return false;
    const seen = new Set([`${cells[0][0]},${cells[0][1]}`]);
    const q = [cells[0]];
    while (q.length) {
      const [r, c] = q.shift();
      for (const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const nr = r + dr, nc = c + dc;
        const k = `${nr},${nc}`;
        if (grid[nr] && grid[nr][nc] === 1 && !seen.has(k)) {
          seen.add(k);
          q.push([nr, nc]);
        }
      }
    }
    return seen.size === cells.length;
  }

  // ---- Interactive Karogitter SVG ----
  function renderVisual(container, task, state, h) {
    const cellSize = 44;
    const pad = 20;

    if (task.kind === 'build') {
      if (!state.customState.buildGrid) {
        state.customState.buildGrid = Array.from({ length: task.rows }, () => Array(task.cols).fill(0));
      }
      const g = state.customState.buildGrid;
      const w = task.cols * cellSize + pad * 2;
      const hSvg = task.rows * cellSize + pad * 2;
      const curA = computeArea(g);
      const curP = computePerimeter(g);

      let rects = '';
      for (let r = 0; r < task.rows; r++) {
        for (let c = 0; c < task.cols; c++) {
          const x = pad + c * cellSize;
          const y = pad + r * cellSize;
          const on = g[r][c] === 1;
          rects += `<rect class="ar-build-cell" data-r="${r}" data-c="${c}" x="${x}" y="${y}" width="${cellSize}" height="${cellSize}"
            fill="${on ? 'rgba(56,239,125,0.42)' : 'rgba(255,255,255,0.05)'}"
            stroke="${on ? '#38ef7d' : 'rgba(255,255,255,0.22)'}" stroke-width="${on ? 2.5 : 1}" style="cursor:pointer"/>`;
        }
      }

      container.innerHTML = `
        <svg viewBox="0 0 ${w} ${hSvg}" style="max-width:${w}px" role="img" aria-label="Interactive area and perimeter builder grid">${rects}</svg>
        <div class="lh-helper-bar" style="justify-content:center">
          <span>${h.t('arLiveReadout', { a: curA, p: curP }, `Current: Area = <b>${curA} cm²</b> · Perimeter = <b>${curP} cm</b>`)}</span>
          ${!state.solved ? `<button type="button" class="nl-chip-btn" id="ar-clear-btn">${h.esc(h.t('nlGapsClear', null, '↺ Clear'))}</button>` : ''}
        </div>
      `;

      if (!state.solved) {
        container.querySelectorAll('.ar-build-cell').forEach(rect => {
          rect.addEventListener('click', () => {
            const r = parseInt(rect.dataset.r, 10);
            const c = parseInt(rect.dataset.c, 10);
            g[r][c] = g[r][c] ? 0 : 1;
            h.setInteractiveValue(g);
            h.redraw();
          });
        });
        const clr = container.querySelector('#ar-clear-btn');
        if (clr) clr.addEventListener('click', () => {
          state.customState.buildGrid = Array.from({ length: task.rows }, () => Array(task.cols).fill(0));
          h.setInteractiveValue(state.customState.buildGrid);
          h.redraw();
        });
      }
      return;
    }

    // Counting grid for area / perimeter / both
    const g = task.grid;
    const rows = g.length, cols = g[0].length;
    const w = cols * cellSize + pad * 2;
    const hSvg = rows * cellSize + pad * 2;

    if (!state.customState.markedCells) state.customState.markedCells = new Set();
    if (!state.customState.markedEdges) state.customState.markedEdges = new Set();
    const markedCells = state.customState.markedCells;
    const markedEdges = state.customState.markedEdges;

    const showFence = task.kind === 'perimeter' || (task.kind === 'both' && state.stepIdx === 1) || state.showSolutionVisual;
    let body = '';
    let cellNum = 0;

    // Draw background grid & shape cells
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = pad + c * cellSize;
        const y = pad + r * cellSize;
        const v = g[r][c];
        const key = `${r},${c}`;
        const isMarked = markedCells.has(key);
        if (v === 1) {
          cellNum += 1;
          body += `<rect class="ar-cell" data-key="${key}" x="${x}" y="${y}" width="${cellSize}" height="${cellSize}"
            fill="${isMarked ? 'rgba(56,239,125,0.45)' : 'rgba(108,99,255,0.34)'}"
            stroke="rgba(255,255,255,0.35)" stroke-width="1.5" style="cursor:pointer"/>`;
          if (isMarked || state.showSolutionVisual) {
            body += `<text x="${x + cellSize / 2}" y="${y + cellSize / 2 + 5}" fill="#fff" font-size="13" font-weight="800" text-anchor="middle" pointer-events="none">${state.showSolutionVisual ? cellNum : '✓'}</text>`;
          }
        } else if (v === 2) {
          const pts = `${x},${y + cellSize} ${x + cellSize},${y + cellSize} ${x + cellSize},${y}`;
          body += `<polygon class="ar-cell" data-key="${key}" points="${pts}"
            fill="${isMarked ? 'rgba(255,209,102,0.55)' : 'rgba(255,209,102,0.3)'}"
            stroke="#ffd166" stroke-width="1.5" style="cursor:pointer"/>`;
          body += `<text x="${x + cellSize * 0.68}" y="${y + cellSize * 0.78}" fill="#ffd166" font-size="11" font-weight="900" text-anchor="middle" pointer-events="none">½</text>`;
        } else {
          body += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-dasharray="3 3"/>`;
        }
      }
    }

    // Outer perimeter edges (clickable fence segments!)
    let edgeNum = 0;
    const edgeCoords = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (g[r][c] !== 1) continue;
        const x = pad + c * cellSize, y = pad + r * cellSize;
        if (r === 0 || g[r - 1][c] !== 1) edgeCoords.push([x, y, x + cellSize, y, `T${r},${c}`]);
        if (r === rows - 1 || g[r + 1][c] !== 1) edgeCoords.push([x, y + cellSize, x + cellSize, y + cellSize, `B${r},${c}`]);
        if (c === 0 || g[r][c - 1] !== 1) edgeCoords.push([x, y, x, y + cellSize, `L${r},${c}`]);
        if (c === cols - 1 || g[r][c + 1] !== 1) edgeCoords.push([x + cellSize, y, x + cellSize, y + cellSize, `R${r},${c}`]);
      }
    }

    edgeCoords.forEach(([x1, y1, x2, y2, eKey]) => {
      edgeNum += 1;
      const on = markedEdges.has(eKey) || (state.showSolutionVisual && showFence);
      const color = on ? '#38ef7d' : (showFence ? '#ffd166' : 'rgba(255,255,255,0.5)');
      const sw = on ? 5 : (showFence ? 3.5 : 2);
      body += `<line class="ar-edge" data-ekey="${eKey}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" style="cursor:pointer"/>`;
      if (state.showSolutionVisual && showFence) {
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
        body += `<circle cx="${mx}" cy="${my}" r="7" fill="#101830" stroke="#38ef7d" stroke-width="1.2"/>
                 <text x="${mx}" y="${my + 3.5}" fill="#7ef9ae" font-size="9" font-weight="900" text-anchor="middle">${edgeNum}</text>`;
      }
    });

    const counterText = showFence
      ? h.t('arEdgeCounter', { n: markedEdges.size }, `Fence segments tapped: <b>${markedEdges.size} cm</b>`)
      : h.t('arCellCounter', { n: markedCells.size }, `Squares tapped: <b>${markedCells.size}</b>`);

    container.innerHTML = `
      <svg viewBox="0 0 ${w} ${hSvg}" style="max-width:${w}px" role="img" aria-label="1 cm square grid figure">${body}</svg>
      <div class="lh-helper-bar">
        <span>${counterText}</span>
        ${(markedCells.size > 0 || markedEdges.size > 0) ? `<button type="button" class="nl-chip-btn" id="ar-reset-marks">${h.esc(h.t('nlGapsClear', null, '↺ Clear'))}</button>` : ''}
      </div>
    `;

    container.querySelectorAll('.ar-cell').forEach(el => {
      el.addEventListener('click', () => {
        const k = el.dataset.key;
        if (markedCells.has(k)) markedCells.delete(k); else markedCells.add(k);
        h.redraw();
      });
    });
    container.querySelectorAll('.ar-edge').forEach(el => {
      el.addEventListener('click', () => {
        const k = el.dataset.ekey;
        if (markedEdges.has(k)) markedEdges.delete(k); else markedEdges.add(k);
        h.redraw();
      });
    });
    const rst = container.querySelector('#ar-reset-marks');
    if (rst) rst.addEventListener('click', () => {
      markedCells.clear();
      markedEdges.clear();
      h.redraw();
    });
  }

  function renderInputs(container, task, state, h) {
    if (task.kind === 'build') {
      container.innerHTML = '';
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
          <input id="lh-in-${f.id}" name="${f.id}" type="text" inputmode="decimal" autocomplete="off" value="${val}" ${disabled}>
          <span class="lh-unit-tag">${h.esc(f.unit)}</span>
        </div>
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
    if (task.kind === 'build') {
      const g = submission.interactive || state.customState.buildGrid;
      const a = computeArea(g);
      const p = computePerimeter(g);
      if (a === 0) return { empty: true, title: h.t('arBuildEmpty', null, 'Tap squares on the grid to build your figure!') };
      if (!isConnected(g)) {
        return {
          ok: false,
          category: 'disconnected_shape',
          title: h.t('arErrDisconnTitle', null, 'Your figure has separate islands!'),
          message: h.t('arErrDisconnMsg', null, 'Make sure all painted squares touch along full edges to form one connected figure.'),
        };
      }
      if (a === task.targetArea && p === task.targetPerim) {
        return {
          ok: true,
          title: h.t('arGoodTitle', null, 'Brilliant construction!'),
          message: h.t('arBuildGoodMsg', { a, p }, `Your connected figure has Area = <b>${a} cm²</b> and Perimeter = <b>${p} cm</b>!`),
        };
      }
      return {
        ok: false,
        category: 'build_mismatch',
        title: h.t('arErrBuildTitle', null, 'Almost — adjust your shape!'),
        message: h.t('arErrBuildMsg', { a, p, ta: task.targetArea, tp: task.targetPerim },
          `Right now: Area = <b>${a} cm²</b> (goal ${task.targetArea}), Perimeter = <b>${p} cm</b> (goal ${task.targetPerim}). Making the shape longer increases the perimeter without changing the area!`),
      };
    }

    const checkingArea = task.kind === 'area' || (task.kind === 'both' && submission.stepIdx === 0);
    if (checkingArea) {
      const val = h.parseDec(submission.values.area);
      if (isNaN(val)) return { empty: true };
      if (Math.abs(val - task.area) < 0.001) {
        if (task.twoStep) {
          return {
            ok: true,
            nextStep: true,
            title: h.t('arStep1Good', { a: task.area }, `Area = ${task.area} cm² ✓`),
            message: h.t('arStep2Prompt', null, 'Now walk the outer fence to find the <b>Perimeter (cm)</b>!'),
          };
        }
        return { ok: true, title: h.t('arGoodTitle', null, 'Area is spot on!'), message: `A = <b>${task.area} cm²</b>` };
      }

      if (task.perimeter != null && val === task.perimeter) {
        return {
          ok: false,
          category: 'area_perimeter_swap',
          title: h.t('arErrSwapTitle', null, 'That is the perimeter, not the area!'),
          message: h.t('arErrSwapAreaMsg', null, '<b>Area (Flächeninhalt)</b> counts the squares <em>inside</em> the figure (paint), not the fence around it.'),
        };
      }
      if (task.halfCount > 0 && val === task.area + task.halfCount * 0.5) {
        return {
          ok: false,
          category: 'half_square_as_whole',
          title: h.t('arErrHalfTitle', null, 'Count the half-squares as ½!'),
          message: h.t('arErrHalfMsg', { n: task.halfCount }, `There are <b>${task.halfCount}</b> triangle halves — every pair of halves adds up to <b>1</b> whole square.`),
        };
      }
      return {
        ok: false,
        category: 'area_count',
        title: h.t('labTryAgainTitle', null, 'Count the squares again!'),
        message: h.t('arErrAreaMsg', null, 'Tap each inside square on the grid to mark it off as you count.'),
      };
    }

    // Perimeter check
    const val = h.parseNum(submission.values.perim);
    if (isNaN(val)) return { empty: true };
    if (val === task.perimeter) {
      return {
        ok: true,
        title: h.t('arGoodTitle', null, 'Perimeter mastered!'),
        message: `U = <b>${task.perimeter} cm</b>`,
      };
    }

    if (val === task.area) {
      return {
        ok: false,
        category: 'area_perimeter_swap',
        title: h.t('arErrSwapTitle', null, 'That is the area, not the perimeter!'),
        message: h.t('arErrSwapPerimMsg', null, '<b>Perimeter (Umfang)</b> is the length of the outer fence around the shape, not the squares inside.'),
      };
    }
    if (task.bboxP && task.bboxP < task.perimeter && val === task.bboxP) {
      return {
        ok: false,
        category: 'concave_inner_missed',
        showHintVisual: true,
        title: h.t('arErrConcaveTitle', null, 'Don\'t skip the inward step!'),
        message: h.t('arErrConcaveMsg', null, 'The fence also goes <b>into</b> the notch/cutout of this shape — trace every glowing yellow segment!'),
      };
    }
    if (val === task.perimeter / 2) {
      return {
        ok: false,
        category: 'half_perimeter',
        title: h.t('arErrHalfPerimTitle', null, 'You went only halfway around!'),
        message: h.t('arErrHalfPerimMsg', null, 'Walk all four sides of the fence — double your sum to close the loop!'),
      };
    }
    if (Math.abs(val - task.perimeter) <= 2) {
      return {
        ok: false,
        category: 'off_by_one_fence',
        title: h.t('arErrFenceTitle', null, 'Count the edge segments, not the corners!'),
        message: h.t('arErrFenceMsg', null, 'Tap each outer yellow edge one by one so no edge is skipped or counted twice.'),
      };
    }
    return {
      ok: false,
      category: 'perimeter_count',
      title: h.t('labTryAgainTitle', null, 'Trace the outer fence again!'),
      message: h.t('arErrPerimMsg', null, 'Start at the top-left corner and tap each 1 cm edge all the way back to the start.'),
    };
  }

  function getHint(task, state, level, h) {
    if (task.kind === 'build') {
      return {
        title: h.t('labHintTitle', null, '💡 Hint'),
        html: h.t('arHintBuild', { a: task.targetArea, p: task.targetPerim }, `Compact shapes (like rectangles) have a <b>smaller</b> perimeter; stretched-out or L-shaped figures with ${task.targetArea} squares have a <b>bigger</b> perimeter.`),
      };
    }
    const isPerim = task.kind === 'perimeter' || (task.kind === 'both' && state.stepIdx === 1);
    return {
      title: h.t('labHintTitle', null, '💡 Hint'),
      html: isPerim
        ? h.t('arHintPerim', null, 'Walk along the glowing outer yellow line and tap every 1 cm step until you return to where you started.')
        : h.t('arHintArea', null, 'Count full squares row by row, then pair any ½ triangles into whole squares.'),
    };
  }

  function getSolution(task, state, h) {
    if (task.kind === 'build') {
      return { html: h.t('arSolBuild', { a: task.targetArea, p: task.targetPerim }, `Example goal: a connected shape of <b>${task.targetArea}</b> squares whose outer fence counts <b>${task.targetPerim}</b> edges.`) };
    }
    const parts = [];
    parts.push(`${h.t('arAreaField', null, 'Area')}: <b>${task.area} cm²</b>`);
    if (task.perimeter != null) parts.push(`${h.t('arPerimField', null, 'Perimeter')}: <b>${task.perimeter} cm</b>`);
    return { html: parts.join(' · ') };
  }

  function getTrickkiste(task, state, h) {
    return {
      heading: h.t('arTrickHeading', null, 'Paint vs. Fence:'),
      formulaHtml: h.t('arTrickFormula', null, 'Area (A) = inside squares (cm²)<br>Perimeter (U) = outer fence (cm)'),
      descHtml: h.t('arTrickDesc', null, 'Two figures can have the <b>exact same area</b> yet a completely different perimeter!'),
      miniSvgHtml: `<svg viewBox="0 0 218 54" role="img" aria-label="Area inside versus Perimeter outside">
        <rect x="26" y="10" width="52" height="34" fill="rgba(108,99,255,0.4)" stroke="#fff" stroke-width="1.5"/>
        <text x="52" y="31" fill="#fff" font-size="11" font-weight="900" text-anchor="middle">A (cm²)</text>
        <rect x="136" y="10" width="52" height="34" fill="none" stroke="#38ef7d" stroke-width="4"/>
        <text x="162" y="31" fill="#7ef9ae" font-size="11" font-weight="900" text-anchor="middle">U (cm)</text>
      </svg>`,
      miniDesc: h.t('arMiniDesc', null, 'Inside = Area · Fence = Perimeter ✅'),
      asideTipHtml: h.t('arAsideTip', null, 'Tip: On U- or L-shapes, don\'t forget the inner edges of the cutout!'),
    };
  }

  const def = {
    id: 'area',
    chapter: 1,
    prefix: 'ar',
    icon: '🟩',
    roundSize: 8,
    levels: [
      { id: 0, labelKey: 'arTier0', chipKey: 'arChip0' },
      { id: 1, labelKey: 'arTier1', chipKey: 'arChip1' },
      { id: 2, labelKey: 'arTier2', chipKey: 'arChip2' },
    ],
    buildRound,
    renderVisual,
    renderInputs,
    checkAnswer,
    getHint,
    getSolution,
    getTrickkiste,
    computeArea,
    computePerimeter,
    isConnected,
    makeGrid,
    rectGrid,
    makeAreaTask,
    makePerimeterTask,
    makeBothTask,
  };

  if (typeof LabHost !== 'undefined' && LabHost.register) LabHost.register(def);
  return def;
})();
