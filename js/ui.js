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
    if (name === 'game') {
      document.getElementById('answer-input').focus();
    }
  }

  // ---- Onboarding ----
  function initOnboarding(onStart) {
    const nameInput = document.getElementById('input-name');
    const ageInput = document.getElementById('input-age');
    const rangeMin = document.getElementById('range-min');
    const rangeMax = document.getElementById('range-max');
    const rangeDisplay = document.getElementById('range-display');
    const hintThreshInput = document.getElementById('hint-threshold');
    const hintThreshDisplay = document.getElementById('hint-threshold-display');
    const focusToggle = document.getElementById('focus-mode-toggle');
    const focusSelect = document.getElementById('focus-table');
    const modeNote = document.getElementById('mode-note');
    const btnStart = document.getElementById('btn-start');

    let selectedTheme = 'space';
    let selectedDiff = 'medium';
    let selectedMode = 'normal';

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
        modeNote.textContent = selectedMode === 'practice'
          ? 'No lives — answer at your own pace'
          : 'Lose lives when objects hit the bottom';
      });
    });

    // Focus mode toggle
    focusToggle.addEventListener('change', () => {
      focusSelect.disabled = !focusToggle.checked;
    });

    // Difficulty
    document.querySelectorAll('.diff-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedDiff = btn.dataset.diff;
      });
    });

    // Range sliders — clamp so min ≤ max at all times
    rangeMin.addEventListener('input', () => {
      if (parseInt(rangeMin.value) > parseInt(rangeMax.value)) {
        rangeMax.value = rangeMin.value;
      }
      rangeDisplay.textContent = `${rangeMin.value} – ${rangeMax.value}`;
    });
    rangeMax.addEventListener('input', () => {
      if (parseInt(rangeMax.value) < parseInt(rangeMin.value)) {
        rangeMin.value = rangeMax.value;
      }
      rangeDisplay.textContent = `${rangeMin.value} – ${rangeMax.value}`;
    });
    rangeDisplay.textContent = `${rangeMin.value} – ${rangeMax.value}`;

    hintThreshInput.addEventListener('input', () => {
      hintThreshDisplay.textContent = hintThreshInput.value;
    });

    btnStart.addEventListener('click', () => {
      const name = nameInput.value.trim();
      const age = parseInt(ageInput.value);

      if (!name) {
        nameInput.focus();
        nameInput.classList.add('field-error');
        return;
      }
      if (!age || age < 1 || age > 132) {
        ageInput.focus();
        ageInput.classList.add('field-error');
        return;
      }

      let min = parseInt(rangeMin.value);
      let max = parseInt(rangeMax.value);
      if (min > max) { const t = min; min = max; max = t; }

      // Focus mode overrides range
      if (focusToggle.checked) {
        const ft = parseInt(focusSelect.value);
        min = ft; max = ft;
      }

      Progress.saveName(name);
      onStart({ name, age, theme: selectedTheme, minTable: min, maxTable: max, difficulty: selectedDiff, hintThreshold: parseInt(hintThreshInput.value), practiceMode: selectedMode === 'practice' });
    });

    // Clear error highlight on input
    nameInput.addEventListener('input', () => nameInput.classList.remove('field-error'));
    ageInput.addEventListener('input', () => ageInput.classList.remove('field-error'));

    // Allow Enter to start
    nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') btnStart.click(); });

    // Daily challenge button
    const btnDaily = document.getElementById('btn-daily');
    const dp = Progress.getDailyParams();
    const existing = Progress.getDailyResult();
    btnDaily.textContent = existing ? `⚡ Daily Challenge ✓ (${dp.table}× • ${dp.difficulty})` : `⚡ Daily Challenge — ${dp.table}× table • ${dp.difficulty}`;
    if (existing) btnDaily.classList.add('daily-done');

    document.getElementById('btn-dashboard').addEventListener('click', () => {
      showDashboard(() => showScreen('onboarding'));
    });

    btnDaily.addEventListener('click', () => {
      const name = nameInput.value.trim();
      const age = parseInt(ageInput.value);
      if (!name) { nameInput.focus(); nameInput.classList.add('field-error'); return; }
      if (!age || age < 1 || age > 132) { ageInput.focus(); ageInput.classList.add('field-error'); return; }
      Progress.saveName(name);
      onStart({
        name, age,
        theme: selectedTheme,
        minTable: dp.table, maxTable: dp.table,
        difficulty: dp.difficulty,
        hintThreshold: parseInt(hintThreshInput.value),
        practiceMode: false,
        isDaily: true
      });
    });
  }

  // ---- HUD ----
  function updateHUD(state) {
    document.getElementById('hud-name').textContent = `Hi ${state.name}!`;
    document.getElementById('score-val').textContent = state.score;
    document.getElementById('level-val').textContent = state.level;
    const tableLabel = state.minTable === state.maxTable
      ? `${state.minTable}× table`
      : `${state.minTable}–${state.maxTable} tables`;
    document.getElementById('hud-tables').textContent = tableLabel + (state.practiceMode ? ' · Practice' : '');
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
      el.textContent = `${streak} streak! ${mult}`;
      el.style.opacity = '1';
    } else {
      el.textContent = '';
    }
  }

  // ---- Try Again message ----
  let tryAgainTimer = null;
  function showTryAgain() {
    const el = document.getElementById('try-again-msg');
    el.textContent = 'Try again!';
    if (tryAgainTimer) clearTimeout(tryAgainTimer);
    tryAgainTimer = setTimeout(() => { el.textContent = ''; }, 500);
  }

  // ---- Input shake animation ----
  function shakeInput() {
    const inp = document.getElementById('answer-input');
    inp.classList.remove('shake');
    void inp.offsetWidth; // reflow
    inp.classList.add('shake');
    setTimeout(() => inp.classList.remove('shake'), 500);
  }

  // ---- Level Up ----
  let levelUpTimer = null;
  function showLevelUp(level, stars = null) {
    const el = document.getElementById('level-up-banner');
    const starStr = stars !== null ? ' ' + '★'.repeat(stars) + '☆'.repeat(3 - stars) : '';
    el.textContent = `Level ${level}!${starStr}`;
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
    const dailyBadge = session.dailyBadge ? '<div class="daily-complete-badge">⚡ Daily Challenge Complete!</div>' : '';
    document.getElementById('gameover-stats').innerHTML = `
      ${dailyBadge}
      <div>Score: <strong>${session.score}</strong></div>
      <div>Level reached: <strong>${session.level}</strong></div>
      <div>Accuracy: <strong>${Math.round(session.accuracy * 100)}%</strong></div>
      <div>Theme: <strong>${session.theme}</strong></div>
      ${starsHtml}
    `;
    const missedEl = document.getElementById('gameover-missed');
    if (missedList.length > 0) {
      missedEl.innerHTML = `<strong>Missed:</strong> ${missedList.map(m => `${m.question} = ${m.answer}`).join(', ')}`;
    } else {
      missedEl.textContent = 'No missed questions!';
    }
    // New achievements
    const achEl = document.getElementById('gameover-achievements');
    if (newAchievements && newAchievements.length > 0) {
      achEl.innerHTML = '<div class="ach-title">🏆 New Achievements!</div>' +
        newAchievements.map(a => `<div class="ach-badge"><strong>${a.label}</strong> — ${a.desc}</div>`).join('');
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
      improved ? 'Most Improved! Great job this session!' : '';

    const sorted = [...sessions].sort((a, b) => b.score - a.score);
    const bestScore = sorted.length > 0 ? sorted[0].score : -1;

    const tbody = document.getElementById('leaderboard-body');
    tbody.innerHTML = sessions.slice().reverse().map((s, i) => {
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

  function showDashboard(onBack) {
    const data = Progress.getAll();
    const stats = data.stats || {};
    const sessions = data.sessions || [];
    const playerName = data.player?.name || 'Player';

    // Summary stats
    const totalSessions = sessions.length;
    const bestScore = sessions.length > 0 ? Math.max(...sessions.map(s => s.score)) : 0;
    const avgAcc = sessions.length > 0
      ? Math.round(sessions.reduce((a, s) => a + s.accuracy, 0) / sessions.length * 100)
      : 0;

    document.getElementById('dashboard-player').innerHTML =
      `<div class="dash-player">Progress for <strong>${playerName}</strong></div>`;
    document.getElementById('dashboard-summary').innerHTML = `
      <div class="dash-stats">
        <div class="dash-stat"><span>${totalSessions}</span>Sessions</div>
        <div class="dash-stat"><span>${bestScore}</span>Best Score</div>
        <div class="dash-stat"><span>${avgAcc}%</span>Avg Accuracy</div>
      </div>`;

    // Build per-table accuracy data
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

    // Draw bar chart on canvas
    const canvas = document.getElementById('dashboard-chart');
    const cw = Math.min(620, window.innerWidth - 80);
    const ch = 160;
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, cw, ch);

    const barW = Math.floor((cw - 40) / 12) - 4;
    const maxH = ch - 40;

    tables.forEach(({ table, attempts, acc }, i) => {
      const bx = 20 + i * (barW + 4);
      const fillH = acc !== null ? Math.max(4, acc * maxH) : 0;
      const by = ch - 24 - fillH;

      // Bar background
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(bx, ch - 24 - maxH, barW, maxH);

      // Bar fill — colour by accuracy
      if (acc !== null) {
        const hue = Math.round(acc * 120); // red(0) → green(120)
        ctx.fillStyle = `hsl(${hue},80%,55%)`;
        ctx.fillRect(bx, by, barW, fillH);
      }

      // Table label
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '11px Segoe UI, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${table}×`, bx + barW / 2, ch - 6);

      // Accuracy %
      if (acc !== null) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px Segoe UI, sans-serif';
        ctx.fillText(`${Math.round(acc * 100)}%`, bx + barW / 2, by - 4);
      }
    });

    // Label
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '11px Segoe UI, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Accuracy per table (grey = not yet attempted)', 20, 14);

    // Weak spots table
    const weak = tables
      .filter(t => t.acc !== null && t.acc < 0.7)
      .sort((a, b) => a.acc - b.acc)
      .slice(0, 5);
    const detailEl = document.getElementById('dashboard-table-detail');
    if (weak.length > 0) {
      detailEl.innerHTML = '<div class="dash-weak-title">Needs practice:</div>' +
        weak.map(t => `<span class="dash-weak-badge">${t.table}× table — ${Math.round(t.acc * 100)}%</span>`).join('');
    } else if (tables.some(t => t.attempts > 0)) {
      detailEl.innerHTML = '<div class="dash-weak-title" style="color:#2ed573">All attempted tables are ≥70% — great work!</div>';
    } else {
      detailEl.innerHTML = '<div class="dash-weak-title">No data yet — play some games first!</div>';
    }

    document.getElementById('btn-back-dashboard').onclick = onBack;
    showScreen('dashboard');
  }

  function showAchievements(onBack) {
    const all = Progress.getAchievements();
    const tbody = document.getElementById('achievements-body');
    tbody.innerHTML = all.map(a => `
      <tr class="${a.unlocked ? 'ach-unlocked' : 'ach-locked'}">
        <td>${a.unlocked ? '🏆' : '🔒'}</td>
        <td><strong>${a.label}</strong><br><small>${a.desc}</small></td>
        <td>${a.unlocked ? new Date(a.unlockedAt).toLocaleDateString() : '—'}</td>
      </tr>`).join('');
    document.getElementById('btn-back-achievements').onclick = onBack;
    showScreen('achievements');
  }

  return { showScreen, initOnboarding, updateHUD, showCombo, showTryAgain, shakeInput, showLevelUp, showGameOver, showLeaderboard, showAchievements, showDashboard };
})();
