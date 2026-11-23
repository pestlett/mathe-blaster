// Klasse 4 Shared Lab Host & Registry
// Provides the unified shell (topbar, mode/level/range controls, interactive visual mount,
// step/input handling, progressive hints, diagnostic feedback, collapsible Trickkiste,
// printable learning report, and Progress persistence) for all Klasse 4 diagnostic labs.

const LabHost = (() => {
  'use strict';

  const registry = new Map();

  // ---- Shared utilities ----
  function t(key, vars, fallback) {
    let str = (typeof I18n !== 'undefined' && I18n.t) ? I18n.t(key, vars) : null;
    if (!str || str === key) {
      str = fallback != null ? fallback : key;
      if (vars && typeof str === 'string') {
        str = str.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : `{${k}}`));
      }
    }
    return str;
  }

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function fmtNum(n) {
    if (n == null || !isFinite(Number(n))) return '';
    const neg = Number(n) < 0;
    const s = String(Math.round(Math.abs(Number(n))));
    const grouped = s.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
    return (neg ? '\u2212' : '') + grouped;
  }

  function fmtDec(n, decimals) {
    if (n == null || !isFinite(Number(n))) return '';
    const fixed = typeof decimals === 'number'
      ? Number(n).toFixed(decimals)
      : String(Number(n));
    const parts = fixed.split('.');
    const intPart = fmtNum(parseInt(parts[0], 10));
    return parts.length > 1 ? `${intPart},${parts[1]}` : intPart;
  }

  function parseNum(raw) {
    if (raw == null) return NaN;
    const cleaned = String(raw).trim().replace(/[\s\u00A0\u202F._']/g, '');
    if (!cleaned || !/^-?\d+$/.test(cleaned)) return NaN;
    return parseInt(cleaned, 10);
  }

  function parseDec(raw) {
    if (raw == null) return NaN;
    let cleaned = String(raw).trim().replace(/[\s\u00A0\u202F']/g, '');
    if (!cleaned) return NaN;
    // Allow German comma decimal (e.g. "2,05") or dot ("2.05")
    if (cleaned.includes(',') && cleaned.includes('.')) {
      // e.g. "1.250,5" -> strip thousands dot, replace comma
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (cleaned.includes(',')) {
      cleaned = cleaned.replace(',', '.');
    }
    if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return NaN;
    return parseFloat(cleaned);
  }

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ---- Registry ----
  function register(labDef) {
    if (!labDef || !labDef.id) throw new Error('LabHost.register requires an id');
    registry.set(labDef.id, labDef);
    return labDef;
  }

  function getLab(id) {
    return registry.get(id) || null;
  }

  function listLabs() {
    return Array.from(registry.values());
  }

  // ---- Runtime State ----
  let bound = false;
  let onBackCb = null;
  let activeLab = null;

  let state = {
    mode: 'course',      // 'course' | 'practice'
    tier: 'mixed',       // 'mixed' | 0 | 1 | 2
    range: 100000,       // discrete range if supported
    options: {},         // lab-specific options (e.g. method: 'abzieh' | 'ergaenz')
    tasks: [],
    idx: 0,
    stepIdx: 0,
    solved: false,
    revealed: false,
    tries: 0,
    hintLevel: 0,
    showHintVisual: false,
    showSolutionVisual: false,
    hadWrongOnTask: false,
    interactiveValue: null,
    customState: {},     // per-task scratchpad state for interactive manipulatives
    firstTryCount: 0,
    errorsByCategory: {},
    errorsByTier: [0, 0, 0],
    taskOutcomes: [],
    roundFinished: false,
    savedRound: false,
    trickOpen: false,
  };

  function el(id) {
    return typeof document !== 'undefined' ? document.getElementById(id) : null;
  }

  function currentTask() {
    return state.tasks[state.idx] || null;
  }

  // ---- DOM Binding ----
  function bindOnce() {
    if (bound || typeof document === 'undefined') return;
    bound = true;

    const backBtn = el('lh-back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        if (typeof onBackCb === 'function') onBackCb();
      });
    }

    const trickToggle = el('lh-trick-toggle');
    if (trickToggle) {
      trickToggle.addEventListener('click', () => {
        state.trickOpen = !state.trickOpen;
        syncTrickkisteMobile();
      });
    }

    const modeBtns = document.querySelectorAll('#screen-lab-host .lh-mode-btn');
    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const nextMode = btn.dataset.lhMode;
        if (!nextMode || !activeLab) return;
        state.mode = nextMode;
        if (nextMode === 'course') state.tier = 'mixed';
        startRound();
      });
    });

    const form = el('lh-answer-form');
    if (form) {
      form.addEventListener('submit', e => {
        e.preventDefault();
        handleSubmit();
      });
    }

    const hintBtn = el('lh-hint-btn');
    if (hintBtn) {
      hintBtn.addEventListener('click', () => handleHint());
    }

    const revealBtn = el('lh-reveal-btn');
    if (revealBtn) {
      revealBtn.addEventListener('click', () => handleReveal());
    }

    const nextBtn = el('lh-next-btn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => advanceTask());
    }

    const openWt = () => {
      if (!activeLab || typeof LabWalkthrough === 'undefined') return;
      const curTask = currentTask();
      const tier = curTask && typeof curTask.tier === 'number'
        ? curTask.tier
        : (typeof state.tier === 'number' ? state.tier : 0);
      LabWalkthrough.open(activeLab.id, tier, state.options);
    };
    const wtBtn = el('lh-walkthrough-btn');
    if (wtBtn) wtBtn.addEventListener('click', openWt);
    const wtInlineBtn = el('lh-tier-walkthrough-btn');
    if (wtInlineBtn) wtInlineBtn.addEventListener('click', openWt);

    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('resize', () => {
        if (activeLab && !state.roundFinished && el('screen-lab-host')?.classList.contains('active')) {
          renderVisualOnly();
        }
      });
    }
  }

  function syncTrickkisteMobile() {
    const sidebar = el('lh-sidebar');
    const toggle = el('lh-trick-toggle');
    if (sidebar) sidebar.classList.toggle('nl-sidebar-open', !!state.trickOpen);
    if (toggle) toggle.setAttribute('aria-expanded', state.trickOpen ? 'true' : 'false');
  }

  // ---- Round Lifecycle ----
  function open(labId, onBack, initialOpts) {
    const lab = typeof labId === 'string' ? registry.get(labId) : labId;
    if (!lab) return false;
    bindOnce();
    activeLab = lab;
    onBackCb = onBack || null;
    state.mode = (initialOpts && initialOpts.mode) || 'course';
    state.tier = (initialOpts && initialOpts.tier !== undefined) ? initialOpts.tier : 'mixed';
    state.range = (initialOpts && initialOpts.range) || lab.defaultRange || (lab.ranges ? lab.ranges[1] || lab.ranges[0] : 100000);
    state.options = { ...(lab.defaultOptions || {}), ...((initialOpts && initialOpts.options) || {}) };
    state.trickOpen = false;
    syncTrickkisteMobile();
    startRound();
    return true;
  }

  function startRound() {
    if (!activeLab) return;
    const tasks = activeLab.buildRound({
      mode: state.mode,
      tier: state.tier,
      range: state.range,
      options: state.options,
    }) || [];
    state.tasks = tasks;
    state.idx = 0;
    state.firstTryCount = 0;
    state.errorsByCategory = {};
    state.errorsByTier = [0, 0, 0];
    state.taskOutcomes = [];
    state.roundFinished = false;
    state.savedRound = false;
    resetTaskState();
    renderAll();
  }

  function resetTaskState() {
    state.stepIdx = 0;
    state.solved = false;
    state.revealed = false;
    state.tries = 0;
    state.hintLevel = 0;
    state.showHintVisual = false;
    state.showSolutionVisual = false;
    state.hadWrongOnTask = false;
    state.interactiveValue = null;
    state.customState = {};
  }

  function advanceTask() {
    if (state.idx + 1 < state.tasks.length) {
      state.idx += 1;
      resetTaskState();
      renderAll();
    } else {
      finishRound();
    }
  }

  function finishRound() {
    state.roundFinished = true;
    if (!state.savedRound && activeLab && typeof Progress !== 'undefined' && Progress.saveLabRound) {
      Progress.saveLabRound(activeLab.id, {
        firstTry: state.firstTryCount,
        errorsByCategory: state.errorsByCategory,
      });
      state.savedRound = true;
    }
    renderAll();
  }

  // ---- Interactive Helpers passed to Lab Modules ----
  function makeHelpers() {
    return {
      t,
      esc,
      fmtNum,
      fmtDec,
      parseNum,
      parseDec,
      setInteractiveValue(val) {
        state.interactiveValue = val;
      },
      getInteractiveValue() {
        return state.interactiveValue;
      },
      setCustomState(patch) {
        Object.assign(state.customState, patch);
      },
      redraw() {
        renderVisualOnly();
      },
      redrawInputs() {
        renderInputsOnly();
      },
      submitDirect(val) {
        state.interactiveValue = val;
        handleSubmit();
      },
      setOption(key, val) {
        state.options[key] = val;
        if (activeLab && activeLab.onOptionChange) {
          activeLab.onOptionChange(key, val, state);
        }
        renderVisualOnly();
        renderTrickkiste();
      },
      getOption(key) {
        return state.options[key];
      },
    };
  }

  // ---- Rendering ----
  function renderAll() {
    if (!activeLab || typeof document === 'undefined') return;
    renderHeaderAndControls();
    renderTrickkiste();

    const exView = el('lh-exercise-view');
    const sumView = el('lh-summary-view');
    if (state.roundFinished) {
      if (exView) exView.hidden = true;
      if (sumView) {
        sumView.hidden = false;
        renderSummary(sumView);
      }
      return;
    }

    if (exView) exView.hidden = false;
    if (sumView) sumView.hidden = true;

    renderTask();
  }

  function renderHeaderAndControls() {
    const p = activeLab.prefix;
    const titleEl = el('lh-title');
    const introEl = el('lh-intro');
    if (titleEl) titleEl.textContent = `${activeLab.icon || ''} ${t(`${p}Title`, null, activeLab.id)}`.trim();
    if (introEl) introEl.innerHTML = t(`${p}Intro`, null, '');

    // Mode buttons
    document.querySelectorAll('#screen-lab-host .lh-mode-btn').forEach(btn => {
      const m = btn.dataset.lhMode;
      btn.classList.toggle('active', m === state.mode);
      if (m === 'course') btn.textContent = t('labModeCourse', { n: activeLab.roundSize || 8 }, '🎯 Guided Course');
      if (m === 'practice') btn.textContent = t('labModePractice', null, '✨ Fresh Practice');
    });

    // Practice controls (level + range + optional lab options)
    const controls = el('lh-practice-controls');
    const levelGroup = el('lh-level-group');
    const rangeGroup = el('lh-range-group');
    const optGroup = el('lh-option-group');

    const showPractice = state.mode === 'practice';
    const hasOptions = Array.isArray(activeLab.optionControls) && activeLab.optionControls.length > 0;
    if (controls) controls.hidden = !showPractice && !hasOptions;

    if (levelGroup) {
      levelGroup.hidden = !showPractice;
      if (showPractice) {
        let html = `<span class="nl-sub-label">${esc(t('nlFilterLevel', null, 'Level:'))}</span>`;
        html += `<button class="nl-chip-btn lh-tier-btn ${state.tier === 'mixed' ? 'active' : ''}" type="button" data-tier="mixed">${esc(t('nlTierMixed', null, 'All'))}</button>`;
        (activeLab.levels || []).forEach((lv, i) => {
          const active = state.tier === i ? 'active' : '';
          html += `<button class="nl-chip-btn lh-tier-btn ${active}" type="button" data-tier="${i}">${esc(t(lv.chipKey || lv.labelKey, null, `Level ${i + 1}`))}</button>`;
        });
        levelGroup.innerHTML = html;
        levelGroup.querySelectorAll('.lh-tier-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const v = btn.dataset.tier;
            state.tier = v === 'mixed' ? 'mixed' : parseInt(v, 10);
            startRound();
          });
        });
      }
    }

    if (rangeGroup) {
      const hasRanges = showPractice && Array.isArray(activeLab.ranges) && activeLab.ranges.length > 0;
      rangeGroup.hidden = !hasRanges;
      if (hasRanges) {
        let html = `<span class="nl-sub-label">${esc(t('nlFilterRange', null, 'Range:'))}</span>`;
        activeLab.ranges.forEach(r => {
          const rKey = r === 10000 ? 'nlRange10k' : r === 100000 ? 'nlRange100k' : 'nlRange1m';
          const active = state.range === r ? 'active' : '';
          html += `<button class="nl-chip-btn lh-range-btn ${active}" type="button" data-range="${r}">${esc(t(rKey, null, `up to ${fmtNum(r)}`))}</button>`;
        });
        rangeGroup.innerHTML = html;
        rangeGroup.querySelectorAll('.lh-range-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            state.range = parseInt(btn.dataset.range, 10);
            startRound();
          });
        });
      }
    }

    if (optGroup) {
      optGroup.hidden = !hasOptions;
      if (hasOptions) {
        let html = '';
        activeLab.optionControls.forEach(ctrl => {
          html += `<span class="nl-sub-label">${esc(t(ctrl.labelKey, null, ctrl.label || ''))}</span>`;
          ctrl.choices.forEach(ch => {
            const active = state.options[ctrl.key] === ch.value ? 'active' : '';
            html += `<button class="nl-chip-btn lh-opt-btn ${active}" type="button" data-opt-key="${esc(ctrl.key)}" data-opt-val="${esc(ch.value)}">${esc(t(ch.labelKey, null, ch.value))}</button>`;
          });
        });
        optGroup.innerHTML = html;
        optGroup.querySelectorAll('.lh-opt-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const k = btn.dataset.optKey;
            const v = btn.dataset.optVal;
            state.options[k] = v;
            renderHeaderAndControls();
            renderVisualOnly();
            renderTrickkiste();
          });
        });
      }
    }
  }

  function renderTask() {
    const task = currentTask();
    if (!task) return;
    const total = state.tasks.length;
    const completed = state.idx + (state.solved ? 1 : 0);

    const progText = el('lh-progress-text');
    const starText = el('lh-star-count');
    const progBar = el('lh-progress-bar');
    const progFill = el('lh-progress-fill');
    if (progText) progText.textContent = t('nlProgressText', { current: state.idx + 1, total }, `Task ${state.idx + 1} of ${total}`);
    if (starText) starText.textContent = t('nlStarCount', { n: state.firstTryCount }, `⭐ ${state.firstTryCount} first try`);
    if (progBar) {
      progBar.setAttribute('aria-valuemax', String(total));
      progBar.setAttribute('aria-valuenow', String(completed));
    }
    if (progFill) progFill.style.width = `${Math.round((completed / Math.max(1, total)) * 100)}%`;

    const levelDef = (activeLab.levels || [])[task.tier || 0];
    const kicker = el('lh-level-label');
    if (kicker) {
      const lvLabel = levelDef ? t(levelDef.labelKey, null, `Level ${(task.tier || 0) + 1}`) : `Level ${(task.tier || 0) + 1}`;
      kicker.textContent = `${t('labLevelPrefix', { n: (task.tier || 0) + 1 }, `LEVEL ${(task.tier || 0) + 1}`)} · ${lvLabel.toUpperCase()}`;
    }

    const qTitle = el('lh-q-title');
    const qSub = el('lh-q-subtitle');
    if (qTitle) qTitle.innerHTML = task.promptHtml || esc(task.prompt || '');
    if (qSub) {
      qSub.innerHTML = task.subtitleHtml || esc(task.subtitle || '');
      qSub.hidden = !qSub.innerHTML;
    }

    // Highlight active level dot in Trickkiste
    [0, 1, 2].forEach(i => {
      const dot = el(`lh-level-dot-${i}`);
      if (dot) dot.classList.toggle('active', i === (task.tier || 0));
    });

    renderVisualOnly();
    renderInputsOnly();
    syncActionButtons();
  }

  function renderVisualOnly() {
    const task = currentTask();
    const mount = el('lh-visual');
    if (!task || !mount || !activeLab) return;
    mount.innerHTML = '';
    activeLab.renderVisual(mount, task, state, makeHelpers());
  }

  function renderInputsOnly() {
    const task = currentTask();
    const mount = el('lh-inputs');
    if (!task || !mount || !activeLab) return;

    if (typeof activeLab.renderInputs === 'function') {
      mount.innerHTML = '';
      activeLab.renderInputs(mount, task, state, makeHelpers());
      return;
    }

    // Standard 1- or 2-field form rendering driven by task.fields
    const fields = task.fields || [{ id: 'ans', label: t('labYourAnswer', null, 'Your answer:'), placeholder: '' }];
    const isMulti = fields.length > 1;
    let html = `<div class="nl-fieldset ${isMulti ? '' : 'lh-fieldset-single'}">`;
    fields.forEach((f, idx) => {
      const isLocked = task.twoStep && idx > state.stepIdx && !state.solved;
      const isDone = task.twoStep && idx < state.stepIdx;
      const lockedCls = isLocked ? 'nl-field-locked' : isDone ? 'nl-field-done' : '';
      const disabled = (isLocked || state.solved) ? 'disabled' : '';
      const val = f._value != null ? esc(f._value) : '';
      html += `<div class="nl-field ${lockedCls}" id="lh-field-${esc(f.id)}">`;
      html += `<label for="lh-in-${esc(f.id)}">${f.labelHtml || esc(f.label || '')}</label>`;
      html += `<div class="lh-input-row">`;
      html += `<input id="lh-in-${esc(f.id)}" name="${esc(f.id)}" type="text" inputmode="${esc(f.inputmode || 'numeric')}" autocomplete="off" placeholder="${esc(f.placeholder || '')}" value="${val}" ${disabled}>`;
      if (f.unit) html += `<span class="lh-unit-tag">${esc(f.unit)}</span>`;
      html += `</div>`;
      if (f.note) html += `<p class="nl-field-note">${esc(f.note)}</p>`;
      html += `</div>`;
    });
    html += `</div>`;
    mount.innerHTML = html;

    if (!state.solved) {
      const focusField = task.twoStep ? fields[state.stepIdx] : fields[0];
      if (focusField) {
        const inp = el(`lh-in-${focusField.id}`);
        if (inp && !inp.disabled) {
          setTimeout(() => { try { inp.focus(); } catch {} }, 10);
        }
      }
    }
  }

  function syncActionButtons() {
    const checkBtn = el('lh-check-btn');
    const hintBtn = el('lh-hint-btn');
    const revealBtn = el('lh-reveal-btn');
    const follow = el('lh-follow-actions');
    const nextBtn = el('lh-next-btn');
    const task = currentTask();

    if (checkBtn) {
      checkBtn.hidden = state.solved || Boolean(task && task.hideSubmitBtn);
      if (task && task.twoStep) {
        checkBtn.textContent = state.stepIdx === 0
          ? t('nlCheckStep1', null, 'Check Step 1 ✓')
          : t('nlCheckStep2', null, 'Check Step 2 ✓');
      } else {
        checkBtn.textContent = t('labCheckBtn', null, 'Check Answer ✓');
      }
    }
    if (hintBtn) {
      hintBtn.hidden = state.solved;
      hintBtn.textContent = t('nlHintBtn', null, '💡 Small Hint');
    }
    if (revealBtn) {
      revealBtn.hidden = state.solved || state.tries < 1;
      revealBtn.textContent = t('nlRevealSolutionBtn', null, 'Show step-by-step solution');
    }
    if (follow) follow.hidden = !state.solved;
    if (nextBtn) {
      const isLast = state.idx + 1 >= state.tasks.length;
      nextBtn.textContent = isLast
        ? t('nlFinishBtn', null, 'Show Learning Report →')
        : t('nlNextBtn', null, 'Next Task →');
    }

    // Hide feedback & tip on fresh task
    if (!state.solved && state.tries === 0 && state.hintLevel === 0) {
      const fb = el('lh-feedback');
      const tip = el('lh-tip-box');
      if (fb) { fb.hidden = true; fb.innerHTML = ''; }
      if (tip) { tip.hidden = true; tip.innerHTML = ''; }
    }
  }

  function readSubmission() {
    const task = currentTask();
    const values = {};
    const mount = el('lh-inputs');
    if (mount) {
      mount.querySelectorAll('input[name], select[name]').forEach(inp => {
        values[inp.name] = inp.value;
      });
    }
    // Preserve typed values on task fields for re-renders in 2-step mode
    if (task && Array.isArray(task.fields)) {
      task.fields.forEach(f => {
        if (values[f.id] !== undefined) f._value = values[f.id];
      });
    }
    return {
      values,
      interactive: state.interactiveValue,
      stepIdx: state.stepIdx,
      options: state.options,
    };
  }

  function showFeedback(kind, title, bodyHtml) {
    const fb = el('lh-feedback');
    if (!fb) return;
    fb.hidden = false;
    fb.className = `nl-feedback nl-feedback-${kind}`;
    fb.innerHTML = `<strong>${esc(title)}</strong><div class="lh-fb-body">${bodyHtml}</div>`;
  }

  function handleSubmit() {
    const task = currentTask();
    if (!task || !activeLab || state.solved) return;
    const sub = readSubmission();
    const res = activeLab.checkAnswer(task, sub, state, makeHelpers());
    if (!res) return;

    if (res.empty) {
      showFeedback('warn', res.title || t('labEmptyTitle', null, 'Enter an answer first'), res.message || '');
      return;
    }

    if (res.ok) {
      if (res.nextStep) {
        // Locked Step 1 solved -> unlock Step 2
        state.stepIdx += 1;
        state.hintLevel = 0;
        showFeedback('good', res.title || t('labStepGoodTitle', null, 'Step 1 correct!'), res.message || '');
        renderVisualOnly();
        renderInputsOnly();
        syncActionButtons();
        return;
      }

      // Full task solved!
      state.solved = true;
      state.showSolutionVisual = true;
      if (!state.hadWrongOnTask && !state.revealed) {
        state.firstTryCount += 1;
      }
      state.taskOutcomes.push({
        tier: task.tier || 0,
        firstTry: !state.hadWrongOnTask && !state.revealed,
        revealed: state.revealed,
      });

      const sol = activeLab.getSolution ? activeLab.getSolution(task, state, makeHelpers()) : null;
      const body = (res.message || '') + (sol && sol.html ? `<div class="lh-sol-box">${sol.html}</div>` : '');
      showFeedback('good', res.title || t('labCorrectTitle', null, 'Well done!'), body);
      renderVisualOnly();
      renderInputsOnly();
      syncActionButtons();
    } else {
      state.tries += 1;
      state.hadWrongOnTask = true;
      const cat = res.category || 'general';
      state.errorsByCategory[cat] = (state.errorsByCategory[cat] || 0) + 1;
      const tierIdx = Math.min(2, Math.max(0, task.tier || 0));
      state.errorsByTier[tierIdx] = (state.errorsByTier[tierIdx] || 0) + 1;

      const tipHtml = res.tip ? `<p class="lh-diag-tip">${res.tip}</p>` : '';
      showFeedback('warn', res.title || t('labTryAgainTitle', null, 'Not quite yet — look closely!'), (res.message || '') + tipHtml);
      if (res.showHintVisual) {
        state.showHintVisual = true;
        renderVisualOnly();
      }
      syncActionButtons();
    }
  }

  function handleHint() {
    const task = currentTask();
    if (!task || !activeLab || state.solved) return;
    state.hintLevel += 1;
    state.showHintVisual = true;
    const hint = activeLab.getHint ? activeLab.getHint(task, state, state.hintLevel, makeHelpers()) : null;
    const tipBox = el('lh-tip-box');
    if (tipBox && hint) {
      tipBox.hidden = false;
      tipBox.innerHTML = `<strong>${esc(hint.title || t('labHintTitle', null, '💡 Hint'))}</strong><div>${hint.html || ''}</div>`;
    }
    renderVisualOnly();
  }

  function handleReveal() {
    const task = currentTask();
    if (!task || !activeLab || state.solved) return;
    state.revealed = true;
    state.solved = true;
    state.showSolutionVisual = true;
    state.taskOutcomes.push({
      tier: task.tier || 0,
      firstTry: false,
      revealed: true,
    });
    const sol = activeLab.getSolution ? activeLab.getSolution(task, state, makeHelpers()) : null;
    showFeedback(
      'info',
      t('labSolutionTitle', null, 'Step-by-step solution'),
      sol && sol.html ? sol.html : ''
    );
    renderVisualOnly();
    renderInputsOnly();
    syncActionButtons();
  }

  function renderTrickkiste() {
    if (!activeLab || typeof document === 'undefined') return;
    const tk = activeLab.getTrickkiste ? activeLab.getTrickkiste(currentTask(), state, makeHelpers()) : null;
    const heading = el('lh-rule-heading');
    const formula = el('lh-rule-formula');
    const desc = el('lh-rule-desc');
    const mini = el('lh-mini-visual');
    const miniDesc = el('lh-mini-desc');
    const asideTip = el('lh-aside-tip');
    const levelsWrap = el('lh-levels-list');

    if (tk) {
      if (heading) heading.textContent = tk.heading || '';
      if (formula) formula.innerHTML = tk.formulaHtml || '';
      if (desc) desc.innerHTML = tk.descHtml || '';
      if (mini) mini.innerHTML = tk.miniSvgHtml || '';
      if (miniDesc) miniDesc.textContent = tk.miniDesc || '';
      if (asideTip) asideTip.innerHTML = tk.asideTipHtml || '';
    }

    if (levelsWrap) {
      const task = currentTask();
      const activeTier = task ? (task.tier || 0) : 0;
      levelsWrap.innerHTML = (activeLab.levels || []).map((lv, i) => `
        <div class="nl-level">
          <span class="nl-dot ${i === activeTier ? 'active' : ''}" id="lh-level-dot-${i}"></span>
          <span>${esc(t(lv.labelKey, null, `Level ${i + 1}`))}</span>
        </div>
      `).join('');
    }
  }

  function renderSummary(container) {
    const total = state.tasks.length;
    const solvedOwn = state.taskOutcomes.filter(o => !o.revealed).length;
    const totalErrors = Object.values(state.errorsByCategory).reduce((a, b) => a + b, 0);

    // Find weakest tier
    let weakestTier = 0;
    let maxTierErr = -1;
    state.errorsByTier.forEach((cnt, i) => {
      if (cnt > maxTierErr) { maxTierErr = cnt; weakestTier = i; }
    });
    const weakestLabel = activeLab.levels && activeLab.levels[weakestTier]
      ? t(activeLab.levels[weakestTier].labelKey, null, `Level ${weakestTier + 1}`)
      : `Level ${weakestTier + 1}`;

    // Find top error category
    let topCat = null;
    let topCatCount = 0;
    for (const [k, v] of Object.entries(state.errorsByCategory)) {
      if (v > topCatCount) { topCatCount = v; topCat = k; }
    }

    const advice = (activeLab.getSummaryAdvice && activeLab.getSummaryAdvice({
      topCat,
      topCatCount,
      weakestTier,
      weakestLabel,
      firstTry: state.firstTryCount,
      total,
      errorsByCategory: state.errorsByCategory,
    }, makeHelpers())) || (totalErrors === 0
      ? t('labSummaryPerfect', null, 'Fantastic work! Every task solved cleanly on the first try.')
      : t('labSummaryPracticeTip', { level: weakestLabel }, `Great effort! Next time focus on "${weakestLabel}".`));

    const playerName = (typeof Progress !== 'undefined' && Progress.getAll) ? (Progress.getAll().player?.name || '') : '';
    const labTitle = t(`${activeLab.prefix}Title`, null, activeLab.id);
    const today = new Date().toLocaleDateString();

    container.innerHTML = `
      <div class="nl-finish">
        <div class="lh-print-meta">${esc(labTitle)}${playerName ? ' · ' + esc(playerName) : ''} · ${esc(today)}</div>
        <h2>🎉 ${esc(t('labSummaryHeading', { title: labTitle }, `${labTitle} complete!`))}</h2>
        <p class="nl-finish-intro">${esc(t('labSummarySubtitle', { n: total }, `You finished all ${total} tasks at your own pace.`))}</p>
        <div class="nl-summary-grid">
          <div class="nl-summary-stat">
            <b>⭐ ${state.firstTryCount} / ${total}</b>
            <span>${esc(t('labStatFirstTry', null, 'First-try stars'))}</span>
          </div>
          <div class="nl-summary-stat">
            <b>✓ ${solvedOwn} / ${total}</b>
            <span>${esc(t('labStatSolvedOwn', null, 'Solved independently'))}</span>
          </div>
          <div class="nl-summary-stat">
            <b>${totalErrors}</b>
            <span>${esc(t('labStatHints', null, 'Learning clues spotted'))}</span>
          </div>
        </div>
        <div class="nl-summary-advice">
          <strong>🧠 ${esc(t('labSummaryFocusTitle', null, 'Your learning takeaway'))}</strong>
          <p>${advice}</p>
        </div>
        <div class="nl-actions">
          ${maxTierErr > 0 ? `<button type="button" class="nl-btn nl-btn-primary" id="lh-sum-weak">${esc(t('labPracticeWeakest', { level: weakestLabel }, `Practise: ${weakestLabel}`))}</button>` : ''}
          <button type="button" class="nl-btn ${maxTierErr > 0 ? 'nl-btn-secondary' : 'nl-btn-primary'}" id="lh-sum-new">${esc(t('labNewRound', null, '✨ Fresh Round'))}</button>
          <button type="button" class="nl-btn nl-btn-quiet" id="lh-sum-print">${esc(t('nlPrintReport', null, '🖨️ Print Report'))}</button>
          <button type="button" class="nl-btn nl-btn-quiet" id="lh-sum-hub">${esc(t('labBackToHub', null, '← Klasse 4 Hub'))}</button>
        </div>
      </div>
    `;

    const weakBtn = el('lh-sum-weak');
    if (weakBtn) {
      weakBtn.addEventListener('click', () => {
        state.mode = 'practice';
        state.tier = weakestTier;
        startRound();
      });
    }
    const newBtn = el('lh-sum-new');
    if (newBtn) {
      newBtn.addEventListener('click', () => {
        state.mode = 'practice';
        state.tier = 'mixed';
        startRound();
      });
    }
    const printBtn = el('lh-sum-print');
    if (printBtn) {
      printBtn.addEventListener('click', () => {
        if (typeof window !== 'undefined' && window.print) window.print();
      });
    }
    const hubBtn = el('lh-sum-hub');
    if (hubBtn) {
      hubBtn.addEventListener('click', () => {
        if (typeof onBackCb === 'function') onBackCb();
      });
    }
  }

  function refreshLanguage() {
    if (!activeLab) return;
    renderAll();
  }

  return {
    register,
    getLab,
    listLabs,
    open,
    startRound,
    refreshLanguage,
    // Helpers exported for lab modules and tests
    t,
    esc,
    fmtNum,
    fmtDec,
    parseNum,
    parseDec,
    randInt,
    pick,
    shuffle,
    _getState: () => state,
  };
})();
