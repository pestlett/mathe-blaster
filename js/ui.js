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
    let selectedOp = 'multiply';
    let selectedNumRange = 100;
    let selectedZehner = false;
    let selectedHalbschriftlich = false;
    let selectedOperations = null; // null = single op (use selectedOp); array = mixed mode

    // Operation selector
    const opNote = document.getElementById('op-note');
    const tablesLabel = document.getElementById('tables-label');
    const numrangeGroup = document.getElementById('numrange-group');
    const numrangeNote  = document.getElementById('numrange-note');
    const zehnerGroup = document.getElementById('zehner-group');
    const zehnerNote  = document.getElementById('zehner-note');
    const tablesSection = document.getElementById('tables-section');
    const opNoteKeys = {
      multiply: 'opNoteMultiply', divide: 'opNoteDivide',
      add: 'opNoteAdd', subtract: 'opNoteSubtract'
    };
    function _clearMixed() {
      selectedOperations = null;
      document.querySelectorAll('#mixed-group .numrange-btn').forEach(b => b.classList.remove('active'));
      if (document.getElementById('mixed-note')) document.getElementById('mixed-note').textContent = '';
    }

    function _applyOp(op) {
      selectedOp = op;
      document.querySelectorAll('.op-btn').forEach(b => b.classList.toggle('active', b.dataset.op === op));
      if (opNote) opNote.textContent = I18n.t(opNoteKeys[op]);
      // Update "Tables / Zahlenraum" label
      if (tablesLabel) {
        const labelKey = (op === 'add' || op === 'subtract') ? `tables${op.charAt(0).toUpperCase()+op.slice(1)}` : 'tables';
        tablesLabel.textContent = I18n.t(labelKey);
      }
      const isAddSub = op === 'add' || op === 'subtract';
      if (numrangeGroup) numrangeGroup.hidden = !isAddSub;
      if (tablesSection) tablesSection.hidden = isAddSub;
      if (numrangeNote && isAddSub) numrangeNote.textContent = I18n.t(
        selectedNumRange >= 1000 ? 'numRange1000Note' : 'numRange100Note'
      );
      const isMulDiv = op === 'multiply' || op === 'divide';
      if (zehnerGroup) zehnerGroup.hidden = !isMulDiv;
      // Numberblocks videos only apply to multiplication tables
      if (op === 'divide') {
        document.getElementById('numberblocks-link')?.classList.add('hidden');
      }
    }
    document.querySelectorAll('.op-btn').forEach(btn => {
      btn.addEventListener('click', () => { _clearMixed(); _applyOp(btn.dataset.op); });
    });

    const mixedMulDiv = document.getElementById('mixed-muldiv');
    const mixedAddSub = document.getElementById('mixed-addsub');
    const mixedAll    = document.getElementById('mixed-all');
    const mixedNote   = document.getElementById('mixed-note');

    if (mixedMulDiv) mixedMulDiv.addEventListener('click', () => {
      _clearMixed();
      mixedMulDiv.classList.add('active');
      selectedOperations = ['multiply', 'divide'];
      _applyOp('multiply'); // show table section, zehner group
      if (mixedNote) mixedNote.textContent = I18n.t('mixedMulDivNote');
    });
    if (mixedAddSub) mixedAddSub.addEventListener('click', () => {
      _clearMixed();
      mixedAddSub.classList.add('active');
      selectedOperations = ['add', 'subtract'];
      _applyOp('add'); // show numrange section
      if (mixedNote) mixedNote.textContent = I18n.t('mixedAddSubNote');
    });
    if (mixedAll) mixedAll.addEventListener('click', () => {
      _clearMixed();
      mixedAll.classList.add('active');
      selectedOperations = ['multiply', 'divide', 'add', 'subtract'];
      _applyOp('multiply'); // show table section (primary)
      if (mixedNote) mixedNote.textContent = I18n.t('mixedAllNote');
    });

    document.querySelectorAll('[data-max]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-max]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedNumRange = parseInt(btn.dataset.max);
        if (numrangeNote) numrangeNote.textContent = I18n.t(
          selectedNumRange >= 1000 ? 'numRange1000Note' : 'numRange100Note'
        );
      });
    });

    document.querySelectorAll('[data-zehner]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-zehner]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const val = btn.dataset.zehner;
        selectedZehner = val === 'true';
        selectedHalbschriftlich = val === 'halbschriftlich';
        if (zehnerNote) {
          zehnerNote.textContent = selectedZehner
            ? I18n.t('zehnerOnNote')
            : selectedHalbschriftlich
            ? I18n.t('zehnerHalbschriftlichNote')
            : '';
        }
      });
    });

    // Language switcher
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        I18n.setLang(btn.dataset.lang);
        // Re-apply dynamic strings that data-i18n doesn't cover
        _refreshDynamicOnboarding(selectedMode);
        _refreshDailyBtn();
      });
    });

    // Settings modal
    const settingsModal = document.getElementById('settings-modal');
    const btnSettings = document.getElementById('btn-settings');
    const btnSettingsClose = document.getElementById('btn-settings-close');

    function openSettings() {
      settingsModal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function closeSettings() {
      settingsModal.classList.remove('open');
      document.body.style.overflow = '';
    }

    btnSettings?.addEventListener('click', openSettings);
    btnSettingsClose?.addEventListener('click', closeSettings);
    settingsModal?.addEventListener('click', e => { if (e.target === settingsModal) closeSettings(); });

    // Help modal
    const helpModal = document.getElementById('help-modal');
    const btnHelpModal = document.getElementById('btn-help-modal');
    const btnHelpModalClose = document.getElementById('btn-help-modal-close');

    function openHelp() {
      helpModal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function closeHelp() {
      helpModal.classList.remove('open');
      document.body.style.overflow = '';
    }

    btnHelpModal?.addEventListener('click', openHelp);
    btnHelpModalClose?.addEventListener('click', closeHelp);
    helpModal?.addEventListener('click', e => { if (e.target === helpModal) closeHelp(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        if (settingsModal?.classList.contains('open')) closeSettings();
        if (helpModal?.classList.contains('open')) closeHelp();
      }
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
    document.querySelectorAll('.mode-btn[data-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-btn[data-mode]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedMode = btn.dataset.mode;
        _refreshDynamicOnboarding(selectedMode);
      });
    });

    function _refreshDynamicOnboarding(mode) {
      modeNote.textContent = I18n.t(mode === 'practice' ? 'modePracticeNote' : 'modeNormalNote');
      const singleNoteKey = selectedOp === 'divide' ? 'singleNoteDivide'
        : selectedOp === 'add' ? 'singleNoteAdd'
        : selectedOp === 'subtract' ? 'singleNoteSubtract'
        : 'singleNote';
      singleNote.textContent = I18n.t(singleNoteKey, { table: focusSingleTable, table2: focusSingleTable * 4 });
      hintLabel.textContent  = I18n.t('hintAfter',  { n: hintThreshInput.value });
      _applyOp(selectedOp); // re-apply op strings in current language
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
    const numberblocksLink = document.getElementById('numberblocks-link');
    const numberblocksLinkTable = document.getElementById('numberblocks-link-table');
    document.querySelectorAll('.table-num-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.table-num-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        focusSingleTable = parseInt(btn.dataset.val);
        const snKey = selectedOp === 'divide' ? 'singleNoteDivide'
          : selectedOp === 'add' ? 'singleNoteAdd'
          : selectedOp === 'subtract' ? 'singleNoteSubtract'
          : 'singleNote';
        singleNote.textContent = I18n.t(snKey, { table: focusSingleTable, table2: focusSingleTable * 4 });
        if (btn.dataset.youtube) {
          numberblocksLink.href = btn.dataset.youtube;
          numberblocksLinkTable.textContent = focusSingleTable;
          numberblocksLink.classList.remove('hidden');
        } else {
          numberblocksLink.classList.add('hidden');
        }
      });
    });
    // Show link for the initially active button
    const activeBtn = document.querySelector('.table-num-btn.active');
    if (activeBtn?.dataset.youtube) {
      numberblocksLink.href = activeBtn.dataset.youtube;
      numberblocksLinkTable.textContent = activeBtn.dataset.val;
      numberblocksLink.classList.remove('hidden');
    }

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
      const newMax = extended ? EXTENDED_MAX : 10;
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
      // Show/hide 11 and 12 single-table buttons based on extended unlock
      document.querySelectorAll('.table-num-btn').forEach(btn => {
        const val = parseInt(btn.dataset.val);
        if (val > 10) btn.style.display = extended ? '' : 'none';
      });
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
            const snk = selectedOp === 'divide' ? 'singleNoteDivide'
              : selectedOp === 'add' ? 'singleNoteAdd'
              : selectedOp === 'subtract' ? 'singleNoteSubtract'
              : 'singleNote';
            singleNote.textContent = I18n.t(snk, { table: v, table2: v * 4 });
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
      if (!name) {
        openSettings();
        setTimeout(() => { nameInput.focus(); nameInput.classList.add('field-error'); }, 50);
        return;
      }
      if (!age || age < 1 || age > 132) {
        openSettings();
        setTimeout(() => { ageInput.focus(); ageInput.classList.add('field-error'); }, 50);
        return;
      }

      let min, max;
      if (selectedOp === 'add' || selectedOp === 'subtract') {
        min = 1; max = selectedNumRange;
      } else if (tablesMode === 'single') {
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
        operation: selectedOp,
        tablesMode, rangeMin: rangeMin.value, rangeMax: rangeMax.value,
        singleTable: focusSingleTable, hintThreshold: parseInt(hintThreshInput.value),
        lastPlayer: name, lastAge: age,
        triggerMode: _triggerModeOn, triggerWord: triggerWdInput?.value?.trim(),
        numRange: selectedNumRange, zehner: selectedZehner, halbschriftlich: selectedHalbschriftlich,
        mixedPreset: selectedOperations ? selectedOperations.join(',') : null,
      });
      onStart({ name, age, theme: selectedTheme, minTable: min, maxTable: max,
        operation: selectedOp,
        operations: selectedOperations || [selectedOp],
        addSubRange: selectedNumRange,
        difficulty: selectedDiff, hintThreshold: parseInt(hintThreshInput.value),
        practiceMode: selectedMode === 'practice', focusMode: tablesMode === 'single',
        triggerMode: _triggerModeOn, triggerWord: triggerWdInput?.value?.trim() || '',
        zehner: selectedZehner, halbschriftlich: selectedHalbschriftlich });
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
      if (!name) {
        openSettings();
        setTimeout(() => { nameInput.focus(); nameInput.classList.add('field-error'); }, 50);
        return;
      }
      if (!age || age < 1 || age > 132) {
        openSettings();
        setTimeout(() => { ageInput.focus(); ageInput.classList.add('field-error'); }, 50);
        return;
      }
      let min, max;
      if (selectedOp === 'add' || selectedOp === 'subtract') {
        min = 1; max = selectedNumRange;
      } else if (tablesMode === 'single') {
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
        operation: selectedOp,
        tablesMode, rangeMin: rangeMin.value, rangeMax: rangeMax.value,
        singleTable: focusSingleTable, hintThreshold: parseInt(hintThreshInput.value),
        lastPlayer: name, lastAge: age,
        triggerWord: triggerWdInput?.value?.trim(),
        numRange: selectedNumRange, zehner: selectedZehner, halbschriftlich: selectedHalbschriftlich,
        mixedPreset: selectedOperations ? selectedOperations.join(',') : null,
      });
      onStart({ name, age, theme: selectedTheme, minTable: min, maxTable: max,
        operation: selectedOp,
        operations: selectedOperations || [selectedOp],
        addSubRange: selectedNumRange,
        difficulty: selectedDiff, hintThreshold: parseInt(hintThreshInput.value),
        practiceMode: false, runMode: true,
        triggerWord: triggerWdInput?.value?.trim() || '',
        zehner: selectedZehner, halbschriftlich: selectedHalbschriftlich });
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
      if (!name) {
        openSettings();
        setTimeout(() => { nameInput.focus(); nameInput.classList.add('field-error'); }, 50);
        return;
      }
      if (!age || age < 1 || age > 132) {
        openSettings();
        setTimeout(() => { ageInput.focus(); ageInput.classList.add('field-error'); }, 50);
        return;
      }
      const dp = Progress.getDailyParams();
      Progress.setPlayer(name, age);
      Progress.saveName(name);
      Progress.saveSettings({ ...Progress.loadSettings(), lastPlayer: name, lastAge: age });
      onStart({ name, age, theme: selectedTheme,
        minTable: dp.table, maxTable: dp.table, difficulty: dp.difficulty,
        operations: selectedOperations || [selectedOp],
        addSubRange: selectedNumRange,
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
      if (saved.theme)     document.querySelector(`.theme-card[data-theme="${saved.theme}"]`)?.click();
      if (saved.diff)      document.querySelector(`.diff-btn[data-diff="${saved.diff}"]`)?.click();
      if (saved.mode)      document.querySelector(`.mode-btn[data-mode="${saved.mode}"]`)?.click();
      if (saved.operation) _applyOp(saved.operation);
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
      if (saved.numRange) {
        selectedNumRange = parseInt(saved.numRange);
        document.querySelectorAll('[data-max]').forEach(b => {
          b.classList.toggle('active', parseInt(b.dataset.max) === selectedNumRange);
        });
      }
      if (saved.zehner !== undefined) {
        selectedZehner = saved.zehner === true || saved.zehner === 'true';
        document.querySelectorAll('[data-zehner]').forEach(b => {
          b.classList.toggle('active', (b.dataset.zehner === 'true') === selectedZehner);
        });
      }
      if (saved.halbschriftlich) {
        selectedHalbschriftlich = saved.halbschriftlich === true || saved.halbschriftlich === 'true';
        if (selectedHalbschriftlich) {
          selectedZehner = false;
          document.querySelectorAll('[data-zehner]').forEach(b => {
            b.classList.toggle('active', b.dataset.zehner === 'halbschriftlich');
          });
        }
      }
      if (saved.mixedPreset) {
        const ops = saved.mixedPreset.split(',');
        selectedOperations = ops;
        // Activate the matching button
        if (ops.join(',') === 'multiply,divide' && mixedMulDiv) {
          mixedMulDiv.classList.add('active');
          _applyOp('multiply');
          if (mixedNote) mixedNote.textContent = I18n.t('mixedMulDivNote');
        } else if (ops.join(',') === 'add,subtract' && mixedAddSub) {
          mixedAddSub.classList.add('active');
          _applyOp('add');
          if (mixedNote) mixedNote.textContent = I18n.t('mixedAddSubNote');
        } else if (mixedAll) {
          mixedAll.classList.add('active');
          _applyOp('multiply');
          if (mixedNote) mixedNote.textContent = I18n.t('mixedAllNote');
        }
      }
    }
    // Apply all dynamic strings in the current language (must run after settings restore)
    _refreshDynamicOnboarding(selectedMode);
    _refreshDailyBtn();
    if (!nameInput.value.trim()) openSettings();
  }

  // ---- HUD ----
  function updateHUD(state) {
    document.getElementById('hud-name').textContent = I18n.t('hiPlayer', { name: state.name });
    document.getElementById('score-val').textContent = state.score;
    document.getElementById('level-val').textContent = state.level;
    const op = state.operation || 'multiply';
    const opSuffix = op === 'multiply' ? '' : op.charAt(0).toUpperCase() + op.slice(1);
    const tableLabel = state.minTable === state.maxTable
      ? I18n.t(`tablesFocus${opSuffix}`, { table: state.minTable })
      : I18n.t(`tablesRange${opSuffix}`, { min: state.minTable, max: state.maxTable });
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
    const { facts, mastered, seen, total, operation = 'multiply', isLargeRange = false, maxTable = 12 } = masteryData;
    if (total === 0) return '';

    // Band view for large add/subtract ranges
    if (isLargeRange && (operation === 'add' || operation === 'subtract')) {
      const bandSize = maxTable > 100 ? 100 : 10;
      // Group facts into bands by first operand (a)
      const bandMap = {};
      for (const f of facts) {
        const bandStart = Math.floor(f.a / bandSize) * bandSize;
        if (!bandMap[bandStart]) bandMap[bandStart] = [];
        bandMap[bandStart].push(f);
      }
      const bandStarts = Object.keys(bandMap).map(Number).sort((x, y) => x - y);

      if (bandStarts.length === 0) {
        const titleKey = operation === 'add' ? 'masteryTitleAdd' : 'masteryTitleSubtract';
        return `<div class="mastery-heading">${I18n.t(titleKey)} <span class="mastery-pct">0%</span></div>
                <div class="mastery-bands-empty">${I18n.t('masteryBandsEmpty')}</div>`;
      }

      const bandRows = bandStarts.map(bs => {
        const bandFacts = bandMap[bs];
        const bandEnd   = bs + bandSize - 1;
        const seenInBand     = bandFacts.length;
        const masteredInBand = bandFacts.filter(f => f.masteredLevel >= 3).length;
        const pct = seenInBand > 0 ? Math.round(masteredInBand / seenInBand * 100) : 0;
        const barClass = pct >= 80 ? 'band-bar--high' : pct >= 40 ? 'band-bar--mid' : 'band-bar--low';
        const label = `${bs}–${bandEnd}`;
        return `<div class="mastery-band-row">
      <span class="mastery-band-label">${label}</span>
      <div class="mastery-band-track">
        <div class="mastery-band-bar ${barClass}" style="width:${pct}%"></div>
      </div>
      <span class="mastery-band-pct">${pct}%</span>
      <span class="mastery-band-count">(${seenInBand})</span>
    </div>`;
      }).join('');

      const totalSeen = facts.length;
      const totalMastered = facts.filter(f => f.masteredLevel >= 3).length;
      const overallPct = totalSeen > 0 ? Math.round(totalMastered / totalSeen * 100) : 0;
      const titleKey = operation === 'add' ? 'masteryTitleAdd' : 'masteryTitleSubtract';

      return `
    <div class="mastery-heading">${I18n.t(titleKey)} <span class="mastery-pct">${overallPct}%</span></div>
    <div class="mastery-bands">${bandRows}</div>
    <div class="mastery-band-legend">
      <span class="band-swatch band-bar--high"></span>${I18n.t('masteryBandHigh')}
      <span class="band-swatch band-bar--mid"></span>${I18n.t('masteryBandMid')}
      <span class="band-swatch band-bar--low"></span>${I18n.t('masteryBandLow')}
    </div>`;
    }

    // Row label and dot tooltip depend on operation
    function _rowLabel(a) {
      if (operation === 'divide')   return `÷${a}`;
      if (operation === 'add')      return `${a}+`;
      if (operation === 'subtract') return `${a}−`;
      return `${a}×`;
    }
    function _dotTooltip(f) {
      if (operation === 'divide')   return `${f.a * f.b}÷${f.a}=${f.b} (${f.masteredLevel}/5)`;
      if (operation === 'add')      return `${f.a}+${f.b}=${f.a + f.b} (${f.masteredLevel}/5)`;
      if (operation === 'subtract') return `${f.a}−${f.b}=${f.a - f.b} (${f.masteredLevel}/5)`;
      return `${f.a}×${f.b}=${f.a * f.b} (${f.masteredLevel}/5)`;
    }

    // Group by A value (= table number for × and ÷, first operand for + and −)
    const aValues = [...new Set(facts.map(f => f.a))].sort((x, y) => x - y);
    const rows = aValues.map(a => {
      const row = facts.filter(f => f.a === a).sort((x, y) => x.b - y.b);
      const dots = row.map(f =>
        `<span class="mastery-dot ${_masteryDotClass(f)}" title="${_dotTooltip(f)}"></span>`
      ).join('');
      return `<div class="mastery-row"><span class="mastery-label">${_rowLabel(a)}</span>${dots}</div>`;
    }).join('');

    const seenCount = seen ?? 0;
    const pct = Math.round(seenCount / total * 100);
    const titleKey = operation === 'divide' ? 'masteryTitleDivide'
      : operation === 'add' ? 'masteryTitleAdd'
      : operation === 'subtract' ? 'masteryTitleSubtract'
      : 'masteryTitle';
    const masteredSubtitle = mastered > 0
      ? `<div class="mastery-subtitle">${I18n.t('masteryMasteredCount', { n: mastered })}</div>` : '';
    return `
      <div class="mastery-heading">${I18n.t(titleKey)} <span class="mastery-pct">${pct}%</span></div>
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
          const cls = a.milestone ? 'ach-badge ach-badge--milestone' : 'ach-badge';
          return `<div class="${cls}"><strong>${txt.label}</strong> — ${txt.desc}</div>`;
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
    const lt = data.lifetime || {};
    const playerName = data.player?.name || 'Player';

    // ── Header ──────────────────────────────────────────────────────
    document.getElementById('dashboard-player').innerHTML =
      `<div class="dash-player">${I18n.t('dashProgress', { name: playerName })}</div>`;

    const totalSessions = sessions.length;
    const bestScore = lt.bestScore || 0;
    const avgAcc = sessions.length > 0
      ? Math.round(sessions.reduce((a, s) => a + s.accuracy, 0) / sessions.length * 100) : 0;

    // Count total questions answered across all operations
    const allKeys = Object.keys(stats);
    const totalAttempts = allKeys.reduce((sum, k) => sum + (stats[k].attempts || 0), 0);

    document.getElementById('dashboard-summary').innerHTML = `
      <div class="dash-stats">
        <div class="dash-stat"><span>${totalSessions}</span>${I18n.t('dashSessions')}</div>
        <div class="dash-stat"><span>${bestScore}</span>${I18n.t('dashBestScore')}</div>
        <div class="dash-stat"><span>${avgAcc}%</span>${I18n.t('dashAvgAcc')}</div>
        <div class="dash-stat"><span>${totalAttempts.toLocaleString()}</span>Questions</div>
      </div>`;

    // ── Operation tab switching ──────────────────────────────────────
    function renderOpPanel(op) {
      document.querySelectorAll('.dash-op-tab').forEach(t =>
        t.classList.toggle('active', t.dataset.op === op));

      if (op === 'multiply' || op === 'divide') {
        renderMatrixPanel(op);
      } else {
        renderAddSubPanel(op);
      }
    }

    document.querySelectorAll('.dash-op-tab').forEach(tab => {
      tab.addEventListener('click', () => renderOpPanel(tab.dataset.op));
    });

    // ── Helpers ─────────────────────────────────────────────────────
    function masteryClass(level) {
      if (level === 0) return 'unseen';
      if (level <= 2)  return 'started';
      if (level <= 3)  return 'learning';
      if (level === 4) return 'good';
      return 'mastered';
    }

    // ── Matrix panel (× and ÷) ──────────────────────────────────────
    function renderMatrixPanel(op) {
      const isDivide = op === 'divide';
      let html = '<div class="dash-op-panel">';

      // Per-op summary stats
      let opAttempts = 0, opCorrect = 0, opMastered = 0, opSeen = 0;
      const pattern = isDivide ? /^\d+d\d+$/ : /^\d+x\d+$/;
      for (const k of Object.keys(stats)) {
        if (!pattern.test(k)) continue;
        const s = stats[k];
        opAttempts += s.attempts || 0;
        opCorrect  += s.correct  || 0;
        if ((s.masteredLevel || 0) >= 5) opMastered++;
        if ((s.masteredLevel || 0) >= 1) opSeen++;
      }
      const opAcc = opAttempts > 0 ? Math.round(opCorrect / opAttempts * 100) : 0;
      html += `<div class="dash-op-summary">
        <div class="dash-op-stat"><span>${opAttempts.toLocaleString()}</span>Attempted</div>
        <div class="dash-op-stat"><span>${opAcc}%</span>Accuracy</div>
        <div class="dash-op-stat"><span>${opSeen}</span>Facts seen</div>
        <div class="dash-op-stat"><span>${opMastered}</span>Mastered</div>
      </div>`;

      // 10×10 grid
      // For ×: row=a (1-10), col=b (1-10), key=`${a}x${b}`, label=a×b=answer
      // For ÷: row=divisor a (1-10), col=quotient b (1-10), key=`${a*b}d${a}`, label=a×b÷a=b
      html += '<div class="dash-matrix">';
      // Header row: corner + col labels
      html += '<div class="dash-matrix-header-cell"></div>';
      for (let b = 1; b <= 10; b++) {
        html += `<div class="dash-matrix-header-cell">${b}</div>`;
      }
      for (let a = 1; a <= 10; a++) {
        // Row label
        html += `<div class="dash-matrix-label">${isDivide ? `÷${a}` : `${a}×`}</div>`;
        for (let b = 1; b <= 10; b++) {
          const key = isDivide ? `${a * b}d${a}` : `${a}x${b}`;
          const s = stats[key];
          const level = s?.masteredLevel ?? 0;
          const cls = masteryClass(level);
          const answer = isDivide ? b : a * b;
          const acc = s?.attempts > 0 ? Math.round(s.correct / s.attempts * 100) : null;
          const title = acc !== null ? `${isDivide ? `${a*b}÷${a}` : `${a}×${b}`}=${answer} · ${acc}% (${s.attempts} tries)` : (isDivide ? `${a*b}÷${a}` : `${a}×${b}`);
          html += `<div class="dash-matrix-cell ${cls}" title="${title}">${answer}</div>`;
        }
      }
      html += '</div>'; // .dash-matrix

      // Legend
      html += `<div class="dash-matrix-legend">
        <span><span class="dash-legend-dot" style="background:rgba(46,213,115,0.65)"></span>Mastered</span>
        <span><span class="dash-legend-dot" style="background:rgba(100,220,100,0.45)"></span>Good</span>
        <span><span class="dash-legend-dot" style="background:rgba(255,200,0,0.45)"></span>Learning</span>
        <span><span class="dash-legend-dot" style="background:rgba(255,140,0,0.4)"></span>Just started</span>
        <span><span class="dash-legend-dot" style="background:rgba(255,255,255,0.05)"></span>Not seen</span>
      </div>`;

      // Weakest facts (seen but masteredLevel < 3, sorted by level then accuracy)
      const weak = [];
      for (let a = 1; a <= 10; a++) {
        for (let b = 1; b <= 10; b++) {
          const key = isDivide ? `${a * b}d${a}` : `${a}x${b}`;
          const s = stats[key];
          if (!s || s.attempts === 0) continue;
          const acc = s.correct / s.attempts;
          if ((s.masteredLevel || 0) < 3) {
            const label = isDivide ? `${a*b} ÷ ${a} = ${b}` : `${a} × ${b} = ${a*b}`;
            weak.push({ label, level: s.masteredLevel || 0, acc, attempts: s.attempts });
          }
        }
      }
      weak.sort((x, y) => x.level - y.level || x.acc - y.acc);
      const topWeak = weak.slice(0, 6);
      if (topWeak.length > 0) {
        html += `<div class="dash-weak-section"><div class="dash-weak-title">${I18n.t('dashNeedsPractice')}</div>`;
        html += topWeak.map(f =>
          `<span class="dash-weak-badge">${f.label} · ${Math.round(f.acc*100)}%</span>`
        ).join('');
        html += '</div>';
      } else if (opSeen > 0) {
        html += `<div class="dash-weak-title" style="color:#2ed573">${I18n.t('dashAllGood')}</div>`;
      } else {
        html += `<div class="dash-weak-title">${I18n.t('dashNoData')}</div>`;
      }

      html += '</div>'; // .dash-op-panel
      document.getElementById('dash-op-content').innerHTML = html;
    }

    // ── Add / Subtract panel ─────────────────────────────────────────
    function renderAddSubPanel(op) {
      const isAdd = op === 'add';
      const pattern = isAdd ? /^(\d+)a(\d+)$/ : /^(\d+)s(\d+)$/;

      let opAttempts = 0, opCorrect = 0, opSeen = 0;
      const factList = [];
      for (const k of Object.keys(stats)) {
        const m = k.match(pattern);
        if (!m) continue;
        const s = stats[k];
        opAttempts += s.attempts || 0;
        opCorrect  += s.correct  || 0;
        if ((s.masteredLevel || 0) >= 1) opSeen++;
        if (s.attempts > 0) {
          factList.push({ a: +m[1], b: +m[2], attempts: s.attempts, correct: s.correct, masteredLevel: s.masteredLevel || 0 });
        }
      }
      const opAcc = opAttempts > 0 ? Math.round(opCorrect / opAttempts * 100) : 0;

      // Build bucket data (group "a" values by 10)
      const maxA = factList.length > 0 ? Math.max(...factList.map(f => f.a)) : 0;
      const buckets = [];
      for (let i = 0; i < Math.ceil(maxA / 10); i++) {
        const lo = i * 10 + 1, hi = (i + 1) * 10;
        let ba = 0, bc = 0;
        factList.filter(f => f.a >= lo && f.a <= hi).forEach(f => { ba += f.attempts; bc += f.correct; });
        buckets.push({ label: `${lo}–${hi}`, acc: ba > 0 ? bc / ba : null });
      }

      // Weakest facts
      const weak = factList
        .filter(f => f.masteredLevel < 3)
        .sort((x, y) => x.masteredLevel - y.masteredLevel || (x.correct/x.attempts) - (y.correct/y.attempts))
        .slice(0, 6);

      const canvasId = `dash-chart-${op}`;
      let html = `<div class="dash-op-panel">
        <div class="dash-op-summary">
          <div class="dash-op-stat"><span>${opAttempts.toLocaleString()}</span>Attempted</div>
          <div class="dash-op-stat"><span>${opAcc}%</span>Accuracy</div>
          <div class="dash-op-stat"><span>${opSeen}</span>Facts seen</div>
        </div>`;

      if (buckets.length > 0) {
        html += `<canvas id="${canvasId}" class="dash-bar-canvas"></canvas>`;
      }

      if (weak.length > 0) {
        html += `<div class="dash-weak-section"><div class="dash-weak-title">${I18n.t('dashNeedsPractice')}</div>`;
        html += weak.map(f => {
          const label = isAdd ? `${f.a} + ${f.b}` : `${f.a} − ${f.b}`;
          return `<span class="dash-weak-badge">${label} · ${Math.round(f.correct/f.attempts*100)}%</span>`;
        }).join('');
        html += '</div>';
      } else if (opSeen > 0) {
        html += `<div class="dash-weak-title" style="color:#2ed573">${I18n.t('dashAllGood')}</div>`;
      } else {
        html += `<div class="dash-weak-title">${I18n.t('dashNoData')}</div>`;
      }

      html += '</div>';
      document.getElementById('dash-op-content').innerHTML = html;

      // Draw bar chart after DOM insertion
      if (buckets.length > 0) {
        const canvasEl = document.getElementById(canvasId);
        const cw = Math.min(560, window.innerWidth - 80);
        const ch = 130;
        canvasEl.width = cw;
        canvasEl.height = ch;
        const ctx = canvasEl.getContext('2d');
        ctx.clearRect(0, 0, cw, ch);
        const n = buckets.length;
        const barW = Math.max(20, Math.floor((cw - 40) / n) - 4);
        const maxH = ch - 36;

        buckets.forEach(({ label, acc }, i) => {
          const bx = 20 + i * (barW + 4);
          ctx.fillStyle = 'rgba(255,255,255,0.06)';
          ctx.fillRect(bx, ch - 24 - maxH, barW, maxH);
          if (acc !== null) {
            const fillH = Math.max(4, acc * maxH);
            ctx.fillStyle = `hsl(${Math.round(acc * 120)},80%,55%)`;
            ctx.fillRect(bx, ch - 24 - fillH, barW, fillH);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 9px Segoe UI, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`${Math.round(acc * 100)}%`, bx + barW / 2, ch - 24 - fillH - 3);
          }
          ctx.fillStyle = 'rgba(255,255,255,0.45)';
          ctx.font = '9px Segoe UI, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(label, bx + barW / 2, ch - 7);
        });

        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.font = '10px Segoe UI, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(isAdd ? 'Accuracy by first number range' : 'Accuracy by minuend range', 20, 12);
      }
    }

    // ── Session trend sparkline ──────────────────────────────────────
    const canvas = document.getElementById('dashboard-chart');
    const recentSessions = sessions.slice(-12);
    const cw = Math.min(560, window.innerWidth - 80);
    const ch = 100;
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, cw, ch);

    if (recentSessions.length > 1) {
      document.getElementById('dashboard-table-detail').innerHTML =
        '<div class="dash-trend-label">Accuracy — last sessions</div>';

      const pts = recentSessions.map((s, i) => ({
        x: 20 + i * (cw - 40) / Math.max(recentSessions.length - 1, 1),
        y: (ch - 20) - s.accuracy * (ch - 30),
        acc: s.accuracy,
      }));

      // Fill area
      ctx.beginPath();
      ctx.moveTo(pts[0].x, ch - 10);
      pts.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.lineTo(pts[pts.length - 1].x, ch - 10);
      ctx.closePath();
      ctx.fillStyle = 'rgba(247,201,72,0.12)';
      ctx.fill();

      // Line
      ctx.beginPath();
      pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
      ctx.strokeStyle = 'rgba(247,201,72,0.7)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Dots + labels
      pts.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#f7c948';
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '9px Segoe UI, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.round(p.acc * 100)}%`, p.x, p.y - 6);
      });
    } else {
      document.getElementById('dashboard-table-detail').innerHTML = '';
    }

    // ── Wire back button + render default tab ────────────────────────
    document.getElementById('btn-back-dashboard').onclick = onBack;
    renderOpPanel('multiply');
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
  function showTableClearedBanner(table, operation = 'multiply') {
    const keyMap = {
      divide:   'tableClearedBannerDivide',
      add:      'tableClearedBannerAdd',
      subtract: 'tableClearedBannerSubtract',
    };
    const key = keyMap[operation] || 'tableClearedBanner';
    showLevelUp(I18n.t(key, { table }), null);
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
  function showBossVictory(stars, score, name, age, onContinue, onFinish) {
    const overlay = document.getElementById('boss-victory-overlay');
    const starStr = stars !== null ? '★'.repeat(stars) + '☆'.repeat(3 - stars) : '';
    document.getElementById('boss-victory-stars').textContent = starStr;
    const article = (age === 8 || age === 11 || age === 18 || (age >= 80 && age <= 89)) ? 'an' : 'a';
    document.getElementById('boss-victory-sub').textContent =
      `Congratulations, ${name}! That was incredible, especially for ${article} ${age} year old! 🌟`;
    document.getElementById('btn-keep-going').onclick = () => { overlay.classList.remove('visible'); onContinue(); };
    document.getElementById('btn-finish-game').onclick = () => { overlay.classList.remove('visible'); onFinish(); };
    overlay.classList.add('visible');
  }

  return { showScreen, initOnboarding, updateHUD, showCombo, showTryAgain,
    shakeInput, showLevelUp, showMissFlash, showGameOver, showLeaderboard, showAchievements, showDashboard, showUpgradePicker, showTableClearedBanner, showSaved, showFirstTime, updateHelpBtn, showBossVictory };
})();
