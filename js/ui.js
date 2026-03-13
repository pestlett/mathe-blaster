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
    const hintThreshDisplay = document.getElementById('hint-threshold-display');
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
      // Refresh single-table note
      const label = document.getElementById('single-table-label');
      if (label) {
        const tableNote = document.getElementById('single-table-note');
        if (tableNote) tableNote.textContent = I18n.t('singleNote', { table: label.textContent.replace('×', '') });
      }
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
    const singleLabel = document.getElementById('single-table-label');
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
        singleLabel.textContent = `${focusSingleTable}×`;
        singleNote.textContent = I18n.t('singleNote', { table: focusSingleTable });
      });
    });

    // Range sliders
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

    hintThreshInput.addEventListener('input', () => {
      hintThreshDisplay.textContent = hintThreshInput.value;
    });

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

      Progress.saveName(name);
      onStart({ name, age, theme: selectedTheme, minTable: min, maxTable: max,
        difficulty: selectedDiff, hintThreshold: parseInt(hintThreshInput.value),
        practiceMode: selectedMode === 'practice', focusMode: tablesMode === 'single' });
    });

    nameInput.addEventListener('input', () => nameInput.classList.remove('field-error'));
    ageInput.addEventListener('input', () => ageInput.classList.remove('field-error'));
    nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') btnStart.click(); });

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
      Progress.saveName(name);
      onStart({ name, age, theme: selectedTheme,
        minTable: dp.table, maxTable: dp.table, difficulty: dp.difficulty,
        hintThreshold: parseInt(hintThreshInput.value), practiceMode: false, isDaily: true });
    });
  }

  // ---- HUD ----
  function updateHUD(state) {
    document.getElementById('hud-name').textContent = I18n.t('hiPlayer', { name: state.name });
    document.getElementById('score-val').textContent = state.score;
    document.getElementById('level-val').textContent = state.level;
    const tableLabel = state.minTable === state.maxTable
      ? I18n.t('tablesFocus', { table: state.minTable })
      : I18n.t('tablesRange', { min: state.minTable, max: state.maxTable });
    document.getElementById('hud-tables').textContent =
      tableLabel + (state.practiceMode ? ' ' + I18n.t('practiceSuffix') : '');
    renderLives(state.lives, state.maxLives, state.theme);
  }

  function renderLives(lives, max, theme) {
    const icons = { space: '🛡', ocean: '🐟', sky: '❤' };
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
  function showTryAgain() {
    const el = document.getElementById('try-again-msg');
    el.textContent = I18n.t('tryAgain');
    if (tryAgainTimer) clearTimeout(tryAgainTimer);
    tryAgainTimer = setTimeout(() => { el.textContent = ''; }, 500);
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
      : I18n.t('bossDefeated');
    const starStr = stars !== null ? ' ' + '★'.repeat(stars) + '☆'.repeat(3 - stars) : '';
    el.textContent = bannerText + starStr;
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
    if (levelUpTimer) clearTimeout(levelUpTimer);
    levelUpTimer = setTimeout(() => el.classList.remove('show'), 1700);
  }

  // ---- Game Over ----
  function showGameOver(session, missedList, newAchievements, onPlayAgain, onLeaderboard) {
    const starsHtml = session.levelStars && session.levelStars.length > 0
      ? `<div class="stars-row">${session.levelStars.map((s, i) =>
          `<span class="level-star-badge" title="Level ${i + 1}">L${i + 1} ${'★'.repeat(s)}${'☆'.repeat(3 - s)}</span>`
        ).join('')}</div>`
      : '';
    const dailyBadge = session.dailyBadge
      ? `<div class="daily-complete-badge">${I18n.t('dailyComplete')}</div>` : '';
    document.getElementById('gameover-stats').innerHTML = `
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

    document.getElementById('btn-play-again').onclick = onPlayAgain;
    document.getElementById('btn-leaderboard').onclick = onLeaderboard;
    document.getElementById('btn-achievements').onclick = () => showAchievements(() => showScreen('onboarding'));
    showScreen('gameover');
  }

  // ---- Leaderboard ----
  function showLeaderboard(onPlayAgain) {
    const sessions = Progress.getSessions();
    const improved = Progress.isMostImproved();
    document.getElementById('leaderboard-badge').textContent =
      improved ? I18n.t('mostImproved') : '';

    const sorted = [...sessions].sort((a, b) => b.score - a.score);
    const bestScore = sorted.length > 0 ? sorted[0].score : -1;

    const tbody = document.getElementById('leaderboard-body');
    tbody.innerHTML = sessions.slice().reverse().map(s => {
      const isBest = s.score === bestScore;
      return `<tr class="${isBest ? 'best-row' : ''}">
        <td>${new Date(s.date).toLocaleDateString()}</td>
        <td>${s.score}</td>
        <td>${s.level}</td>
        <td>${Math.round(s.accuracy * 100)}%</td>
        <td>${s.theme}</td>
      </tr>`;
    }).join('');

    document.getElementById('btn-play-again-lb').onclick = onPlayAgain;
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

  return { showScreen, initOnboarding, updateHUD, showCombo, showTryAgain,
    shakeInput, showLevelUp, showMissFlash, showGameOver, showLeaderboard, showAchievements, showDashboard };
})();
