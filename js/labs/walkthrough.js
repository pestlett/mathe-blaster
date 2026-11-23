// Klasse 4 Worked-Example Walkthrough Engine
// Interactive step-by-step modal player with PIKAS-aligned EIS visual beat renderers,
// tier tabs, Example 1 / Example 2 switcher, Play/Pause auto-advance, and full DE/EN/ES support.

const LabWalkthrough = (() => {
  'use strict';

  let bound = false;
  let autoTimer = null;
  let state = {
    open: false,
    labId: null,
    options: {},
    tierIdx: 0,
    exIdx: 0,
    beatIdx: 0,
    playing: false,
  };

  function lang() {
    if (typeof I18n !== 'undefined' && I18n.getLang) return I18n.getLang();
    return 'de';
  }

  function pickL(obj) {
    if (obj == null) return '';
    if (typeof obj === 'string') return obj;
    const lg = lang();
    return obj[lg] || obj.de || obj.en || '';
  }

  function t(key, vars, fallback) {
    if (typeof LabHost !== 'undefined' && LabHost.t) return LabHost.t(key, vars, fallback);
    if (typeof I18n !== 'undefined' && I18n.t) {
      const s = I18n.t(key, vars);
      if (s && s !== key) return s;
    }
    return fallback || key;
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function fmtNum(n) {
    if (typeof LabHost !== 'undefined' && LabHost.fmtNum) return LabHost.fmtNum(n);
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
  }

  function el(id) {
    return typeof document !== 'undefined' ? document.getElementById(id) : null;
  }

  function getData() {
    if (typeof LabWalkthroughData === 'undefined' || !state.labId) return null;
    return LabWalkthroughData.get(state.labId, state.options);
  }

  function currentTier() {
    const d = getData();
    return (d && d.tiers && d.tiers[state.tierIdx]) || null;
  }

  function currentExample() {
    const tr = currentTier();
    return (tr && tr.examples && tr.examples[state.exIdx]) || null;
  }

  function currentBeat() {
    const ex = currentExample();
    return (ex && ex.beats && ex.beats[state.beatIdx]) || null;
  }

  function stopAutoPlay() {
    if (autoTimer) {
      clearInterval(autoTimer);
      autoTimer = null;
    }
    state.playing = false;
  }

  function startAutoPlay() {
    stopAutoPlay();
    const ex = currentExample();
    if (!ex || ex.beats.length <= 1) return;
    if (state.beatIdx >= ex.beats.length - 1) state.beatIdx = 0;
    state.playing = true;
    render();
    autoTimer = setInterval(() => {
      const curEx = currentExample();
      if (!curEx || !state.open) { stopAutoPlay(); return; }
      if (state.beatIdx + 1 < curEx.beats.length) {
        state.beatIdx += 1;
        render();
      } else {
        stopAutoPlay();
        render();
      }
    }, 4500);
  }

  function toggleAutoPlay() {
    if (state.playing) {
      stopAutoPlay();
      render();
    } else {
      startAutoPlay();
    }
  }

  function nextStep() {
    stopAutoPlay();
    const ex = currentExample();
    if (!ex) return;
    if (state.beatIdx + 1 < ex.beats.length) {
      state.beatIdx += 1;
      render();
    } else if (currentTier() && state.exIdx + 1 < currentTier().examples.length) {
      state.exIdx += 1;
      state.beatIdx = 0;
      render();
    } else {
      close();
    }
  }

  function prevStep() {
    stopAutoPlay();
    if (state.beatIdx > 0) {
      state.beatIdx -= 1;
      render();
    }
  }

  function setTier(idx) {
    stopAutoPlay();
    const d = getData();
    if (!d || !d.tiers[idx]) return;
    state.tierIdx = idx;
    state.exIdx = 0;
    state.beatIdx = 0;
    render();
  }

  function setExample(idx) {
    stopAutoPlay();
    const tr = currentTier();
    if (!tr || !tr.examples[idx]) return;
    state.exIdx = idx;
    state.beatIdx = 0;
    render();
  }

  function open(labId, tierIdx = 0, options = {}) {
    bindOnce();
    stopAutoPlay();
    state.labId = labId;
    state.options = options || {};
    const d = getData();
    if (!d || !d.tiers || !d.tiers.length) return false;
    state.tierIdx = Math.max(0, Math.min(d.tiers.length - 1, tierIdx || 0));
    state.exIdx = 0;
    state.beatIdx = 0;
    state.open = true;
    const modal = el('lab-walkthrough-modal');
    if (modal) modal.classList.add('open');
    render();
    return true;
  }

  function close() {
    stopAutoPlay();
    state.open = false;
    const modal = el('lab-walkthrough-modal');
    if (modal) modal.classList.remove('open');
  }

  function refreshLanguage() {
    if (state.open) render();
  }

  function bindOnce() {
    if (bound || typeof document === 'undefined') return;
    bound = true;

    const modal = el('lab-walkthrough-modal');
    const closeBtn = el('wt-close-btn');
    const prevBtn = el('wt-prev-btn');
    const nextBtn = el('wt-next-btn');
    const playBtn = el('wt-play-btn');
    const replayBtn = el('wt-replay-btn');

    if (closeBtn) closeBtn.addEventListener('click', close);
    if (modal) {
      modal.addEventListener('click', e => {
        if (e.target === modal) close();
      });
    }
    if (prevBtn) prevBtn.addEventListener('click', prevStep);
    if (nextBtn) nextBtn.addEventListener('click', nextStep);
    if (playBtn) playBtn.addEventListener('click', toggleAutoPlay);
    if (replayBtn) {
      replayBtn.addEventListener('click', () => {
        stopAutoPlay();
        state.beatIdx = 0;
        render();
      });
    }
    if (document.addEventListener) {
    if (document.addEventListener) {
      document.addEventListener('keydown', e => {
        if (!state.open) return;
        if (e.key === 'Escape') close();
        else if (e.key === 'ArrowRight') nextStep();
        else if (e.key === 'ArrowLeft') prevStep();
      });
    }
    }
  }

  // =========================================================================
  // EIS VISUAL BEAT RENDERERS (all 11 lab types)
  // =========================================================================
  function renderVisualHtml(v) {
    if (!v || !v.type) return '';
    switch (v.type) {
      case 'numberline': return renderNumberLineVis(v);
      case 'placevalue': return renderPlaceValueVis(v);
      case 'neighbors':  return renderNeighborsVis(v);
      case 'rounding':   return renderRoundingVis(v);
      case 'area':       return renderAreaVis(v);
      case 'addsub':     return renderAddSubVis(v);
      case 'mul':        return renderMulVis(v);
      case 'div':        return renderDivVis(v);
      case 'units':      return renderUnitsVis(v);
      case 'geometry':   return renderGeometryVis(v);
      case 'charts':     return renderChartsVis(v);
      default:           return '';
    }
  }

  function renderNumberLineVis(v) {
    const x0 = 48, x1 = 412, y = 76;
    const total = v.totalSteps || 5;
    const dx = (x1 - x0) / total;
    const a1 = v.anchor1 != null ? v.anchor1 : 0;
    const a2 = v.anchor2 != null ? v.anchor2 : total;
    const xOf = i => x0 + i * dx;
    let svg = `<line x1="${x0 - 10}" y1="${y}" x2="${x1 + 10}" y2="${y}" stroke="#8fa3cf" stroke-width="3.5" stroke-linecap="round"/>`;

    // Span bracket
    if (v.showSpan) {
      const sx1 = xOf(a1), sx2 = xOf(a2);
      svg += `<path d="M ${sx1} ${y + 34} L ${sx1} ${y + 42} L ${sx2} ${y + 42} L ${sx2} ${y + 34}" fill="none" stroke="#ffd166" stroke-width="2"/>`;
      svg += `<text x="${(sx1 + sx2) / 2}" y="${y + 56}" fill="#ffd166" font-size="11" font-weight="900" text-anchor="middle">${fmtNum((a2 - a1) * v.step)}</text>`;
    }

    // Highlighted step-count arcs between anchors
    if (v.highlightGaps > 0) {
      for (let i = a1; i < a1 + v.highlightGaps && i < a2; i++) {
        const ax = xOf(i), bx = xOf(i + 1), mx = (ax + bx) / 2;
        svg += `<path d="M ${ax} ${y - 8} Q ${mx} ${y - 42} ${bx} ${y - 8}" fill="none" stroke="#38ef7d" stroke-width="2.6"/>`;
        svg += `<text x="${mx}" y="${y - 30}" fill="#7ef9ae" font-size="10" font-weight="900" text-anchor="middle">${v.showStepVal ? '+' + fmtNum(v.step) : (i - a1 + 1)}</text>`;
      }
    }

    // Jump arcs to A (forward or backward)
    if (v.showJumpToA) {
      const from = Math.abs(v.aIdx - a1) <= Math.abs(v.aIdx - a2) ? a1 : a2;
      const dir = v.aIdx >= from ? 1 : -1;
      for (let i = from; i !== v.aIdx; i += dir) {
        const ax = xOf(i), bx = xOf(i + dir), mx = (ax + bx) / 2;
        svg += `<path d="M ${ax} ${y - 8} Q ${mx} ${y - 44} ${bx} ${y - 8}" fill="none" stroke="#ffd166" stroke-width="3"/>`;
        svg += `<text x="${mx}" y="${y - 32}" fill="#ffd166" font-size="10" font-weight="900" text-anchor="middle">${dir > 0 ? '+' : '−'}${fmtNum(v.step)}</text>`;
      }
    } else if (v.backwardFromRight) {
      const ax = xOf(a2), bx = xOf(v.aIdx), mx = (ax + bx) / 2;
      svg += `<path d="M ${ax} ${y - 8} Q ${mx} ${y - 44} ${bx} ${y - 8}" fill="none" stroke="#ffd166" stroke-width="3"/>`;
      svg += `<text x="${mx}" y="${y - 32}" fill="#ffd166" font-size="11" font-weight="900" text-anchor="middle">−${fmtNum(v.step)}</text>`;
    } else if (v.backwardFromAnchor1) {
      for (let i = a1; i > v.aIdx; i--) {
        const ax = xOf(i), bx = xOf(i - 1), mx = (ax + bx) / 2;
        svg += `<path d="M ${ax} ${y - 8} Q ${mx} ${y - 44} ${bx} ${y - 8}" fill="none" stroke="#ffd166" stroke-width="3"/>`;
        svg += `<text x="${mx}" y="${y - 32}" fill="#ffd166" font-size="10" font-weight="900" text-anchor="middle">−${fmtNum(v.step)}</text>`;
      }
    }

    // Ticks & anchor labels
    for (let i = 0; i <= total; i++) {
      const tx = xOf(i);
      const isAnchor = i === a1 || i === a2;
      const isA = i === v.aIdx;
      svg += `<line x1="${tx}" y1="${y - (isAnchor ? 12 : 8)}" x2="${tx}" y2="${y + (isAnchor ? 12 : 8)}" stroke="${isA ? '#ff6b9d' : '#f0f2ff'}" stroke-width="${isAnchor || isA ? 3.2 : 2}"/>`;
      if (isAnchor) {
        svg += `<text x="${tx}" y="${y + 28}" fill="#e8ecff" font-size="11" font-weight="800" text-anchor="middle">${fmtNum(v.start + i * v.step)}</text>`;
      }
      if (isA) {
        const aVal = fmtNum(v.start + i * v.step);
        svg += `<circle cx="${tx}" cy="${y}" r="5.5" fill="#ff6b9d" stroke="#fff" stroke-width="1.5"/>`;
        svg += `<text x="${tx}" y="22" fill="${v.solved ? '#7ef9ae' : '#ff9bc0'}" font-size="12" font-weight="900" text-anchor="middle">${v.solved ? 'A = ' + aVal : 'A = ?'}</text>`;
      }
    }
    return `<svg viewBox="0 0 460 138" role="img" aria-label="Number line walkthrough">${svg}</svg>`;
  }

  function renderPlaceValueVis(v) {
    const hiSet = new Set(v.hi || []);
    const ovSet = new Set(v.overflow || []);
    return `<table class="pv-table" style="max-width:420px;margin:0 auto">
      <thead><tr>${v.cols.map((c, i) => `<th class="${hiSet.has(i) ? 'pv-col-hi' : ''}">${esc(c)}</th>`).join('')}</tr></thead>
      <tbody><tr>${v.digits.map((d, i) => `<td class="pv-digit-cell" style="color:${ovSet.has(i) ? '#ff7b7b' : hiSet.has(i) ? '#7ef9ae' : '#fff'}">${esc(d)}</td>`).join('')}</tr></tbody>
    </table>`;
  }

  function renderNeighborsVis(v) {
    if (v.mode === 'compare') {
      return `<div class="nb-ladder">
        <div class="nb-card"><span class="nb-card-label">${esc(v.noteA || '')}</span><span class="nb-card-val">${esc(v.a)}</span></div>
        <div class="nb-card nb-card-center" style="min-width:56px"><span class="nb-card-val">${esc(v.sign)}</span></div>
        <div class="nb-card"><span class="nb-card-label">${esc(v.noteB || '')}</span><span class="nb-card-val">${esc(v.b)}</span></div>
      </div>`;
    }
    if (v.mode === 'seq') {
      return `<div class="nb-ladder">${v.items.map((it, idx) => `<div class="nb-card ${idx === v.items.length - 1 ? 'nb-card-center' : ''}"><span class="nb-card-val">${esc(it)}</span></div>`).join(`<span style="color:#7ef9ae;font-weight:900">${esc(v.step)}</span>`)}</div>`;
    }
    return `<div class="nb-ladder">
      <div class="nb-card"><span class="nb-card-label">${esc(v.leftL)}</span><span class="nb-card-val">${esc(v.leftV)}</span></div>
      <span style="color:#7ef9ae;font-weight:900">←</span>
      <div class="nb-card nb-card-center"><span class="nb-card-val">${esc(v.centerV)}</span></div>
      <span style="color:#7ef9ae;font-weight:900">→</span>
      <div class="nb-card"><span class="nb-card-label">${esc(v.rightL)}</span><span class="nb-card-val">${esc(v.rightV)}</span></div>
    </div>`;
  }

  function renderRoundingVis(v) {
    if (v.inverse) {
      return `<svg viewBox="0 0 460 98" role="img" aria-label="Rounding window">
        <line x1="44" y1="54" x2="416" y2="54" stroke="#8fa3cf" stroke-width="3.5"/>
        <rect x="122" y="45" width="216" height="18" rx="7" fill="rgba(56,239,125,0.22)" stroke="#38ef7d" stroke-width="2"/>
        <line x1="230" y1="36" x2="230" y2="72" stroke="#ffd166" stroke-width="3"/>
        <text x="230" y="26" fill="#ffd166" font-size="13" font-weight="900" text-anchor="middle">${fmtNum(v.target)}</text>
        <text x="122" y="86" fill="${v.highlight === 'lo' ? '#ffd166' : '#7ef9ae'}" font-size="12" font-weight="900" text-anchor="middle">${fmtNum(v.lo)}</text>
        <text x="338" y="86" fill="${v.highlight === 'hi' ? '#ffd166' : '#7ef9ae'}" font-size="12" font-weight="900" text-anchor="middle">${fmtNum(v.hi)}</text>
      </svg>`;
    }
    const s = String(v.n);
    const digitsHtml = s.split('').map((ch, i) => {
      const sep = (s.length - i) % 3 === 0 && i > 0 ? '<span style="display:inline-block;width:6px"></span>' : '';
      const st = i === v.targetIdx
        ? 'background:rgba(56,239,125,0.24);border:2px solid #38ef7d;color:#7ef9ae;padding:2px 5px;border-radius:6px'
        : i === v.decIdx
        ? 'background:rgba(255,209,102,0.24);border:2px solid #ffd166;color:#ffd166;padding:2px 5px;border-radius:6px'
        : 'padding:2px 4px';
      return `${sep}<span style="${st}">${ch}</span>`;
    }).join('');
    const xLo = 56, xHi = 404, xMid = 230;
    const xVal = xLo + ((v.n - v.lo) / (v.hi - v.lo)) * (xHi - xLo);
    const snapX = v.snap === 'hi' ? xHi : xLo;
    return `<div style="font-size:1.3rem;font-weight:900;margin-bottom:4px;text-align:center">${digitsHtml}</div>
      <svg viewBox="0 0 460 96" role="img" aria-label="Zoomed rounding line">
        <line x1="${xLo}" y1="54" x2="${xHi}" y2="54" stroke="#8fa3cf" stroke-width="3.5"/>
        <line x1="${xLo}" y1="42" x2="${xLo}" y2="66" stroke="#fff" stroke-width="2.5"/>
        <line x1="${xMid}" y1="44" x2="${xMid}" y2="64" stroke="#ffd166" stroke-width="2" stroke-dasharray="4 3"/>
        <line x1="${xHi}" y1="42" x2="${xHi}" y2="66" stroke="#fff" stroke-width="2.5"/>
        <text x="${xLo}" y="84" fill="#e8ecff" font-size="12" font-weight="800" text-anchor="middle">${fmtNum(v.lo)}</text>
        <text x="${xMid}" y="84" fill="#ffd166" font-size="11" font-weight="800" text-anchor="middle">${fmtNum(v.mid)}</text>
        <text x="${xHi}" y="84" fill="#e8ecff" font-size="12" font-weight="800" text-anchor="middle">${fmtNum(v.hi)}</text>
        <circle cx="${xVal}" cy="54" r="6" fill="#6c63ff" stroke="#fff" stroke-width="2"/>
        ${v.snap ? `<path d="M ${xVal} 46 Q ${(xVal + snapX) / 2} 10 ${snapX} 44" fill="none" stroke="#38ef7d" stroke-width="3"/>` : ''}
      </svg>`;
  }

  function renderAreaVis(v) {
    const g = v.grid;
    const rows = g.length, cols = g[0].length, cell = 34, pad = 14;
    const w = cols * cell + pad * 2, h = rows * cell + pad * 2;
    let body = '', num = 0, edgeNum = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = pad + c * cell, y = pad + r * cell, val = g[r][c];
        if (val === 1) {
          num += 1;
          body += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="rgba(108,99,255,0.4)" stroke="rgba(255,255,255,0.35)"/>`;
          if (v.numbered) body += `<text x="${x + cell / 2}" y="${y + cell / 2 + 4}" fill="#fff" font-size="11" font-weight="900" text-anchor="middle">${num}</text>`;
        } else if (val === 2) {
          body += `<polygon points="${x},${y + cell} ${x + cell},${y + cell} ${x + cell},${y}" fill="rgba(255,209,102,0.45)" stroke="#ffd166" stroke-width="1.5"/>`;
          body += `<text x="${x + cell * 0.68}" y="${y + cell * 0.78}" fill="#ffd166" font-size="10" font-weight="900" text-anchor="middle">½</text>`;
        }
      }
    }
    if (v.mode === 'perim' || v.mode === 'both') {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (g[r][c] !== 1) continue;
          const x = pad + c * cell, y = pad + r * cell;
          const segs = [];
          if (r === 0 || g[r - 1][c] !== 1) segs.push([x, y, x + cell, y]);
          if (r === rows - 1 || g[r + 1][c] !== 1) segs.push([x, y + cell, x + cell, y + cell]);
          if (c === 0 || g[r][c - 1] !== 1) segs.push([x, y, x, y + cell]);
          if (c === cols - 1 || g[r][c + 1] !== 1) segs.push([x + cell, y, x + cell, y + cell]);
          segs.forEach(([x1, y1, x2, y2]) => {
            edgeNum += 1;
            body += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#38ef7d" stroke-width="4" stroke-linecap="round"/>`;
            if (v.numberedEdges) {
              const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
              body += `<circle cx="${mx}" cy="${my}" r="6.5" fill="#101830" stroke="#38ef7d"/><text x="${mx}" y="${my + 3}" fill="#7ef9ae" font-size="8.5" font-weight="900" text-anchor="middle">${edgeNum}</text>`;
            }
          });
        }
      }
    }
    return `<svg viewBox="0 0 ${w} ${h}" style="max-width:${Math.min(w, 290)}px;margin:0 auto" role="img" aria-label="Grid area and perimeter">${body}</svg>`;
  }

  function renderAddSubVis(v) {
    if (v.mentalBadge) {
      return `<div class="pv-prompt-card" style="font-size:1.3rem">🧠 ${fmtNum(v.a)} ${esc(v.op)} ${fmtNum(v.b)} = <span style="color:#7ef9ae">${fmtNum(v.ans)}</span></div>`;
    }
    const cols = Math.max(String(v.a).length, String(v.b).length, String(v.ans || '').length);
    const headers = ['M', 'HT', 'ZT', 'T', 'H', 'Z', 'E'].slice(7 - cols);
    const aD = String(v.a).padStart(cols, ' ').split('');
    const bD = String(v.b).padStart(cols, ' ').split('');
    const ansD = String(v.ans || '').padStart(cols, ' ').split('');
    const carries = v.carries || null;
    const isAbzieh = v.op === '−' && v.method !== 'ergaenz';
    const hi = idx => idx === v.hiCol ? 'background:rgba(56,239,125,0.22);color:#7ef9ae;' : '';

    let rows = '';
    if (carries && isAbzieh) rows += `<tr class="wa-carry"><td></td>${carries.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`;
    rows += `<tr><td></td>${aD.map((d, i) => `<td style="${hi(i)}">${d === ' ' ? '' : d}</td>`).join('')}</tr>`;
    rows += `<tr><td style="color:#ffd166">${esc(v.op)}</td>${bD.map((d, i) => `<td style="${hi(i)}">${d === ' ' ? '' : d}</td>`).join('')}</tr>`;
    if (carries && !isAbzieh) rows += `<tr class="wa-carry"><td></td>${carries.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`;
    rows += `<tr class="wa-line"><td>=</td>${ansD.map((d, i) => `<td style="color:#7ef9ae;${hi(i)}">${d === ' ' ? '' : d}</td>`).join('')}</tr>`;

    return `<div class="wa-grid-wrap"><table class="wa-table"><thead><tr><th></th>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  function renderMulVis(v) {
    if (v.malkreuz) {
      const mk = v.malkreuz;
      return `<table class="wm-malkreuz" style="margin:0 auto">
        <thead><tr><th>·</th>${mk.cols.map(c => `<th>${fmtNum(c)}</th>`).join('')}</tr></thead>
        <tbody>${mk.rows.map(r => `<tr><th>${fmtNum(r)}</th>${mk.cols.map(c => `<td style="color:#7ef9ae">${fmtNum(r * c)}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>`;
    }
    return `<div class="wd-box" style="text-align:right;min-width:210px;margin:0 auto">
      <div style="border-bottom:2px solid #f0f2ff;padding-bottom:3px;font-weight:900">${fmtNum(v.a)} · ${fmtNum(v.b)}</div>
      ${(v.rows || []).map(r => `<div style="color:#ffd166">${esc(r)}</div>`).join('')}
      <div style="color:#7ef9ae;font-weight:900;border-top:1px solid rgba(255,255,255,0.2);padding-top:3px">= ${esc(v.ans)}</div>
    </div>`;
  }

  function renderDivVis(v) {
    const qHtml = v.highlightZero ? esc(v.q).replace(/0/g, '<span class="wd-zero-hi">0</span>') : esc(v.q);
    return `<div class="wd-box" style="margin:0 auto">
      <div class="wd-step-line" style="font-weight:900;font-size:1.15rem">${esc(v.dividend)} : ${esc(v.divisor)} = <span style="color:#7ef9ae">${qHtml}</span></div>
      ${(v.lines || []).map(l => `<div class="wd-step-line" style="color:#a9b8ff;font-size:0.95rem">  ${esc(l)}</div>`).join('')}
    </div>`;
  }

  function renderUnitsVis(v) {
    if (v.mode === 'time') {
      return `<svg viewBox="0 0 460 100" role="img" aria-label="Zeitstrahl walkthrough">
        <line x1="46" y1="62" x2="414" y2="62" stroke="#8fa3cf" stroke-width="3.5"/>
        <circle cx="58" cy="62" r="6" fill="#6c63ff"/>
        <circle cx="220" cy="62" r="5" fill="#ffd166"/>
        <circle cx="402" cy="62" r="6" fill="#38ef7d"/>
        <text x="58" y="86" fill="#fff" font-size="12" font-weight="800" text-anchor="middle">${esc(v.start)}</text>
        <text x="220" y="86" fill="#ffd166" font-size="11" font-weight="800" text-anchor="middle">${esc(v.mid)}</text>
        <text x="402" y="86" fill="#7ef9ae" font-size="12" font-weight="800" text-anchor="middle">${esc(v.end)}</text>
        <path d="M 62 52 Q 140 16 216 52" fill="none" stroke="#ffd166" stroke-width="2.5"/>
        <path d="M 224 52 Q 312 16 398 52" fill="none" stroke="#38ef7d" stroke-width="2.5"/>
        <text x="140" y="26" fill="#ffd166" font-size="11" font-weight="900" text-anchor="middle">${esc(v.j1)}</text>
        <text x="312" y="26" fill="#7ef9ae" font-size="11" font-weight="900" text-anchor="middle">${esc(v.j2)}</text>
      </svg>`;
    }
    const hiSet = new Set(v.hi || []);
    return `<div class="pv-prompt-card" style="margin-bottom:8px;font-size:1.1rem">${esc(v.banner || '')}</div>
      <table class="pv-table" style="max-width:340px;margin:0 auto">
        <thead><tr>${v.cols.map((c, i) => `<th class="${hiSet.has(i) ? 'pv-col-hi' : ''}">${esc(c)}</th>`).join('')}</tr></thead>
        <tbody><tr>${v.vals.map((val, i) => `<td class="pv-digit-cell" style="color:${hiSet.has(i) ? '#ffd166' : '#fff'}">${esc(val)}</td>`).join('')}</tr></tbody>
      </table>`;
  }

  function renderGeometryVis(v) {
    if (v.mode === 'sym') {
      const cell = 30, pad = 10, rows = 3, half = 3;
      const w = half * 2 * cell + pad * 2, h = rows * cell + pad * 2, ax = pad + half * cell;
      const lSet = new Set(v.left.map(([r, c]) => `${r},${c}`));
      const rSet = new Set(v.right.map(([r, c]) => `${r},${c}`));
      let svg = '';
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < half; c++) {
          svg += `<rect x="${pad + c * cell}" y="${pad + r * cell}" width="${cell}" height="${cell}" fill="${lSet.has(`${r},${c}`) ? 'rgba(108,99,255,0.65)' : 'rgba(255,255,255,0.04)'}" stroke="rgba(255,255,255,0.2)"/>`;
          svg += `<rect x="${ax + c * cell}" y="${pad + r * cell}" width="${cell}" height="${cell}" fill="${rSet.has(`${r},${c}`) ? 'rgba(56,239,125,0.55)' : 'rgba(255,255,255,0.04)'}" stroke="rgba(255,255,255,0.2)"/>`;
        }
      }
      svg += `<line x1="${ax}" y1="4" x2="${ax}" y2="${h - 4}" stroke="#ffd166" stroke-width="3.5" stroke-dasharray="5 3"/>`;
      return `<svg viewBox="0 0 ${w} ${h}" style="max-width:220px;margin:0 auto" role="img" aria-label="Symmetry example">${svg}</svg>`;
    }
    if (v.mode === 'scale') {
      return `<div class="nb-ladder">
        <div class="nb-card"><span class="nb-card-label">Start</span><span class="nb-card-val">${v.ow} × ${v.oh} cm</span></div>
        <span style="color:#ffd166;font-weight:900">${esc(v.label)} →</span>
        <div class="nb-card nb-card-center"><span class="nb-card-label">Neu</span><span class="nb-card-val">${v.nw} × ${v.nh} cm</span></div>
      </div>`;
    }
    if (v.mode === 'bauplan') {
      const cells = v.heights.flat().map(n => `<div class="gm-bp-cell" style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;cursor:default">${n}</div>`).join('');
      return `<div class="gm-bauplan" style="grid-template-columns:repeat(${v.heights[0].length}, 36px);margin:0 auto">${cells}</div>`;
    }
    const coords = v.coords || [];
    const maxR = Math.max(...coords.map(p => p[0])) + 1, maxC = Math.max(...coords.map(p => p[1])) + 1;
    const cell = 30, pad = 10;
    const rects = coords.map(([r, c], i) => `<rect x="${pad + c * cell}" y="${pad + r * cell}" width="${cell}" height="${cell}" fill="${i === 2 ? 'rgba(255,209,102,0.45)' : 'rgba(108,99,255,0.48)'}" stroke="#fff" stroke-width="1.5"/>${i === 2 ? `<text x="${pad + c * cell + cell / 2}" y="${pad + r * cell + cell / 2 + 4}" fill="#ffd166" font-size="11" font-weight="900" text-anchor="middle">B</text>` : ''}`).join('');
    return `<svg viewBox="0 0 ${maxC * cell + pad * 2} ${maxR * cell + pad * 2}" style="max-width:170px;margin:0 auto" role="img" aria-label="Cube net">${rects}</svg>`;
  }

  function renderChartsVis(v) {
    if (v.mode === 'est') {
      return `<div class="pv-prompt-card" style="font-size:1.15rem">${esc(v.expr)}</div>
        <div style="color:#ffd166;font-weight:800;font-size:0.92rem;text-align:center">Überschlag: ${esc(v.est)}</div>
        <div class="lh-choice-grid" style="margin:4px 0">${v.choices.map(c => `<span class="nl-chip-btn ${c.includes('✓') ? 'active' : ''}">${esc(c)}</span>`).join('')}</div>`;
    }
    const maxU = 7, left = 64, bottom = 132, top = 14, step = (bottom - top) / maxU;
    let svg = '';
    for (let u = 0; u <= maxU; u += 2) {
      const y = bottom - u * step;
      svg += `<line x1="${left}" y1="${y}" x2="360" y2="${y}" stroke="rgba(255,255,255,0.16)"/>`;
      svg += `<text x="${left - 6}" y="${y + 4}" fill="#b8c4e6" font-size="10" font-weight="700" text-anchor="end">${fmtNum(u * v.scale)}</text>`;
    }
    const labels = ['Mo', 'Di', 'Mi', 'Do'];
    v.units.forEach((u, i) => {
      const x = v.singleBar ? 170 : left + 22 + i * 68;
      const bw = v.singleBar ? 62 : 42;
      const bh = u * step, y = bottom - bh, isHi = i === v.hi;
      svg += `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="5" fill="${isHi ? '#38ef7d' : '#6c63ff'}" fill-opacity="${isHi ? 0.78 : 0.45}"/>`;
      if (!v.singleBar) svg += `<text x="${x + bw / 2}" y="${bottom + 14}" fill="#fff" font-size="10" font-weight="800" text-anchor="middle">${labels[i]}</text>`;
      if (isHi && v.trace) svg += `<line x1="${left}" y1="${y}" x2="${x}" y2="${y}" stroke="#ffd166" stroke-width="2.5" stroke-dasharray="4 3"/>`;
    });
    return `<svg viewBox="0 0 380 152" style="max-width:360px;margin:0 auto" role="img" aria-label="Bar chart walkthrough">${svg}</svg>`;
  }

  // =========================================================================
  // MODAL RENDERING
  // =========================================================================
  function render() {
    if (typeof document === 'undefined' || !state.open) return;
    const data = getData();
    const tr = currentTier();
    const ex = currentExample();
    const beat = currentBeat();
    if (!data || !tr || !ex || !beat) return;

    const titleEl = el('wt-modal-title');
    const tiersEl = el('wt-tier-tabs');
    const exEl = el('wt-example-tabs');
    const goalEl = el('wt-goal');
    const visEl = el('wt-visual');
    const beatTitleEl = el('wt-beat-title');
    const beatTextEl = el('wt-beat-text');
    const formulaEl = el('wt-formula');
    const dotsEl = el('wt-dots');
    const prevBtn = el('wt-prev-btn');
    const nextBtn = el('wt-next-btn');
    const playBtn = el('wt-play-btn');

    if (titleEl) titleEl.textContent = t('wtModalTitle', null, '🎓 Step-by-Step Walkthrough');

    if (tiersEl) {
      tiersEl.innerHTML = data.tiers.map((ti, i) => `
        <button type="button" class="nl-chip-btn ${i === state.tierIdx ? 'active' : ''}" data-wt-tier="${i}">${esc(pickL(ti.label))}</button>
      `).join('');
      tiersEl.querySelectorAll('[data-wt-tier]').forEach(btn => {
        btn.addEventListener('click', () => setTier(parseInt(btn.dataset.wtTier, 10)));
      });
    }

    if (exEl) {
      exEl.innerHTML = tr.examples.map((e, i) => `
        <button type="button" class="wt-ex-btn ${i === state.exIdx ? 'active' : ''}" data-wt-ex="${i}">${esc(pickL(e.label))}</button>
      `).join('');
      exEl.querySelectorAll('[data-wt-ex]').forEach(btn => {
        btn.addEventListener('click', () => setExample(parseInt(btn.dataset.wtEx, 10)));
      });
    }

    if (goalEl) goalEl.textContent = pickL(ex.goal);
    if (visEl) visEl.innerHTML = renderVisualHtml(beat.visual);
    if (beatTitleEl) beatTitleEl.textContent = pickL(beat.title);
    if (beatTextEl) beatTextEl.textContent = pickL(beat.text);
    if (formulaEl) {
      const f = pickL(beat.formula);
      formulaEl.textContent = f;
      formulaEl.hidden = !f;
    }

    if (dotsEl) {
      dotsEl.innerHTML = ex.beats.map((_, i) => `
        <button type="button" class="wt-dot ${i === state.beatIdx ? 'active' : i < state.beatIdx ? 'done' : ''}" data-wt-beat="${i}" aria-label="Step ${i + 1}"></button>
      `).join('');
      dotsEl.querySelectorAll('[data-wt-beat]').forEach(btn => {
        btn.addEventListener('click', () => {
          stopAutoPlay();
          state.beatIdx = parseInt(btn.dataset.wtBeat, 10);
          render();
        });
      });
    }

    if (prevBtn) {
      prevBtn.disabled = state.beatIdx === 0;
      prevBtn.textContent = t('wtPrevBtn', null, '← Back');
    }
    if (playBtn) {
      playBtn.hidden = ex.beats.length <= 1;
      playBtn.textContent = state.playing
        ? t('wtPauseBtn', null, '⏸ Pause')
        : t('wtPlayBtn', null, '▶ Play');
    }
    if (nextBtn) {
      const hasNextBeat = state.beatIdx + 1 < ex.beats.length;
      const hasNextEx = state.exIdx + 1 < tr.examples.length;
      nextBtn.textContent = hasNextBeat
        ? t('wtNextBtn', null, 'Next Step →')
        : hasNextEx
        ? t('wtNextExBtn', null, 'Example 2 →')
        : t('wtDoneBtn', null, 'Got it — Let\'s Practise! ✓');
    }
  }

  return {
    open,
    close,
    nextStep,
    prevStep,
    setTier,
    setExample,
    toggleAutoPlay,
    refreshLanguage,
    renderVisualHtml,
    _getState: () => state,
  };
})();
