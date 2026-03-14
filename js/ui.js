// ui.js - screen management, HUD, overlays

const UI = (() => {
  const screens = {
    onboarding: document.getElementById('screen-onboarding'),
    game: document.getElementById('screen-game'),
    gameover: document.getElementById('screen-gameover'),
    leaderboard: document.getElementById('screen-leaderboard'),
    achievements: document.getElementById('screen-achievements'),
    dashboard: document.getElementById('screen-dashboard')
  };

  function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[name].classList.add('active');
    if (name === 'game' && !isMobile()) {
      document.getElementById('answer-input').focus();
    }
  }

  // ---- Onboarding ----
  function initOnboarding(onStart) {
    const nameInput = document.getElementById('input-name');
    const ageInput = document.getElementById('input-age');
    const rangeMin = document.getElementById('range-min');
    const rangeMax = document.getElementById('range-max');
    const rangeMinVal = document.getElementById('range-min-val');
    const rangeMaxVal = document.getElementById('range-max-val');
    const hintThreshInput = document.getElementById('hint-threshold');
    const hintLabel = document.getElementById('hint-label');
    const modeNote = document.getElementById('mode-note');
    const btnStart = document.getElementById('btn-start');

    let selectedTheme = 'space';
    let selectedDiff = 'medium';
    let selectedMode = 'normal';

    // Language switcher
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        I18n.setLang(btn.dataset.lang);
        // Re-apply dynamic strings that data-i18n doesn't cover
        _refreshDynamicOnboarding(selectedMode);
        _refreshDailyBtn();
      });
    });
    // Apply saved language on load
    I18n.applyToDOM();

    // Theme cards
    document.querySelectorAll('.theme-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        selectedTheme = card.dataset.theme;
      });
    });

    // Mode (normal / practice)
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedMode = btn.dataset.mode;
        _refreshDynamicOnboarding(selectedMode);
      });
    });

    function _refreshDynamicOnboarding(mode) {
      modeNote.textContent = I18n.t(mode === 'practice' ? 'modePracticeNote' : 'modeNormalNote');
      singleNote.textContent = I18n.t('singleNote', { table: focusSingleTable });
      hintLabel.textContent  = I18n.t('hintAfter',  { n: hintThreshInput.value });
    }

    // Difficulty
    document.querySelectorAll('.diff-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedDiff = btn.dataset.diff;
      });
    });

    // Tables tab switcher
    let tablesMode = 'range';
    let focusSingleTable = 10;
    const rangePanel = document.getElementById('tables-range-panel');
    const singlePanel = document.getElementById('tables-single-panel');
    const singleNote = document.getElementById('single-table-note');

    document.querySelectorAll('.tables-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tables-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        tablesMode = tab.dataset.tab;
        rangePanel.hidden = (tablesMode !== 'range');
        singlePanel.hidden = (tablesMode !== 'single');
      });
    });

    // Single-table grid
    document.querySelectorAll('.table-num-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.table-num-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        focusSingleTable = parseInt(btn.dataset.val);
        singleNote.textContent = I18n.t('singleNote', { table: focusSingleTable });
      });
    });

    // Range sliders
    const EXTENDED_MAX = 20;
    const updateRangeDisplay = () => {
      rangeMinVal.textContent = rangeMin.value;
      rangeMaxVal.textContent = rangeMax.value;
    };
    rangeMin.addEventListener('input', () => {
      if (parseInt(rangeMin.value) > parseInt(rangeMax.value)) rangeMax.value = rangeMin.value;
      updateRangeDisplay();
    });
    rangeMax.addEventListener('input', () => {
      if (parseInt(rangeMax.value) < parseInt(rangeMin.value)) rangeMin.value = rangeMax.value;
      updateRangeDisplay();
    });
    updateRangeDisplay();

    // Extended tables: expand sliders + single-table grid when unlocked
    function _updateTablesRange() {
      const extended = Progress.isExtendedTablesUnlocked();
      const newMax = extended ? EXTENDED_MAX : 12;
      rangeMin.max = newMax;
      rangeMax.max = newMax;
      // Re-clamp current values
      if (parseInt(rangeMin.value) > newMax) rangeMin.value = newMax;
      if (parseInt(rangeMax.value) > newMax) rangeMax.value = newMax;
      updateRangeDisplay();
      // Rebuild tick marks
      const ticks = document.querySelector('.range-ticks');
      if (ticks) {
        ticks.innerHTML = Array.from({ length: newMax }, (_, i) => `<span>${i + 1}</span>`).join('');
      }
      // Rebuild extended single-table buttons (13–20)
      const grid = document.getElementById('table-grid');
      grid.querySelectorAll('.table-num-btn.extended').forEach(b => b.remove());
      if (extended) {
        for (let v = 13; v <= EXTENDED_MAX; v++) {
          const btn = document.createElement('button');
          btn.className = 'table-num-btn extended';
          btn.dataset.val = v;
          btn.textContent = v;
          btn.addEventListener('click', () => {
            document.querySelectorAll('.table-num-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            focusSingleTable = v;
            singleNote.textContent = I18n.t('singleNote', { table: v });
          });
          grid.appendChild(btn);
        }
      }
      // Show/hide unlock badge
      const badge = document.getElementById('extended-tables-badge');
      if (badge) badge.hidden = !extended;
    }

    hintThreshInput.addEventListener('input', () => {
      hintLabel.textContent = I18n.t('hintAfter', { n: hintThreshInput.value });
    });

    // ---- Voice trigger word mode ----
    const triggerGroup  = document.getElementById('voice-trigger-group');
    const triggerOff    = document.getElementById('voice-trigger-off');
    const triggerOn     = document.getElementById('voice-trigger-on');
    const triggerWdRow  = document.getElementById('voice-trigger-word-row');
    const triggerWdInput = document.getElementById('voice-trigger-word');

    // Hide if voice not supported
    if (!Voice.supported) {
      if (triggerGroup) triggerGroup.style.display = 'none';
    }

    let _triggerModeOn = false;
    function _setTriggerMode(on) {
      _triggerModeOn = on;
      triggerOff.classList.toggle('active', !on);
      triggerOn.classList.toggle('active', on);
      triggerWdRow.style.display = on ? '' : 'none';
    }
    triggerOff?.addEventListener('click', () => _setTriggerMode(false));
    triggerOn?.addEventListener('click',  () => _setTriggerMode(true));

    // ---- Hold-to-record trigger word ----
    const triggerRecordBtn = document.getElementById('voice-trigger-record-btn');
    let _triggerRecognition = null;

    function _startTriggerRecording() {
      if (!Voice.supported) return;
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR || _triggerRecognition) return;
      _triggerRecognition = new SR();
      _triggerRecognition.continuous = false;
      _triggerRecognition.interimResults = false;
      _triggerRecognition.maxAlternatives = 1;
      _triggerRecognition.lang = (typeof I18n !== 'undefined')
        ? ({ en: 'en-US', de: 'de-DE', es: 'es-ES' }[I18n.getLang()] || 'en-US')
        : (navigator.language || 'en-US');
      triggerRecordBtn.classList.add('recording');
      triggerRecordBtn.textContent = '🔴 Listening…';
      _triggerRecognition.onresult = e => {
        const transcript = (e.results[0]?.[0]?.transcript || '').trim();
        const word = transcript.split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9äöüéàèíóú]/g, '');
        if (word && triggerWdInput) triggerWdInput.value = word;
      };
      _triggerRecognition.onend = () => {
        triggerRecordBtn.classList.remove('recording');
        const label = (typeof I18n !== 'undefined' && I18n.t('voiceTriggerRecord')) || '🎙 Hold to record';
        triggerRecordBtn.textContent = label;
        _triggerRecognition = null;
      };
      _triggerRecognition.onerror = () => {
        triggerRecordBtn.classList.remove('recording');
        _triggerRecognition = null;
      };
      try { _triggerRecognition.start(); } catch (_) {}
    }

    function _stopTriggerRecording() {
      if (_triggerRecognition) {
        try { _triggerRecognition.stop(); } catch (_) {}
      }
    }

    triggerRecordBtn?.addEventListener('pointerdown', e => {
      e.preventDefault();
      _startTriggerRecording();
    });
    triggerRecordBtn?.addEventListener('pointerup',    () => _stopTriggerRecording());
    triggerRecordBtn?.addEventListener('pointerleave', () => _stopTriggerRecording());

    btnStart.addEventListener('click', () => {
      const name = nameInput.value.trim();
      const age = parseInt(ageInput.value);
      if (!name) { nameInput.focus(); nameInput.classList.add('field-error'); return; }
      if (!age || age < 1 || age > 132) { ageInput.focus(); ageInput.classList.add('field-error'); return; }

      let min, max;
      if (tablesMode === 'single') {
        min = focusSingleTable; max = focusSingleTable;
      } else {
        min = parseInt(rangeMin.value);
        max = parseInt(rangeMax.value);
        if (min > max) { const tmp = min; min = max; max = tmp; }
      }

      Progress.setPlayer(name, age);
      Progress.saveName(name);
      Progress.saveSettings({
        theme: selectedTheme, diff: selectedDiff, mode: selectedMode,
        tablesMode, rangeMin: rangeMin.value, rangeMax: rangeMax.value,
        singleTable: focusSingleTable, hintThreshold: parseInt(hintThreshInput.value),
        lastPlayer: name, lastAge: age,
        triggerMode: _triggerModeOn, triggerWord: triggerWdInput?.value?.trim(),
      });
      onStart({ name, age, theme: selectedTheme, minTable: min, maxTable: max,
        difficulty: selectedDiff, hintThreshold: parseInt(hintThreshInput.value),
        practiceMode: selectedMode === 'practice', focusMode: tablesMode === 'single',
        triggerMode: _triggerModeOn, triggerWord: triggerWdInput?.value?.trim() || '' });
    });

    nameInput.addEventListener('input', () => nameInput.classList.remove('field-error'));
    ageInput.addEventListener('input', () => ageInput.classList.remove('field-error'));
    nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') btnStart.click(); });

    // Run Mode button
    const btnRunMode = document.getElementById('btn-run-mode');
    const runSubtitle = document.getElementById('run-mode-subtitle');
    function _refreshRunBtn() {
      const rp = Progress.getRunProgress();
      runSubtitle.textContent = rp.bestAnte > 0 ? ` · Best: Ante ${rp.bestAnte}` : ' · New!';
    }
    _refreshRunBtn();
    btnRunMode.addEventListener('click', () => {
      const name = nameInput.value.trim();
      const age = parseInt(ageInput.value);
      if (!name) { nameInput.focus(); nameInput.classList.add('field-error'); return; }
      if (!age || age < 1 || age > 132) { ageInput.focus(); ageInput.classList.add('field-error'); return; }
      let min, max;
      if (tablesMode === 'single') {
        min = focusSingleTable; max = focusSingleTable;
      } else {
        min = parseInt(rangeMin.value);
        max = parseInt(rangeMax.value);
        if (min > max) { const tmp = min; min = max; max = tmp; }
      }
      Progress.setPlayer(name, age);
      Progress.saveName(name);
      Progress.saveSettings({
        theme: selectedTheme, diff: selectedDiff, mode: selectedMode,
        tablesMode, rangeMin: rangeMin.value, rangeMax: rangeMax.value,
        singleTable: focusSingleTable, hintThreshold: parseInt(hintThreshInput.value),
        lastPlayer: name, lastAge: age,
        triggerWord: triggerWdInput?.value?.trim(),
      });
      onStart({ name, age, theme: selectedTheme, minTable: min, maxTable: max,
        difficulty: selectedDiff, hintThreshold: parseInt(hintThreshInput.value),
        practiceMode: false, runMode: true,
        triggerWord: triggerWdInput?.value?.trim() || '' });
    });

    // Daily challenge button
    const btnDaily = document.getElementById('btn-daily');

    function _refreshDailyBtn() {
      const dp = Progress.getDailyParams();
      const existing = Progress.getDailyResult();
      const diff = I18n.diffLabel(dp.difficulty);
      btnDaily.textContent = existing
        ? I18n.t('dailyDone', { table: dp.table, diff })
        : I18n.t('dailyNew', { table: dp.table, diff });
      btnDaily.classList.toggle('daily-done', !!existing);
    }
    _refreshDailyBtn();

    document.getElementById('btn-leaderboard-home').addEventListener('click', () => {
      showLeaderboard(() => showScreen('onboarding'));
    });

    document.getElementById('btn-achievements-home').addEventListener('click', () => {
      showAchievements(() => showScreen('onboarding'));
    });

    document.getElementById('btn-dashboard').addEventListener('click', () => {
      showDashboard(() => showScreen('onboarding'));
    });

    btnDaily.addEventListener('click', () => {
      const name = nameInput.value.trim();
      const age = parseInt(ageInput.value);
      if (!name) { nameInput.focus(); nameInput.classList.add('field-error'); return; }
      if (!age || age < 1 || age > 132) { ageInput.focus(); ageInput.classList.add('field-error'); return; }
      const dp = Progress.getDailyParams();
      Progress.setPlayer(name, age);
      Progress.saveName(name);
      Progress.saveSettings({ ...Progress.loadSettings(), lastPlayer: name, lastAge: age });
      onStart({ name, age, theme: selectedTheme,
        minTable: dp.table, maxTable: dp.table, difficulty: dp.difficulty,
        hintThreshold: parseInt(hintThreshInput.value), practiceMode: false, isDaily: true,
        triggerMode: _triggerModeOn, triggerWord: triggerWdInput?.value?.trim() || '' });
    });

    // Restore saved name + age, then activate player data for that identity
    const saved = Progress.loadSettings();
    const savedName = saved?.lastPlayer || Progress.getAll().player?.name;
    if (savedName && !nameInput.value) nameInput.value = savedName;
    if (saved?.lastAge && !ageInput.value) ageInput.value = saved.lastAge;
    if (savedName || saved?.lastAge) {
      Progress.setPlayer(nameInput.value, ageInput.value);
    }
    _updateTablesRange();

    // Re-activate player data + refresh extended-tables when name or age changes
    function _onIdentityChange() {
      Progress.setPlayer(nameInput.value.trim(), ageInput.value);
      _updateTablesRange();
    }
    nameInput.addEventListener('change', _onIdentityChange);
    ageInput.addEventListener('change', _onIdentityChange);

    // Restore remaining settings
    if (saved) {
      if (saved.theme) document.querySelector(`.theme-card[data-theme="${saved.theme}"]`)?.click();
      if (saved.diff)  document.querySelector(`.diff-btn[data-diff="${saved.diff}"]`)?.click();
      if (saved.mode)  document.querySelector(`.mode-btn[data-mode="${saved.mode}"]`)?.click();
      if (saved.hintThreshold) {
        hintThreshInput.value = saved.hintThreshold;
      }
      if (saved.tablesMode === 'single') {
        document.querySelector('.tables-tab[data-tab="single"]')?.click();
        if (saved.singleTable)
          document.querySelector(`.table-num-btn[data-val="${saved.singleTable}"]`)?.click();
      } else {
        if (saved.rangeMin) { rangeMin.value = saved.rangeMin; }
        if (saved.rangeMax) { rangeMax.value = saved.rangeMax; }
        updateRangeDisplay();
      }
      if (saved.triggerMode) _setTriggerMode(true);
      if (saved.triggerWord && triggerWdInput) triggerWdInput.value = saved.triggerWord;
    }
    // Apply all dynamic strings in the current language (must run after settings restore)
    _refreshDynamicOnboarding(selectedMode);
    _refreshDailyBtn();
  }

  // ---- HUD ----
  function updateHUD(state) {
    document.getElementById('hud-name').textContent = I18n.t('hiPlayer', { name: state.name });
    document.getElementById('score-val').textContent = state.score;
    document.getElementById('level-val').textContent = state.level;
    const tableLabel = state.minTable === state.maxTable
      ? I18n.t('tablesFocus', { table: state.minTable })
      : I18n.t('tablesRange', { min: state.minTable, max: state.maxTable });
    let hudTables = tableLabel + (state.practiceMode ? ' ' + I18n.t('practiceSuffix') : '');
    if (state.runMode) {
      const badges = [];
      if (state.shieldCharges > 0) badges.push(`🛡×${state.shieldCharges}`);
      if (state.bombCharges > 0)   badges.push(`💣×${state.bombCharges}`);
      hudTables += ` | Ante ${state.currentAnte}` + (badges.length ? ' ' + badges.join(' ') : '');
    }
    document.getElementById('hud-tables').textContent = hudTables;
    renderLives(state.lives, state.maxLives, state.theme);
  }

  function renderLives(lives, max, theme) {
    const icons = { space: '🛡', ocean: '🐟', sky: '❤', cats: '🐾' };
    const icon = icons[theme] || '❤';
    let html = '';
    for (let i = 0; i < max; i++) {
      html += `<span style="opacity:${i < lives ? 1 : 0.2}">${icon}</span>`;
    }
    document.getElementById('hud-lives').innerHTML = html;
  }

  // ---- Combo display ----
  function showCombo(streak) {
    const el = document.getElementById('combo-display');
    if (streak >= 3) {
      const mult = streak >= 5 ? '×2' : '×1.5';
      el.textContent = I18n.t('streakDisplay', { streak, mult });
      el.style.opacity = '1';
    } else {
      el.textContent = '';
    }
  }

  // ---- Try Again message ----
  let tryAgainTimer = null;
  function showTryAgain(question, answer) {
    const el = document.getElementById('try-again-msg');
    if (answer != null) {
      el.innerHTML =
        `<span class="try-again-eq">${I18n.t('tryAgain')} <strong>${answer}</strong> 💡</span>`;
    } else {
      el.textContent = I18n.t('tryAgain');
    }
    el.classList.add('visible');
    if (tryAgainTimer) clearTimeout(tryAgainTimer);
    tryAgainTimer = setTimeout(() => {
      el.classList.remove('visible');
      setTimeout(() => { el.innerHTML = ''; }, 300);
    }, 1400);
  }

  // ---- Miss flash (centre-screen equation reveal) ----
  function showMissFlash(question, answer) {
    const container = document.getElementById('miss-flash-container');
    const el = document.createElement('div');
    el.className = 'miss-flash';
    el.innerHTML =
      `<span class="miss-flash-eq">${question}</span>` +
      `<span class="miss-flash-arrow">=</span>` +
      `<span class="miss-flash-ans">${answer}</span>`;
    container.appendChild(el);
    // Remove element after animation ends (2.4s)
    setTimeout(() => el.remove(), 2450);
  }

  // ---- Input shake animation ----
  function shakeInput() {
    const inp = document.getElementById('answer-input');
    inp.classList.remove('shake');
    void inp.offsetWidth;
    inp.classList.add('shake');
    setTimeout(() => inp.classList.remove('shake'), 500);
  }

  // ---- Level Up ----
  let levelUpTimer = null;
  function showLevelUp(level, stars = null) {
    const el = document.getElementById('level-up-banner');
    const isNumeric = typeof level === 'number';
    const bannerText = isNumeric
      ? I18n.t('levelUpBanner', { n: level })
      : typeof level === 'string' ? level
      : I18n.t('bossDefeated');
    const starStr = stars !== null ? ' ' + '★'.repeat(stars) + '☆'.repeat(3 - stars) : '';
    el.textContent = bannerText + starStr;
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
    if (levelUpTimer) clearTimeout(levelUpTimer);
    levelUpTimer = setTimeout(() => el.classList.remove('show'), 1700);
  }

  // ---- Mastery grid ----
  function _masteryDotClass(f) {
    if (f.masteredLevel >= 5) return 'mastered';
    if (f.masteredLevel >= 3) return 'good';
    if (f.masteredLevel >= 1) return 'fair';
    if (f.attempts > 0)       return 'weak';
    return 'unseen';
  }

  function _renderMasteryGrid(masteryData) {
    const { facts, mastered, seen, total } = masteryData;
    if (total === 0) return '';
    // Group by A value
    const aValues = [...new Set(facts.map(f => f.a))].sort((x, y) => x - y);
    const rows = aValues.map(a => {
      const row = facts.filter(f => f.a === a).sort((x, y) => x.b - y.b);
      const dots = row.map(f =>
        `<span class="mastery-dot ${_masteryDotClass(f)}" title="${f.a}×${f.b}=${f.a*f.b} (${f.masteredLevel}/5)"></span>`
      ).join('');
      return `<div class="mastery-row"><span class="mastery-label">${a}×</span>${dots}</div>`;
    }).join('');
    const seenCount = seen ?? 0;
    const pct = Math.round(seenCount / total * 100);
    const masteredSubtitle = mastered > 0
      ? `<div class="mastery-subtitle">${I18n.t('masteryMasteredCount', { n: mastered })}</div>` : '';
    return `
      <div class="mastery-heading">${I18n.t('masteryTitle')} <span class="mastery-pct">${pct}%</span></div>
      ${masteredSubtitle}
      <div class="mastery-grid">${rows}</div>
      <div class="mastery-legend">
        <span class="mastery-dot mastered"></span>${I18n.t('masteryLegendDone')}
        <span class="mastery-dot good"></span>${I18n.t('masteryLegendClose')}
        <span class="mastery-dot fair"></span>${I18n.t('masteryLegendLearning')}
        <span class="mastery-dot weak"></span>${I18n.t('masteryLegendNeeds')}
        <span class="mastery-dot unseen"></span>${I18n.t('masteryLegendUnseen')}
      </div>`;
  }

  // ---- Game Over ----
  function showGameOver(session, missedList, newAchievements, masteryData, onPlayAgain, onLeaderboard, runData) {
    // Context-sensitive heading based on accuracy
    const goHeadingEl = document.querySelector('#screen-gameover h2');
    if (goHeadingEl) {
      const acc = session.accuracy || 0;
      const goKey = acc >= 0.8 ? 'goExcellent' : acc >= 0.5 ? 'goGood' : 'goKeepTrying';
      goHeadingEl.textContent = I18n.t(goKey, { name: session.name });
    }
    const starsHtml = session.levelStars && session.levelStars.length > 0
      ? `<div class="stars-row">${session.levelStars.map((s, i) =>
          `<span class="level-star-badge" title="Level ${i + 1}">L${i + 1} ${'★'.repeat(s)}${'☆'.repeat(3 - s)}</span>`
        ).join('')}</div>`
      : '';
    const dailyBadge = session.dailyBadge
      ? `<div class="daily-complete-badge">${I18n.t('dailyComplete')}</div>` : '';
    const masteryWinBanner = session.masteryWin
      ? `<div class="mastery-win-banner">🏆 ${I18n.t('masteryWinBanner')} 🏆</div>` : '';
    document.getElementById('gameover-stats').innerHTML = `
      ${masteryWinBanner}
      ${dailyBadge}
      <div>${I18n.t('goScore')}<strong>${session.score}</strong></div>
      <div>${I18n.t('goLevel')}<strong>${session.level}</strong></div>
      <div>${I18n.t('goAccuracy')}<strong>${Math.round(session.accuracy * 100)}%</strong></div>
      <div>${I18n.t('goTheme')}<strong>${session.theme}</strong></div>
      ${starsHtml}
    `;
    const missedEl = document.getElementById('gameover-missed');
    if (missedList.length > 0) {
      missedEl.innerHTML = `<strong>${I18n.t('goMissed')}</strong> ${missedList.map(m => `${m.question} = ${m.answer}`).join(', ')}`;
    } else {
      missedEl.textContent = I18n.t('goNoMissed');
    }

    const achEl = document.getElementById('gameover-achievements');
    if (newAchievements && newAchievements.length > 0) {
      achEl.innerHTML = `<div class="ach-title">${I18n.t('newAchievements')}</div>` +
        newAchievements.map(a => {
          const txt = I18n.achText(a.id);
          return `<div class="ach-badge"><strong>${txt.label}</strong> — ${txt.desc}</div>`;
        }).join('');
    } else {
      achEl.innerHTML = '';
    }

    // Run mode section
    const runEl = document.getElementById('gameover-run');
    if (runData && runData.runMode) {
      const newBest = runData.isNewBest ? '<span class="run-new-best"> New best!</span>' : '';
      const badgeHtml = (runData.activeUpgrades || []).map(upg => {
        const name = upgradeNameForTheme(upg, runData.theme);
        return `<span class="run-upgrade-badge">${name}</span>`;
      }).join('');
      const newUnlocksHtml = (runData.newUnlocks || []).length > 0
        ? `<div class="run-new-unlocks">New upgrades unlocked: ${runData.newUnlocks.map(id => {
            const u = (typeof UPGRADES !== 'undefined' ? UPGRADES : []).find(u => u.id === id);
            return u ? upgradeNameForTheme(u, runData.theme) : id;
          }).join(', ')}</div>`
        : '';
      runEl.innerHTML = `
        <div class="run-summary">
          <div class="run-ante">Run ended at Ante ${runData.ante}${newBest}</div>
          ${badgeHtml ? `<div class="run-upgrades-row">${badgeHtml}</div>` : ''}
          ${newUnlocksHtml}
        </div>`;
    } else {
      runEl.innerHTML = '';
    }

    document.getElementById('gameover-mastery').innerHTML =
      masteryData ? _renderMasteryGrid(masteryData) : '';

    document.getElementById('btn-play-again').onclick = onPlayAgain;
    document.getElementById('btn-leaderboard').onclick = onLeaderboard;
    document.getElementById('btn-achievements').onclick = () => showAchievements(() => showScreen('onboarding'));
    showScreen('gameover');
  }

  // ---- Leaderboard ----
  function showLeaderboard(onBack) {
    const sessions = Progress.getSessions();
    const improved = Progress.isMostImproved();
    document.getElementById('leaderboard-badge').textContent =
      improved ? I18n.t('mostImproved') : '';

    const sorted = [...sessions].sort((a, b) => b.score - a.score);
    const bestScore = sorted.length > 0 ? sorted[0].score : -1;

    const tbody = document.getElementById('leaderboard-body');
    tbody.innerHTML = sessions.slice().reverse().map(s => {
      const isBest = s.score === bestScore;
      const name = s.name || '—';
      const age  = s.age  != null ? s.age : '—';
      const date = s.date ? new Date(s.date).toLocaleDateString() : '—';
      return `<tr class="${isBest ? 'best-row' : ''}">
        <td>${name}</td>
        <td>${age}</td>
        <td>${s.score}</td>
        <td>${Math.round(s.accuracy * 100)}%</td>
        <td>${s.theme}</td>
        <td>${date}</td>
      </tr>`;
    }).join('');

    document.getElementById('btn-lb-back').onclick = onBack;
    showScreen('leaderboard');
  }

  // ---- Parent Dashboard ----
  function showDashboard(onBack) {
    const data = Progress.getAll();
    const stats = data.stats || {};
    const sessions = data.sessions || [];
    const playerName = data.player?.name || 'Player';

    const totalSessions = sessions.length;
    const bestScore = sessions.length > 0 ? Math.max(...sessions.map(s => s.score)) : 0;
    const avgAcc = sessions.length > 0
      ? Math.round(sessions.reduce((a, s) => a + s.accuracy, 0) / sessions.length * 100) : 0;

    document.getElementById('dashboard-player').innerHTML =
      `<div class="dash-player">${I18n.t('dashProgress', { name: playerName })}</div>`;
    document.getElementById('dashboard-summary').innerHTML = `
      <div class="dash-stats">
        <div class="dash-stat"><span>${totalSessions}</span>${I18n.t('dashSessions')}</div>
        <div class="dash-stat"><span>${bestScore}</span>${I18n.t('dashBestScore')}</div>
        <div class="dash-stat"><span>${avgAcc}%</span>${I18n.t('dashAvgAcc')}</div>
      </div>`;

    const tables = [];
    for (let t = 1; t <= 12; t++) {
      let attempts = 0, correct = 0;
      for (let b = 1; b <= 12; b++) {
        const s = stats[`${t}x${b}`];
        if (s) { attempts += s.attempts; correct += s.correct; }
        const s2 = stats[`${b}x${t}`];
        if (s2 && b !== t) { attempts += s2.attempts; correct += s2.correct; }
      }
      tables.push({ table: t, attempts, acc: attempts > 0 ? correct / attempts : null });
    }

    const canvas = document.getElementById('dashboard-chart');
    const cw = Math.min(620, window.innerWidth - 80);
    const ch = 160;
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, cw, ch);
    const barW = Math.floor((cw - 40) / 12) - 4;
    const maxH = ch - 40;

    tables.forEach(({ table, acc }, i) => {
      const bx = 20 + i * (barW + 4);
      const fillH = acc !== null ? Math.max(4, acc * maxH) : 0;
      const by = ch - 24 - fillH;
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(bx, ch - 24 - maxH, barW, maxH);
      if (acc !== null) {
        ctx.fillStyle = `hsl(${Math.round(acc * 120)},80%,55%)`;
        ctx.fillRect(bx, by, barW, fillH);
      }
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '11px Segoe UI, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${table}×`, bx + barW / 2, ch - 6);
      if (acc !== null) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px Segoe UI, sans-serif';
        ctx.fillText(`${Math.round(acc * 100)}%`, bx + barW / 2, by - 4);
      }
    });

    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '11px Segoe UI, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(I18n.t('dashChartLabel'), 20, 14);

    const weak = tables.filter(t => t.acc !== null && t.acc < 0.7).sort((a, b) => a.acc - b.acc).slice(0, 5);
    const detailEl = document.getElementById('dashboard-table-detail');
    if (weak.length > 0) {
      detailEl.innerHTML = `<div class="dash-weak-title">${I18n.t('dashNeedsPractice')}</div>` +
        weak.map(t => `<span class="dash-weak-badge">${I18n.t('dashWeakBadge', { table: t.table, acc: Math.round(t.acc * 100) })}</span>`).join('');
    } else if (tables.some(t => t.attempts > 0)) {
      detailEl.innerHTML = `<div class="dash-weak-title" style="color:#2ed573">${I18n.t('dashAllGood')}</div>`;
    } else {
      detailEl.innerHTML = `<div class="dash-weak-title">${I18n.t('dashNoData')}</div>`;
    }

    document.getElementById('btn-back-dashboard').onclick = onBack;
    showScreen('dashboard');
  }

  // ---- Upgrade Picker ----
  function showUpgradePicker(options, theme, onPick) {
    const el = document.getElementById('upgrade-picker');
    const optionsEl = document.getElementById('upgrade-options');
    optionsEl.innerHTML = '';
    options.forEach(upg => {
      const name = upgradeNameForTheme(upg, theme);
      const desc = upgradeDescForTheme(upg, theme);
      const btn = document.createElement('button');
      btn.className = 'upgrade-option';
      btn.innerHTML = `<div class="upgrade-name">${name}</div><div class="upgrade-desc">${desc}</div>`;
      btn.addEventListener('click', () => {
        el.classList.add('hidden');
        onPick(upg);
      });
      optionsEl.appendChild(btn);
    });
    el.classList.remove('hidden');
  }

  // ---- Achievements ----
  function showAchievements(onBack) {
    const all = Progress.getAchievements();
    const tbody = document.getElementById('achievements-body');
    tbody.innerHTML = all.map(a => {
      const txt = I18n.achText(a.id);
      return `
        <tr class="${a.unlocked ? 'ach-unlocked' : 'ach-locked'}">
          <td>${a.unlocked ? '🏆' : '🔒'}</td>
          <td><strong>${txt.label}</strong><br><small>${txt.desc}</small></td>
          <td>${a.unlocked ? new Date(a.unlockedAt).toLocaleDateString() : '—'}</td>
        </tr>`;
    }).join('');
    document.getElementById('btn-back-achievements').onclick = onBack;
    showScreen('achievements');
  }

  // ---- Table cleared banner (all facts in a table answered ≥1 time) ----
  function showTableClearedBanner(table) {
    showLevelUp(I18n.t('tableClearedBanner', { table }), null);
  }

  // ---- Saved! (answered correctly during grace period) ----
  function showSaved() {
    const container = document.getElementById('miss-flash-container');
    const el = document.createElement('div');
    el.className = 'miss-flash saved-flash';
    el.innerHTML = `<span class="miss-flash-ans">${I18n.t('savedMsg')}</span>`;
    container.appendChild(el);
    setTimeout(() => el.remove(), 1100);
  }

  // ---- First time answering a new fact correctly ----
  function showFirstTime(question) {
    showLevelUp(I18n.t('firstTimeMsg', { q: question }), null);
  }

  // ---- Help / SOS button ----
  function updateHelpBtn(cooldown, max) {
    const btn = document.getElementById('btn-help');
    if (!btn) return;
    if (cooldown <= 0) {
      btn.textContent = '💡';
      btn.title = 'Help — reveal the answer (H)';
      btn.disabled = false;
      btn.classList.remove('help-cooldown');
      btn.style.removeProperty('--help-progress');
    } else {
      const secs = Math.ceil(cooldown);
      btn.textContent = `💡 ${secs}s`;
      btn.title = `Help on cooldown — ${secs}s remaining`;
      btn.disabled = true;
      btn.classList.add('help-cooldown');
      btn.style.setProperty('--help-progress', `${((max - cooldown) / max * 100).toFixed(1)}%`);
    }
  }

  // ---- Boss Victory ----
  function showBossVictory(stars, score, onContinue, onFinish) {
    const overlay = document.getElementById('boss-victory-overlay');
    const starStr = stars !== null ? '★'.repeat(stars) + '☆'.repeat(3 - stars) : '';
    document.getElementById('boss-victory-stars').textContent = starStr;
    document.getElementById('boss-victory-sub').textContent = `Score: ${score}`;
    document.getElementById('btn-keep-going').onclick = () => { overlay.classList.remove('visible'); onContinue(); };
    document.getElementById('btn-finish-game').onclick = () => { overlay.classList.remove('visible'); onFinish(); };
    overlay.classList.add('visible');
  }

  return { showScreen, initOnboarding, updateHUD, showCombo, showTryAgain,
    shakeInput, showLevelUp, showMissFlash, showGameOver, showLeaderboard, showAchievements, showDashboard, showUpgradePicker, showTableClearedBanner, showSaved, showFirstTime, updateHelpBtn, showBossVictory };
})();
