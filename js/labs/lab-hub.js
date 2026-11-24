// Klasse 4 Labor Hub — Curriculum Overview & Topic Launcher
// Organizes all 11 untimed, diagnostic Grade 4 PIKAS labs into 3 chapters.

const LabHub = (() => {
  'use strict';

  const CATALOG = [
    // Chapter 1: Halbjahr 1 — Zahlen bis 1 Million & Flächeninhalt (Probearbeit unit)
    { id: 'numberline',     chapter: 1, icon: '📐', prefix: 'nl', isLegacyNumberLine: true },
    { id: 'placevalue',     chapter: 1, icon: '🧱', prefix: 'pv' },
    { id: 'neighbors',      chapter: 1, icon: '🔢', prefix: 'nb' },
    { id: 'rounding',       chapter: 1, icon: '🎯', prefix: 'rd' },
    { id: 'area',           chapter: 1, icon: '🟩', prefix: 'ar' },
    // Chapter 2: Schriftliche Rechenverfahren
    { id: 'written-addsub', chapter: 2, icon: '➕', prefix: 'wa' },
    { id: 'written-mul',    chapter: 2, icon: '✖️', prefix: 'wm' },
    { id: 'written-div',    chapter: 2, icon: '➗', prefix: 'wd' },
    // Chapter 3: Größen, Geometrie II & Diagramme
    { id: 'units',          chapter: 3, icon: '📏', prefix: 'gr' },
    { id: 'geometry',       chapter: 3, icon: '🪞', prefix: 'gm' },
    { id: 'charts',         chapter: 3, icon: '📊', prefix: 'dg' },
  ];

  const CHAPTERS = [
    { id: 1, titleKey: 'hubCh1Title', subKey: 'hubCh1Sub' },
    { id: 2, titleKey: 'hubCh2Title', subKey: 'hubCh2Sub' },
    { id: 3, titleKey: 'hubCh3Title', subKey: 'hubCh3Sub' },
  ];

  let bound = false;
  let onBackCb = null;
  let onLaunchCb = null;
  let inlineReturnCb = null;

  function t(key, vars, fallback) {
    if (typeof LabHost !== 'undefined' && LabHost.t) return LabHost.t(key, vars, fallback);
    if (typeof I18n !== 'undefined' && I18n.t) return I18n.t(key, vars);
    return fallback || key;
  }

  function esc(str) {
    if (typeof LabHost !== 'undefined' && LabHost.esc) return LabHost.esc(str);
    return String(str == null ? '' : str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function getStats(id) {
    if (typeof Progress !== 'undefined' && Progress.getLabStats) {
      return Progress.getLabStats(id);
    }
    return { rounds: 0, bestFirstTry: 0, firstTryTotal: 0, errorsByCategory: {}, lastPlayed: null };
  }

  function bindOnce() {
    if (bound || typeof document === 'undefined') return;
    bound = true;
    const backBtn = document.getElementById('hub-back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        if (typeof onBackCb === 'function') onBackCb();
      });
    }
  }

  function getLastChapter() {
    if (typeof Progress !== 'undefined' && Progress.loadSettings) {
      const s = Progress.loadSettings();
      if (s && typeof s.lastLabChapter === 'number') return s.lastLabChapter;
    }
    return null;
  }

  function saveLastChapter(chId) {
    if (typeof Progress !== 'undefined' && Progress.loadSettings && Progress.saveSettings) {
      const existing = Progress.loadSettings() || {};
      Progress.saveSettings({ ...existing, lastLabChapter: chId });
    }
  }

  function renderInto(container, summaryEl, onSelectLab) {
    if (!container) return;

    let practisedLabs = 0;
    let totalRounds = 0;
    CATALOG.forEach(item => {
      const s = getStats(item.id);
      if (s.rounds > 0) practisedLabs += 1;
      totalRounds += s.rounds || 0;
    });

    if (summaryEl) {
      summaryEl.innerHTML = t(
        'hubProgressSummary',
        { practised: practisedLabs, total: CATALOG.length, rounds: totalRounds },
        `<strong>${practisedLabs} / ${CATALOG.length}</strong> labs practised · <strong>${totalRounds}</strong> rounds completed`
      );
    }

    const lastCh = getLastChapter();
    let html = '';
    CHAPTERS.forEach(ch => {
      const items = CATALOG.filter(c => c.chapter === ch.id);
      const isRecent = lastCh === ch.id;
      const recentPill = isRecent
        ? `<span class="hub-chapter-recent">${esc(t('hubLastPractised', null, '⭐ Last practised'))}</span>`
        : '';
      html += `
        <section class="hub-chapter ${isRecent ? 'hub-chapter--recent' : ''}" data-chapter="${ch.id}">
          <div class="hub-chapter-head">
            <div class="hub-chapter-title-row">
              <h3 class="hub-chapter-title">${esc(t(ch.titleKey, null, `Chapter ${ch.id}`))}</h3>
              ${recentPill}
            </div>
            <p class="hub-chapter-sub">${esc(t(ch.subKey, null, ''))}</p>
          </div>
          <div class="hub-card-grid">
            ${items.map(item => renderCard(item)).join('')}
          </div>
        </section>
      `;
    });
    container.innerHTML = html;

    container.querySelectorAll('.hub-lab-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.labId;
        if (typeof onSelectLab === 'function') onSelectLab(id);
        else launchLab(id);
      });
    });
  }

  function render() {
    if (typeof document === 'undefined') return;
    renderInto(
      document.getElementById('hub-chapters'),
      document.getElementById('hub-progress-summary')
    );
  }

  function renderInline(onReturnToMenu) {
    if (typeof onReturnToMenu === 'function') inlineReturnCb = onReturnToMenu;
    if (typeof document === 'undefined') return;
    const container = document.getElementById('home-pikas-chapters');
    const summaryEl = document.getElementById('home-pikas-summary');
    if (!container) return;
    renderInto(container, summaryEl, id => {
      launchLab(id, () => {
        renderInline();
        if (typeof inlineReturnCb === 'function') inlineReturnCb();
        else if (typeof UI !== 'undefined' && UI.showScreen) UI.showScreen('onboarding');
      });
    });
  }

  function renderCard(item) {
    const s = getStats(item.id);
    const titleKey = item.isLegacyNumberLine ? 'nlTitle' : `${item.prefix}Title`;
    const subKey = item.isLegacyNumberLine ? 'hubNlSub' : `${item.prefix}HubSub`;
    const title = t(titleKey, null, item.id);
    const sub = t(subKey, null, '');
    const isAvailable = item.isLegacyNumberLine || (typeof LabHost !== 'undefined' && LabHost.getLab(item.id));
    const badge = s.rounds > 0
      ? `<span class="hub-badge hub-badge-done">⭐ ${s.bestFirstTry}/8 · ${esc(t('hubRoundsCount', { n: s.rounds }, `${s.rounds}×`))}</span>`
      : `<span class="hub-badge hub-badge-new">${esc(t('hubBadgeNew', null, 'New'))}</span>`;

    return `
      <button type="button" class="hub-lab-card ${s.rounds > 0 ? 'hub-lab-card-done' : ''}" data-lab-id="${esc(item.id)}" ${isAvailable ? '' : 'disabled'}>
        <div class="hub-card-top">
          <span class="hub-card-icon" aria-hidden="true">${item.icon}</span>
          ${badge}
        </div>
        <div class="hub-card-title">${esc(title)}</div>
        <div class="hub-card-sub">${esc(sub)}</div>
      </button>
    `;
  }

  function launchLab(id, customReturn) {
    if (typeof onLaunchCb === 'function' && !customReturn) {
      onLaunchCb(id);
      return;
    }
    const item = CATALOG.find(c => c.id === id);
    if (!item) return;
    saveLastChapter(item.chapter);
    const goBack = typeof customReturn === 'function'
      ? customReturn
      : () => {
          render();
          if (typeof UI !== 'undefined' && UI.showScreen) UI.showScreen('labHub');
        };
    if (item.isLegacyNumberLine) {
      if (typeof NumberLine !== 'undefined' && NumberLine.open) {
        NumberLine.open(goBack);
      }
      if (typeof UI !== 'undefined' && UI.showScreen) UI.showScreen('numberline');
    } else if (typeof LabHost !== 'undefined' && LabHost.open) {
      const ok = LabHost.open(id, goBack);
      if (ok && typeof UI !== 'undefined' && UI.showScreen) UI.showScreen('labHost');
    }
  }

  function open(onBack, onLaunch) {
    bindOnce();
    onBackCb = onBack || null;
    onLaunchCb = onLaunch || null;
    render();
  }

  function refreshLanguage() {
    render();
    renderInline();
  }

  return {
    CATALOG,
    CHAPTERS,
    open,
    render,
    renderInto,
    renderInline,
    launchLab,
    refreshLanguage,
  };
})();
