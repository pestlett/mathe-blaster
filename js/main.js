// main.js - game state machine & entry point

function isMobile() {
  return navigator.maxTouchPoints > 0;
}

function isPhone() {
  return window.innerWidth < 640;
}

function focusAnswerInput() {
  if (!isMobile()) document.getElementById('answer-input').focus();
}

const DIFFICULTY = {
  // baseSpeed reduced ~25% to give voice-input users time to react.
  // Speed still ramps per level so it gets challenging quickly.
  easy:   { maxObjects: 3, baseSpeed: 40,  maxSpeed: 130, lives: 6 },
  medium: { maxObjects: 4, baseSpeed: 58,  maxSpeed: 190, lives: 4 },
  hard:   { maxObjects: 5, baseSpeed: 80,  maxSpeed: 260, lives: 3 }
};
const CORRECT_PER_LEVEL = 10;
const SPEED_INCREASE_PER_LEVEL = 0.18;

// ---- Game state ----
let state = {
  phase: 'ONBOARDING', // ONBOARDING | PLAYING | GAME_OVER
  voiceActive: false,  // true while SpeechRecognition is actively listening
  tutorialMode: false,
  name: 'Player',
  age: null,
  theme: 'space',
  minTable: 1,
  maxTable: 10,
  operation: 'multiply', // 'multiply' | 'divide' | 'add' | 'subtract'
  operations:       ['multiply'],
  addSubRange:      100,
  zehner: false,
  halbschriftlich: false,
  difficulty: 'medium',
  practiceMode: false, // no lives lost, no game over
  score: 0,
  level: 1,
  lives: 3,
  maxLives: 3,
  correctThisLevel: 0,
  attemptsThisLevel: 0,
  levelStars: [],       // stars earned per level [0]=level1 etc.
  totalCorrect: 0,
  totalAttempts: 0,
  streak: 0,
  maxStreak: 0,
  bossesDefeated: 0,
  objects: [],
  missedList: [],
  wrongQueue: [],   // questions answered incorrectly this session
  lifeUpTimer: 0,   // accumulates seconds toward next life-up spawn
  freezeTimer: 0,   // accumulates seconds toward next freeze spawn
  freezeActive: 0,  // seconds remaining on active freeze
  lightningTimer: 0,
  scoreStarTimer: 0,
  shieldTimer: 0,
  magnetTimer: 0,
  revealTimer: 0,
  magnetActive: 0,
  revealBonusActive: 0,
  scoreStarActive: false,
  shieldBonusActive: false,
  bonusFlash: null,
  gameTimeSecs: 0,  // total seconds played this session (drives spawn stagger)
  answerStartTime: 0,
  hintThreshold: 3, // wrong attempts before dot-grid hint appears
};

const TUTORIAL_SEED = 20260315;
let tutorialState = null;

// Expose mutable game state on window for E2E test instrumentation.
// state/tutorialState are let bindings (not on window by default).
// __gameState persists because state is mutated in-place, never reassigned.
// __tutorialState uses a getter so re-assignments are visible.
window.__gameState = state;
Object.defineProperty(window, '__tutorialState', {
  get() { return tutorialState; },
  configurable: true,
});

function tutorialActive() {
  return !!(tutorialState && tutorialState.active);
}

function tutorialLocksInput() {
  return !!(tutorialState && tutorialState.active && tutorialState.inputLocked);
}

function tutorialQuestionSpeechEnabled() {
  return !tutorialActive() || !!tutorialState.allowQuestionSpeech;
}

// ---- Adaptive music ----
let _prevFreezeActive = 0;

function syncMusicIntensity() {
  if (state.practiceMode) return;
  const hasBoss = state.objects.some(o => o.isBoss && !o.dead && !o.dying && !o.destroyed);
  if (hasBoss) { Audio.setMusicState('boss'); return; }
  if (state.lives <= 1)                Audio.setMusicState('urgent');
  else if (state.lives < state.maxLives) Audio.setMusicState('tense');
  else                                   Audio.setMusicState('calm');
}

// ---- Haptic feedback ----
function vibrate(pattern) {
  if (navigator.vibrate) navigator.vibrate(pattern);
}

// ---- Confetti ----
const CONFETTI_COLORS = ['#f7c948','#ff4757','#2ed573','#1e90ff','#ff6b81','#eccc68','#a29bfe','#fd79a8'];

function spawnConfetti(w) {
  const particles = [];
  for (let i = 0; i < 90; i++) {
    const angle = (Math.PI * 0.4) + Math.random() * Math.PI * 0.2; // mostly downward
    const speed = 180 + Math.random() * 320;
    particles.push({
      x:    Math.random() * w,
      y:    -10,
      vx:   (Math.random() - 0.5) * 160,
      vy:   speed * Math.sin(angle),
      rot:  Math.random() * Math.PI * 2,
      rotV: (Math.random() - 0.5) * 10,
      w:    6 + Math.random() * 7,
      h:    3 + Math.random() * 4,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      life: 1.0,
    });
  }
  return particles;
}

function updateConfetti(particles, dt) {
  for (const p of particles) {
    p.x   += p.vx  * dt;
    p.y   += p.vy  * dt;
    p.vy  += 380   * dt; // gravity
    p.rot += p.rotV * dt;
    p.life -= 0.55 * dt; // ~1.8s lifespan
  }
}

function drawConfetti(ctx, particles) {
  for (const p of particles) {
    if (p.life <= 0) continue;
    ctx.save();
    ctx.globalAlpha = Math.min(1, p.life * 2); // fade in briefly, then hold, then fade
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    ctx.restore();
  }
}

// ---- Streak vignette + shake ----
function drawStreakOverlay(ctx, w, h, streak, intensity) {
  // Vignette colour scales from amber (×1.5) to hot-red (×2)
  const hot   = streak >= 5;
  const color = hot ? '255,60,0' : '255,160,0';
  const alpha = (hot ? 0.38 : 0.25) * intensity;
  const cx    = w / 2, cy = h / 2;
  const grad  = ctx.createRadialGradient(cx, cy, Math.min(w, h) * 0.25, cx, cy, Math.max(w, h) * 0.75);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, `rgba(${color},${alpha.toFixed(3)})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

// ---- Hot zone ----
const HOT_ZONE_TOP    = 0.38;
const HOT_ZONE_BOTTOM = 0.62;
// Widened hot zone (Event Horizon / Whirlpool / Thermal Lift upgrade)
const HOT_ZONE_TOP_WIDE    = 0.275;
const HOT_ZONE_BOTTOM_WIDE = 0.725;

// ---- Ante targets for run mode ----
// anteTarget(ante) → minimum score to advance from that ante's 3 levels
function anteTarget(ante) {
  const base = [0, 150, 350, 650, 1050];
  if (ante <= 4) return base[ante] || 0;
  return 1050 + (ante - 4) * 450;
}

function drawHotZone(ctx, w, h, t, hzTop = HOT_ZONE_TOP, hzBottom = HOT_ZONE_BOTTOM) {
  const top    = h * hzTop;
  const bottom = h * hzBottom;
  const pulse  = 0.09 + 0.04 * Math.sin(t * 2.5);
  ctx.fillStyle = `rgba(255,200,0,${pulse.toFixed(3)})`;
  ctx.fillRect(0, top, w, bottom - top);
  // Feathered top edge
  const g1 = ctx.createLinearGradient(0, top, 0, top + 18);
  g1.addColorStop(0, 'rgba(255,200,0,0.22)');
  g1.addColorStop(1, 'rgba(255,200,0,0)');
  ctx.fillStyle = g1;
  ctx.fillRect(0, top - 18, w, 18);
  // Feathered bottom edge
  const g2 = ctx.createLinearGradient(0, bottom, 0, bottom + 18);
  g2.addColorStop(0, 'rgba(255,200,0,0)');
  g2.addColorStop(1, 'rgba(255,200,0,0.22)');
  ctx.fillStyle = g2;
  ctx.fillRect(0, bottom, w, 18);
}

function drawProgressBar(ctx, target, h) {
  const crashLine = h - 148;
  const startY    = -60;
  const progress  = Math.max(0, Math.min(1, (target.y - startY) / (crashLine - startY)));
  const bx = target.x + target.wobbleX - 40;
  const by = target.y - 32;
  const bw = 80;
  const bh = 5;
  // Background track
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(bx, by, bw, bh, 3) : ctx.fillRect(bx, by, bw, bh);
  ctx.fill();
  // Filled portion: green → yellow → red based on progress
  if (progress > 0) {
    const hue = Math.round((1 - progress) * 110); // 110=green, 0=red
    ctx.fillStyle = `hsl(${hue},90%,55%)`;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(bx, by, bw * progress, bh, 3) : ctx.fillRect(bx, by, bw * progress, bh);
    ctx.fill();
  }
}

// ---- Voice suggestion pill (module-level so submitAnswer can access it) ----
let _voiceSuggestionEl  = null;
let _autoSubmitTimer    = null;
let _typingMode         = false;  // true when user is typing; suppresses voice

function _enterTypingMode() {
  if (_typingMode) return;
  _typingMode = true;
  Voice.stop();
  const btn = document.getElementById('btn-mic');
  if (btn) { btn.classList.add('typing'); btn.title = 'Keyboard mode — click to switch to voice'; }
}

function _exitTypingMode() {
  if (!_typingMode) return;
  _typingMode = false;
  const btn = document.getElementById('btn-mic');
  if (btn) { btn.classList.remove('typing'); }
  Voice.start();
}

function cancelAutoSubmit() {
  if (_autoSubmitTimer) { clearTimeout(_autoSubmitTimer); _autoSubmitTimer = null; }
  if (_voiceSuggestionEl) _voiceSuggestionEl.classList.remove('countdown');
}

function startAutoSubmit(target) {
  cancelAutoSubmit();
  const crashLine = window.innerHeight - 148;
  const timeLeft  = Math.max(0.3, (crashLine - target.y) / Math.max(1, target.speed));
  // On phone+voice the SR result is already confirmed — submit almost
  // immediately (0.3s flash) so the player doesn't have to wait.
  // On desktop/keyboard the countdown is longer to give time to cancel.
  const phoneVoice = window.innerWidth < 640 && state.voiceActive;
  const duration  = phoneVoice
    ? Math.min(0.5, Math.max(0.3, timeLeft * 0.08))
    : Math.min(1.8, Math.max(0.5, timeLeft * 0.35));
  _voiceSuggestionEl.style.setProperty('--countdown-duration', `${duration.toFixed(2)}s`);
  _voiceSuggestionEl.classList.add('countdown');
  _autoSubmitTimer = setTimeout(() => {
    _autoSubmitTimer = null;
    _voiceSuggestionEl.classList.remove('countdown');
    if (state.phase === 'PLAYING') submitAnswer();
  }, duration * 1000);
}

function showSuggestion(n, isInterim) {
  if (!_voiceSuggestionEl) return;
  _voiceSuggestionEl.innerHTML =
    `<span class="voice-suggestion-num">${n}</span>` +
    `<span class="voice-suggestion-label">${isInterim ? '…' : '↵'}</span>`;
  _voiceSuggestionEl.classList.remove('hidden', 'interim', 'confirmed', 'countdown');
  _voiceSuggestionEl.classList.add(isInterim ? 'interim' : 'confirmed');
}

function hideSuggestion() {
  cancelAutoSubmit();
  if (!_voiceSuggestionEl) return;
  _voiceSuggestionEl.classList.add('hidden');
}

// ---- Read question aloud (speechSynthesis) ----
let _lastSpokenTarget = null;
let _speakTimer       = null;
let _lastHelpBtnKey   = null;
let _ttsStartTime     = 0; // tracks when TTS actually started playing (utt.onstart)
let _ttsSafetyTimer   = null;

function speakQuestion(text) {
  if (!window.speechSynthesis) return;
  clearTimeout(_speakTimer);
  _speakTimer = setTimeout(() => {
    // Unfreeze any previous utterance that may not have fired onend
    state.ttsFreezeActive = false;
    window.speechSynthesis.cancel();
    clearTimeout(_ttsSafetyTimer);
    // Mute SR results while TTS speaks — SR stays running so there's no
    // restart dead zone. The user can speak the instant TTS finishes.
    Voice.muteResults(true);
    const lang       = (typeof I18n !== 'undefined') ? I18n.getLang() : 'en';
    const timesWord  = lang === 'de' ? 'mal' : lang === 'es' ? 'por' : 'times';
    const speakable  = text.replace(/×/, timesWord).replace(/\s+/g, ' ').trim();
    const operands   = (text.match(/\d+/g) || []).map(n => parseInt(n, 10)).filter(n => !isNaN(n)).slice(0, 2);
    const utt        = new SpeechSynthesisUtterance(speakable);
    utt.lang         = { en: 'en-US', de: 'de-DE', es: 'es-ES' }[lang] || 'en-US';
    utt.rate         = 0.92;
    utt.pitch        = 1.1;
    utt.volume  = 0.72; // slightly reduced to lessen acoustic mic pickup
    utt.onstart = () => { state.ttsFreezeActive = true; _ttsStartTime = Date.now(); };
    let _resumed = false;
    const resume = () => {
      if (_resumed) return;
      _resumed = true;
      clearTimeout(_ttsSafetyTimer);
      state.ttsFreezeActive = false;
      // Adaptive unmute delay: utt.onend fires before the acoustic echo
      // clears the mic (hardware round-trip is 50–400ms). Wait at least
      // 280ms, or 15% of utterance duration — whichever is larger.
      const spokenMs = Date.now() - _ttsStartTime;
      const tailMs   = Math.max(280, Math.round(spokenMs * 0.15));
      // Keep a very short operand-number guard (prevents raw "6"/"8" echo),
      // plus a longer phrase-pattern guard for "6 times 8"/"68" echoes.
      // This avoids blocking fast legitimate answers (e.g. 1×7 => "7").
      Voice.setTTSEchoFilter({
        nums: operands,
        operands,
        lang,
        numberGraceMs: tailMs + 180,   // ~180ms after unmute
        phraseGraceMs: tailMs + 1200,  // ~1.2s after unmute
      });
      setTimeout(() => Voice.muteResults(false), tailMs);
    };
    utt.onend   = resume;
    utt.onerror = resume;
    // Safety: force-unmute if onend/onerror never fire (mobile quirk)
    _ttsSafetyTimer = setTimeout(() => {
      if (!_resumed) {
        console.log('[TTS] safety unmute — onend never fired');
        resume();
      }
    }, 6000);
    window.speechSynthesis.speak(utt);
  }, 120);
}

function maybeSpeak() {
  if (state.phase !== 'PLAYING') return;
  if (!tutorialQuestionSpeechEnabled()) return;
  const target = Targeting.getTarget();
  Voice.setActiveQuestion(target?.key || '');
  if (target && target !== _lastSpokenTarget) {
    _lastSpokenTarget = target;
    speakQuestion(target.question);
  }
}

function speakNarrationLine(text) {
  return new Promise(resolve => {
    if (!text) { resolve(); return; }
    if (!window.speechSynthesis) {
      setTimeout(resolve, Math.max(900, Math.min(5000, text.length * 45)));
      return;
    }
    state.ttsFreezeActive = false;
    window.speechSynthesis.cancel();
    clearTimeout(_ttsSafetyTimer);
    const lang = (typeof I18n !== 'undefined') ? I18n.getLang() : 'en';
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = { en: 'en-US', de: 'de-DE', es: 'es-ES' }[lang] || 'en-US';
    utt.rate = 0.96;
    utt.pitch = 1.04;
    utt.volume = 0.9;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };
    utt.onend = finish;
    utt.onerror = finish;
    setTimeout(finish, Math.max(4000, text.length * 90));
    window.speechSynthesis.speak(utt);
  });
}

function speakTutorialPhrase(text) {
  return new Promise(resolve => {
    if (!text) { resolve(); return; }
    if (!window.speechSynthesis) {
      setTimeout(resolve, Math.max(900, Math.min(5000, text.length * 45)));
      return;
    }
    Voice.muteResults(true);
    state.ttsFreezeActive = true;
    window.speechSynthesis.cancel();
    const lang = (typeof I18n !== 'undefined') ? I18n.getLang() : 'en';
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = { en: 'en-US', de: 'de-DE', es: 'es-ES' }[lang] || 'en-US';
    utt.rate = 0.94;
    utt.pitch = 1.03;
    utt.volume = 0.88;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      state.ttsFreezeActive = false;
      Voice.muteResults(false);
      resolve();
    };
    utt.onend = finish;
    utt.onerror = finish;
    setTimeout(finish, Math.max(2500, text.length * 90));
    window.speechSynthesis.speak(utt);
  });
}

const TutorialRun = {
  start(settings) {
    this.stop();
    tutorialState = {
      active: true,
      inputLocked: true,
      playerControl: false,
      allowQuestionSpeech: false,
      completionHandled: false,
      userQuestionsRemaining: 2,
      playerTurnLevel: null,
      triggerWord: (settings.triggerWord || '').trim() || 'fire',
      lifeLossResolver: null,
      shieldAbsorbResolver: null,
      bossSpawned: false,
    };
    document.getElementById('btn-tutorial-exit').hidden = false;
    document.getElementById('btn-pause-tutorial-exit').hidden = false;
    UI.showTutorialOverlay(I18n.t('tutorialPreparing'));
    this.run().catch(err => console.error('[tutorial] run failed', err));
  },

  stop() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    state.ttsFreezeActive = false;
    this.clearHighlights();
    UI.hideTutorialOverlay();
    document.getElementById('btn-tutorial-exit').hidden = true;
    document.getElementById('btn-pause-tutorial-exit').hidden = true;
    tutorialState = null;
  },

  skip() {
    if (!tutorialActive()) return;
    Progress.markTutorialCompleted();
    UI.refreshTutorialEntryPoints();
    Audio.stopMusic();
    Engine.stop();
    Voice.stop();
    state.phase = 'ONBOARDING';
    this.stop();
    document.getElementById('pause-overlay').classList.remove('visible');
    document.getElementById('btn-mic').classList.remove('above-overlay');
    UI.showScreen('onboarding');
  },

  async wait(ms) {
    await new Promise(resolve => setTimeout(resolve, ms));
  },

  clearHighlights() {
    document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));
  },

  setHighlights(ids = []) {
    this.clearHighlights();
    const hex = Themes.contrastColorForTheme(state.theme);
    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    document.documentElement.style.setProperty('--tutorial-glow',     `rgba(${r},${g},${b},0.85)`);
    document.documentElement.style.setProperty('--tutorial-glow-dim', `rgba(${r},${g},${b},0.38)`);
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.add('tutorial-highlight');
    });
  },

  async narrate(text, { title = null, resume = false, highlightIds = [], overlayPosition = 'top' } = {}) {
    if (!tutorialActive()) return;
    tutorialState.inputLocked = true;
    tutorialState.allowQuestionSpeech = false;
    Engine.pause();
    Voice.stop();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    state.ttsFreezeActive = false;
    this.setHighlights(highlightIds);
    UI.showTutorialOverlay(text, title || I18n.t('tutorialOverlayTitle'), overlayPosition);
    await speakNarrationLine(text);
    if (!tutorialActive()) return;
    UI.hideTutorialOverlay(); // starts 80ms fade-out
    await this.wait(90);      // let the fade complete before moving on
    if (!tutorialActive()) return;
    this.clearHighlights();
    if (resume) {
      Engine.resume();
    }
  },

  resumeDemo() {
    if (!tutorialActive()) return;
    tutorialState.inputLocked = true;
    tutorialState.playerControl = false;
    Engine.resume();
  },

  resumePlayerControl() {
    if (!tutorialActive()) return;
    tutorialState.inputLocked = false;
    tutorialState.playerControl = true;
    tutorialState.allowQuestionSpeech = true;
    Engine.resume();
    if (!_typingMode) Voice.start();
  },

  clearScene() {
    state.objects = [];
    Targeting.reset();
    document.getElementById('answer-input').value = '';
    hideSuggestion();
    _lastSpokenTarget = null;
    state.answerStartTime = Date.now();
    UI.updateHUD(state);
  },

  resetBonusDemoState() {
    this.clearScene();
    state.freezeActive = 0;
    state.magnetActive = 0;
    state.revealBonusActive = 0;
    state.scoreStarActive = false;
    state.shieldBonusActive = false;
    state.bonusFlash = null;
    state.unpauseFreezeTimer = 0;
    UI.updateHUD(state);
  },

  slotX(slot = 'center') {
    const w = window.innerWidth;
    if (slot === 'left') return Math.round(w * 0.24);
    if (slot === 'right') return Math.round(w * 0.76);
    return Math.round(w * 0.5);
  },

  pickQuestion(extraExcluded = []) {
    const excludeAnswers = state.objects
      .filter(o => !o.dead && !o.dying && !o.destroyed)
      .map(o => o.answer)
      .concat(extraExcluded);
    return _pickQuestion(excludeAnswers);
  },

  addObject(obj, slot = 'center', y = 110, speed = 58) {
    if (!obj) return null;
    obj.x = this.slotX(slot);
    obj.y = y;
    obj.speed = speed;
    obj.wobbleOffset = 0;
    obj.wobbleX = 0;
    state.objects.push(obj);
    Targeting.syncTarget(state.objects);
    Targeting.setTarget(obj);
    Targeting.syncTarget(state.objects);
    state.answerStartTime = Date.now();
    return obj;
  },

  spawnQuestion(slot = 'center', opts = {}) {
    const q = opts.question || this.pickQuestion(opts.excludeAnswers || []);
    const obj = Objects.create(q, window.innerWidth, window.innerHeight, opts.speed || 58, []);
    return this.addObject(obj, slot, opts.y ?? 110, opts.speed || 58);
  },

  spawnItem(type, slot = 'center', opts = {}) {
    const q = opts.question || this.pickQuestion(opts.excludeAnswers || []);
    const map = {
      freeze: Objects.createFreeze,
      lifeup: Objects.createLifeUp,
      lightning: Objects.createLightning,
      scoreStar: Objects.createScoreStar,
      shield: Objects.createShield,
      magnet: Objects.createMagnet,
      reveal: Objects.createReveal,
    };
    const factory = map[type];
    if (!factory) return null;
    const obj = factory(q, window.innerWidth, opts.speed || 56, []);
    return this.addObject(obj, slot, opts.y ?? 110, opts.speed || 56);
  },

  async typeAnswer(answer) {
    const input = document.getElementById('answer-input');
    input.value = '';
    const chars = String(answer).split('');
    for (const ch of chars) {
      input.value += ch;
      await this.wait(180);
    }
    await this.wait(220);
    submitAnswer();
  },

  async voiceAnswer(answer) {
    const input = document.getElementById('answer-input');
    input.value = String(answer);
    showSuggestion(answer, false);
    await this.wait(550);
    submitAnswer();
  },

  async waitForQuestionSpeechCycle(timeoutMs = 7000) {
    if (!tutorialActive()) return;
    const startedAt = Date.now();
    let sawSpeechStart = !!state.ttsFreezeActive;
    while (!sawSpeechStart && Date.now() - startedAt < timeoutMs) {
      await this.wait(50);
      sawSpeechStart = !!state.ttsFreezeActive;
    }
    if (!sawSpeechStart) {
      await this.wait(1200);
      return;
    }
    while (state.ttsFreezeActive && Date.now() - startedAt < timeoutMs) {
      await this.wait(50);
    }
    await this.wait(320);
  },

  async demoVoicePhrase(phrase, answer) {
    if (!tutorialActive()) return;
    UI.showTutorialOverlay(
      I18n.t('tutorialVoiceDemoLine', { phrase }),
      I18n.t('tutorialOverlayTitle'),
      'bottom'
    );
    await speakTutorialPhrase(phrase);
    if (!tutorialActive()) return;
    await this.wait(250);
    await this.voiceAnswer(answer);
  },

  async pulseButton(id, duration = 700) {
    const btn = document.getElementById(id);
    if (!btn) { await this.wait(duration); return; }
    if (typeof btn.animate === 'function') {
      btn.animate([
        { transform: 'scale(1)', boxShadow: '0 0 0 rgba(247,201,72,0)' },
        { transform: 'scale(1.14)', boxShadow: '0 0 18px rgba(247,201,72,0.6)' },
        { transform: 'scale(1)', boxShadow: '0 0 0 rgba(247,201,72,0)' },
      ], { duration, easing: 'ease-in-out' });
    }
    await this.wait(duration);
  },


  waitForLifeLoss() {
    return new Promise(resolve => {
      if (!tutorialActive()) { resolve(); return; }
      tutorialState.lifeLossResolver = resolve;
    });
  },

  waitForShieldAbsorb() {
    return new Promise(resolve => {
      if (!tutorialActive()) { resolve(); return; }
      tutorialState.shieldAbsorbResolver = resolve;
    });
  },

  onLifeLost() {
    if (!tutorialActive()) return;
    if (tutorialState.lifeLossResolver) {
      tutorialState.lifeLossResolver();
      tutorialState.lifeLossResolver = null;
    }
  },

  onShieldAbsorbed() {
    if (!tutorialActive()) return;
    if (tutorialState.shieldAbsorbResolver) {
      tutorialState.shieldAbsorbResolver();
      tutorialState.shieldAbsorbResolver = null;
    }
  },

  onRegularCorrect() {
    if (!tutorialActive() || !tutorialState.playerControl) return;
    const ptl = tutorialState.playerTurnLevel;
    if (state.level === ptl) {
      tutorialState.userQuestionsRemaining = Math.max(0, tutorialState.userQuestionsRemaining - 1);
      if (tutorialState.userQuestionsRemaining > 0) {
        UI.showTutorialOverlay(
          I18n.t('tutorialTryObjective', {
            remaining: tutorialState.userQuestionsRemaining,
            word: tutorialState.triggerWord,
          }),
          I18n.t('tutorialYourTurnTitle')
        );
        setTimeout(() => {
          if (tutorialActive() && tutorialState.playerControl && state.level === tutorialState.playerTurnLevel) {
            this.spawnPlayerQuestion();
          }
        }, 700);
      }
    }
  },

  spawnPlayerQuestion() {
    if (!tutorialActive() || !tutorialState.playerControl || state.level !== tutorialState.playerTurnLevel) return;
    const liveQuestions = state.objects.filter(o =>
      !o.dead && !o.dying && !o.destroyed &&
      !o.isFreeze && !o.isLifeUp && !o.isLightning && !o.isScoreStar &&
      !o.isShield && !o.isMagnet && !o.isReveal && !o.isBoss
    );
    if (liveQuestions.length > 0) return;
    this.clearScene();
    this.spawnQuestion('center', { y: 110, speed: 54 });
  },

  async enterPlayerTurn() {
    if (!tutorialActive()) return;
    this.clearScene();
    await this.narrate(I18n.t('tutorialNowYouTry'), { title: I18n.t('tutorialYourTurnTitle') });
    if (!tutorialActive()) return;
    tutorialState.playerTurnLevel = state.level;
    state.correctThisLevel = 8;
    state.attemptsThisLevel = 8;
    UI.showTutorialOverlay(
      I18n.t(isPhone() ? 'tutorialTryObjectiveMobile' : 'tutorialTryObjective', { remaining: tutorialState.userQuestionsRemaining, word: tutorialState.triggerWord }),
      I18n.t('tutorialYourTurnTitle')
    );
    this.resumePlayerControl();
    this.spawnPlayerQuestion();
  },

  async onLevelChanged(level) {
    if (!tutorialActive() || !tutorialState.playerControl) return;
    if (level === (tutorialState.playerTurnLevel ?? 4) + 1 && !tutorialState.bossSpawned) {
      tutorialState.bossSpawned = true;
      tutorialState.inputLocked = true;
      tutorialState.playerControl = false;
      this.clearScene();
      await this.narrate(I18n.t('tutorialBossIntro', { word: tutorialState.triggerWord }), { title: I18n.t('tutorialYourTurnTitle') });
      if (!tutorialActive()) return;
      const q1 = this.pickQuestion();
      const q2 = this.pickQuestion([q1.answer]);
      const boss = Objects.createBoss([q1, q2], window.innerWidth, window.innerHeight, 56);
      this.addObject(boss, 'center', 125, 34);
      UI.showTutorialOverlay(I18n.t(isPhone() ? 'tutorialBossObjectiveMobile' : 'tutorialBossObjective', { word: tutorialState.triggerWord }), I18n.t('tutorialYourTurnTitle'));
      this.resumePlayerControl();
    }
  },

  async onBossDefeated() {
    if (!tutorialActive() || tutorialState.completionHandled) return;
    tutorialState.completionHandled = true;
    tutorialState.inputLocked = true;
    tutorialState.playerControl = false;
    await this.wait(900);
    if (!tutorialActive()) return;
    await this.narrate(I18n.t('tutorialCompleteLine'), { title: I18n.t('tutorialOverlayTitle') });
    if (!tutorialActive()) return;
    Progress.markTutorialCompleted();
    UI.refreshTutorialEntryPoints();
    Audio.stopMusic();
    Engine.stop();
    Voice.stop();
    state.phase = 'ONBOARDING';
    this.stop();
    UI.showScreen('onboarding');
  },

  async run() {
    // Give the game screen a moment to fully render before the first narration
    await this.wait(1000);
    if (!tutorialActive()) return;

    if (isPhone()) {
      await this.narrate(I18n.t('tutorialIntroLineMobile'), {
        title: I18n.t('tutorialOverlayTitle'),
        highlightIds: ['btn-mic'],
      });
    } else {
      await this.narrate(I18n.t('tutorialIntroLine'), {
        title: I18n.t('tutorialOverlayTitle'),
        highlightIds: ['input-wrapper', 'btn-fire', 'btn-mic'],
      });
      if (!tutorialActive()) return;

      state.correctThisLevel = 9;
      state.attemptsThisLevel = 9;
      this.clearScene();
      tutorialState.allowQuestionSpeech = true;
      this.spawnQuestion('center', { y: 120, speed: 50 });
      this.resumeDemo();
      await this.wait(2200);
      await this.typeAnswer(Targeting.getTarget()?.answer);
      await this.wait(1800);
    }

    state.correctThisLevel = 8;
    state.attemptsThisLevel = 8;
    this.clearScene();
    const voiceDemo = this.pickQuestion();
    const voiceLineKey = isPhone() ? 'tutorialVoiceLineMobile' : 'tutorialVoiceLine';
    await this.narrate(
      I18n.t(voiceLineKey, { word: tutorialState.triggerWord, phrase: `${tutorialState.triggerWord} ${voiceDemo.answer}` }),
      { title: I18n.t('tutorialOverlayTitle'), highlightIds: ['btn-mic'], overlayPosition: 'top' }
    );
    if (!tutorialActive()) return;
    tutorialState.allowQuestionSpeech = true;
    this.addObject(Objects.create(voiceDemo, window.innerWidth, window.innerHeight, 52, []), 'center', 120, 52);
    this.resumeDemo();
    await this.waitForQuestionSpeechCycle();
    await this.demoVoicePhrase(`${tutorialState.triggerWord} ${voiceDemo.answer}`, voiceDemo.answer);
    this.spawnQuestion('center', { y: 90, speed: 28 }); // keep canvas alive after voice demo
    await this.wait(900);

    await this.narrate(I18n.t('tutorialControlsLine'), {
      title: I18n.t('tutorialOverlayTitle'),
      highlightIds: ['btn-mute', 'btn-mic', 'btn-pause'],
    });
    if (!tutorialActive()) return;
    this.resumeDemo();

    this.clearScene();
    tutorialState.allowQuestionSpeech = false;
    this.spawnQuestion('left', { y: 150, speed: 38 });
    this.spawnQuestion('center', { y: 115, speed: 38 });
    this.spawnQuestion('right', { y: 175, speed: 38 });
    await this.narrate(I18n.t('tutorialTargetLine'), {
      title: I18n.t('tutorialOverlayTitle'),
      highlightIds: ['game-canvas'],
      overlayPosition: 'bottom',
    });
    if (!tutorialActive()) return;
    this.resumeDemo();
    await this.wait(500);
    Targeting.moveRight(state.objects);
    await this.wait(700);
    Targeting.moveLeft(state.objects);
    await this.wait(700);

    await this.narrate(I18n.t('tutorialHelpLine'), {
      title: I18n.t('tutorialOverlayTitle'),
      highlightIds: ['btn-help'],
      overlayPosition: 'top',
    });
    if (!tutorialActive()) return;
    this.resumeDemo();
    await this.wait(450);
    useHelp();
    await this.wait(1300);

    this.clearScene();
    const missObj = this.spawnQuestion('center', { y: window.innerHeight - 250, speed: 120 });
    if (missObj) Targeting.setTarget(missObj);
    await this.narrate(I18n.t('tutorialLivesLine'), {
      title: I18n.t('tutorialOverlayTitle'),
      highlightIds: ['hud-lives'],
      overlayPosition: 'bottom',
    });
    if (!tutorialActive()) return;
    this.resumeDemo();
    await this.waitForLifeLoss();
    await this.wait(200);

    this.clearScene();
    await this.narrate(I18n.t('tutorialLifeUpLine'), {
      title: I18n.t('tutorialOverlayTitle'),
      overlayPosition: 'bottom',
    });
    if (!tutorialActive()) return;
    this.spawnItem('lifeup', 'center', { y: 125, speed: 48 });
    this.resumeDemo();
    await this.wait(350);
    await this.typeAnswer(Targeting.getTarget()?.answer);
    await this.wait(1200);
    this.resetBonusDemoState();

    await this.narrate(I18n.t('tutorialFreezeLine'), {
      title: I18n.t('tutorialOverlayTitle'),
      overlayPosition: 'bottom',
    });
    if (!tutorialActive()) return;
    this.spawnQuestion('left', { y: 155, speed: 46 });
    this.spawnQuestion('right', { y: 185, speed: 46 });
    this.spawnItem('freeze', 'center', { y: 125, speed: 48 });
    this.resumeDemo();
    await this.wait(350);
    await this.typeAnswer(Targeting.getTarget()?.answer);
    await this.wait(1800);
    this.resetBonusDemoState();

    this.spawnQuestion('center', { y: 135, speed: 48 });
    this.resumeDemo();
    await this.wait(350);
    await this.typeAnswer(Targeting.getTarget()?.answer);
    await this.wait(1800);

    this.clearScene();
    await this.narrate(I18n.t('tutorialPowerupsLine'), {
      title: I18n.t('tutorialOverlayTitle'),
      overlayPosition: 'bottom',
    });
    if (!tutorialActive()) return;

    this.spawnQuestion('left', { y: 150, speed: 34 });
    this.spawnQuestion('right', { y: 165, speed: 34 });
    await this.narrate(I18n.t('tutorialLightningLine'), {
      title: I18n.t('tutorialOverlayTitle'),
      overlayPosition: 'bottom',
    });
    if (!tutorialActive()) return;
    this.spawnItem('lightning', 'center', { y: 120, speed: 44 });
    this.resumeDemo();
    await this.wait(350);
    await this.typeAnswer(Targeting.getTarget()?.answer);
    await this.wait(1400);
    this.resetBonusDemoState();

    await this.narrate(I18n.t('tutorialScoreStarLine'), {
      title: I18n.t('tutorialOverlayTitle'),
      highlightIds: ['hud-score', 'score-val', 'hud-center'],
      overlayPosition: 'bottom',
    });
    if (!tutorialActive()) return;
    this.spawnQuestion('left', { y: Math.round(window.innerHeight * 0.54), speed: 24 });
    this.spawnItem('scoreStar', 'center', { y: 118, speed: 44 });
    this.resumeDemo();
    await this.wait(350);
    await this.typeAnswer(Targeting.getTarget()?.answer);
    await this.wait(700);
    await this.typeAnswer(Targeting.getTarget()?.answer);
    await this.wait(1800);
    this.resetBonusDemoState();

    await this.narrate(I18n.t('tutorialShieldLine'), {
      title: I18n.t('tutorialOverlayTitle'),
      overlayPosition: 'bottom',
    });
    if (!tutorialActive()) return;
    this.spawnItem('shield', 'center', { y: 120, speed: 42 });
    this.resumeDemo();
    await this.wait(350);
    await this.typeAnswer(Targeting.getTarget()?.answer);
    await this.wait(500);
    const shieldMiss = this.spawnQuestion('center', { y: window.innerHeight - 235, speed: 120 });
    if (shieldMiss) Targeting.setTarget(shieldMiss);
    await this.waitForShieldAbsorb();
    await this.wait(500);
    this.resetBonusDemoState();

    this.spawnQuestion('left',  { y: 140, speed: 26 });
    this.spawnQuestion('right', { y: 170, speed: 26 });
    this.spawnQuestion('left',  { y: 200, speed: 26 });
    this.spawnQuestion('right', { y: 230, speed: 26 });
    await this.narrate(I18n.t('tutorialMagnetLine'), {
      title: I18n.t('tutorialOverlayTitle'),
      overlayPosition: 'bottom',
    });
    if (!tutorialActive()) return;
    this.spawnItem('magnet', 'center', { y: 60, speed: 52 }); // fast — gets collected first
    this.resumeDemo();
    await this.wait(300);
    await this.typeAnswer(Targeting.getTarget()?.answer); // collect magnet
    await this.wait(1800); // let magnet pull questions to centre
    await this.typeAnswer(Targeting.getTarget()?.answer); // answer one → splash!
    await this.wait(2200); // watch the chain destroy
    this.resetBonusDemoState();

    this.spawnQuestion('left', { y: 160, speed: 30 });
    this.spawnQuestion('right', { y: 190, speed: 30 });
    await this.narrate(I18n.t('tutorialRevealLine'), {
      title: I18n.t('tutorialOverlayTitle'),
      overlayPosition: 'bottom',
    });
    if (!tutorialActive()) return;
    this.spawnItem('reveal', 'center', { y: 120, speed: 42 });
    this.resumeDemo();
    await this.wait(350);
    await this.typeAnswer(Targeting.getTarget()?.answer);
    await this.wait(1800);
    this.resetBonusDemoState();

    state.correctThisLevel = 9;
    state.attemptsThisLevel = 9;
    this.spawnQuestion('center', { y: 135, speed: 46 });
    this.resumeDemo();
    await this.wait(350);
    await this.typeAnswer(Targeting.getTarget()?.answer);
    await this.wait(1800);

    await this.enterPlayerTurn();
  },
};

// Expose TutorialRun for E2E test instrumentation.
window.TutorialRun = TutorialRun;

// ---- Per-table mastery announcements ----
// Checks if any table in the current range has had all its facts mastered
// for the first time this session. Shows a banner and confetti but does NOT
// end the game. When every table in the range is done, extended tables are
// unlocked.
function _pickQuestion(excludeAnswers) {
  const stats = Progress.getStats();
  const op  = state.operations[Math.floor((state.rng || Math.random)() * state.operations.length)];
  const isAddSub = op === 'add' || op === 'subtract';
  const qMin = isAddSub ? 1 : state.minTable;
  const qMax = isAddSub ? state.addSubRange : state.maxTable;
  return Questions.pick(qMin, qMax, stats, excludeAnswers, state.wrongQueue, op,
    { difficulty: state.difficulty, zehner: state.zehner, halbschriftlich: state.halbschriftlich },
    state.rng);
}

function checkTableMastery() {
  if (state.phase !== 'PLAYING') return;
  if (state.operations.length > 1) return; // skip in mixed mode
  const op = state.operation || 'multiply';
  const { facts } = Progress.getMastery(state.minTable, state.maxTable, op);
  const aValues = [...new Set(facts.map(f => f.a))];
  let allDone = true;

  for (const a of aValues) {
    const tableFacts = facts.filter(f => f.a === a);
    const isMastered = tableFacts.length > 0 && tableFacts.every(f => f.masteredLevel >= 5);
    if (!isMastered) { allDone = false; continue; }
    if (state.masteredTablesAnnounced.has(a)) continue;
    // Newly mastered this session — announce once
    state.masteredTablesAnnounced.add(a);
    state.confetti = spawnConfetti(window.innerWidth);
    vibrate([40, 60, 80, 60, 40]);
    const masteredKeyMap = { divide: 'tableMasteredDivide', add: 'tableMasteredAdd', subtract: 'tableMasteredSubtract' };
    const masteredKey = masteredKeyMap[op] || 'tableMastered';
    UI.showLevelUp(I18n.t(masteredKey, { table: a }), null);
  }

  // Unlock extended tables when every × table in range is done (multiply only)
  if (allDone && aValues.length > 0 && op === 'multiply') {
    Progress.unlockExtendedTables();
    state.masteryWin = true; // flag for game-over summary only
  }
}

// ---- Bootstrap ----
window.addEventListener('DOMContentLoaded', () => {
  Engine.init(update, render);

  // Decode challenge link if present (?c=BASE64)
  try {
    const param = new URLSearchParams(location.search).get('c');
    if (param) {
      window._challengeConfig = JSON.parse(atob(decodeURIComponent(param)));
    }
  } catch { window._challengeConfig = null; }

  UI.initOnboarding(startGame, startTutorial);

  document.getElementById('btn-tutorial-exit').addEventListener('click', () => TutorialRun.skip());
  document.getElementById('btn-pause-tutorial-exit').addEventListener('click', () => TutorialRun.skip());

  const answerInput = document.getElementById('answer-input');
  const btnFire = document.getElementById('btn-fire');

  document.addEventListener('keydown', e => {
    if (state.phase !== 'PLAYING') return;
    if (tutorialLocksInput()) { e.preventDefault(); return; }
    if (e.key === 'ArrowLeft') { e.preventDefault(); hideSuggestion(); Targeting.moveLeft(state.objects); }
    if (e.key === 'ArrowRight') { e.preventDefault(); hideSuggestion(); Targeting.moveRight(state.objects); }
    if (e.key === 'Enter') { e.preventDefault(); submitAnswer(); }
    if (e.key === ' ' && state.bombCharges > 0) {
      e.preventDefault();
      useBomb();
    }
    if ((e.key === 'h' || e.key === 'H') && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      useHelp();
    }
    // Redirect digit / backspace to answer input regardless of what has focus
    if (/^\d$/.test(e.key) && document.activeElement !== answerInput) {
      e.preventDefault();
      answerInput.value += e.key;
      answerInput.focus();
    } else if (e.key === 'Backspace' && document.activeElement !== answerInput) {
      e.preventDefault();
      answerInput.value = answerInput.value.slice(0, -1);
      answerInput.focus();
    } else if (!['ArrowLeft','ArrowRight','Enter','Tab',' ','h','H'].includes(e.key)) {
      focusAnswerInput();
    }
  });

  answerInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); submitAnswer(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); hideSuggestion(); Targeting.moveLeft(state.objects); }
    if (e.key === 'ArrowRight') { e.preventDefault(); hideSuggestion(); Targeting.moveRight(state.objects); }
  });

  answerInput.addEventListener('input', () => {
    if (state.phase !== 'PLAYING') return;
    if (tutorialLocksInput()) return;
    if (Voice.supported) {
      if (answerInput.value !== '') _enterTypingMode();
    }
    const target = Targeting.getTarget();
    if (!target) return;
    const val = parseInt(answerInput.value.trim());
    if (!isNaN(val) && val === target.answer) submitAnswer();
  });

  btnFire.addEventListener('click', () => { if (!tutorialLocksInput()) submitAnswer(); });
  document.getElementById('btn-help').addEventListener('click', () => { if (!tutorialLocksInput()) useHelp(); });

  // ---- Swipe to change target (mobile) ----
  // Attach to the canvas so swipes on the answer bar don't interfere.
  const gameCanvas = document.getElementById('game-canvas');
  let swipeStartX = 0;
  let swipeStartY = 0;
  const SWIPE_MIN_X   = 40;  // px horizontal to count as a swipe
  const SWIPE_MAX_Y   = 60;  // px vertical — above this it's a scroll, not a swipe

  gameCanvas.addEventListener('touchstart', e => {
    swipeStartX = e.changedTouches[0].clientX;
    swipeStartY = e.changedTouches[0].clientY;
  }, { passive: true });

  gameCanvas.addEventListener('touchend', e => {
    if (state.phase !== 'PLAYING') return;
    if (tutorialLocksInput()) return;
    const dx = e.changedTouches[0].clientX - swipeStartX;
    const dy = e.changedTouches[0].clientY - swipeStartY;
    if (Math.abs(dx) < SWIPE_MIN_X) return;       // too short — ignore
    if (Math.abs(dy) > SWIPE_MAX_Y) return;        // too vertical — ignore
    if (dx < 0) { hideSuggestion(); Targeting.moveLeft(state.objects); }
    else        { hideSuggestion(); Targeting.moveRight(state.objects); }
  }, { passive: true });

  // Mute toggle — phones default to muted so mic picks up clearly
  const btnMute = document.getElementById('btn-mute');
  const isPhone = window.innerWidth < 640;
  let _muted = isPhone;
  if (_muted) {
    Audio.setMuted(true);
    btnMute.textContent = '🔇';
    btnMute.classList.add('muted');
    btnMute.title = 'Unmute music';
  }
  btnMute.addEventListener('click', () => {
    _muted = !_muted;
    Audio.setMuted(_muted);
    if (!_muted) Audio.playMusic(state.theme);
    btnMute.textContent = _muted ? '🔇' : '🔊';
    btnMute.classList.toggle('muted', _muted);
    btnMute.title = _muted ? 'Unmute music' : 'Mute music';
  });

  // Pause / resume
  const btnPause = document.getElementById('btn-pause');
  const btnResume = document.getElementById('btn-resume');
  btnPause.addEventListener('click', () => { if (!tutorialLocksInput()) togglePause(); });
  btnResume.addEventListener('click', () => { if (!tutorialLocksInput()) togglePause(); });
  document.getElementById('btn-pause-menu').addEventListener('click', () => {
    Engine.resume();
    Engine.stop();
    Audio.stopMusic();
    Voice.stop();
    state.phase = 'ONBOARDING';
    document.getElementById('pause-overlay').classList.remove('visible');
    UI.showScreen('onboarding');
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
      if (tutorialLocksInput()) return;
      if (state.phase === 'PLAYING' || Engine.isPaused()) togglePause();
    }
  });

  // ---- Voice setup ----
  const btnMic = document.getElementById('btn-mic');
  _voiceSuggestionEl = document.getElementById('voice-suggestion');

  _voiceSuggestionEl.addEventListener('click', () => {
    if (state.phase === 'PLAYING') { hideSuggestion(); submitAnswer(); }
  });

  if (!Voice.supported) {
    btnMic.style.display = 'none';
  } else {
    // ---- Mic button state helpers ----
    // States (applied as CSS classes): listening → speaking → processing → listening
    // sound-detected can overlay any of the above (ambient audio indicator)
    let processingClearTimer = null;

    function micState(state) {
      btnMic.classList.remove('speaking', 'processing', 'sound-detected');
      if (state === 'listening') btnMic.classList.add('listening');
      if (state === 'speaking')  { btnMic.classList.add('listening', 'speaking'); }
      if (state === 'processing'){ btnMic.classList.add('listening', 'processing'); }
      if (state === 'off')       { btnMic.classList.remove('listening'); }
    }

    function clearProcessing() {
      clearTimeout(processingClearTimer);
      btnMic.classList.remove('processing', 'speaking', 'sound-detected');
    }

    Voice.init({
      onNext:       () => { clearProcessing(); hideSuggestion(); if (state.phase === 'PLAYING') Targeting.moveRight(state.objects); },
      onPrevious:   () => { clearProcessing(); hideSuggestion(); if (state.phase === 'PLAYING') Targeting.moveLeft(state.objects); },
      onClear:      () => { clearProcessing(); hideSuggestion(); if (state.phase === 'PLAYING') answerInput.value = ''; },
      onInterim:    (n) => { if (state.phase === 'PLAYING') { showSuggestion(n, true);  answerInput.value = String(n); } },
      onFire:       () => { clearProcessing(); if (state.phase === 'PLAYING') { hideSuggestion(); submitAnswer(); } },
      onNumber:     (n) => {
        clearProcessing();
        if (state.phase !== 'PLAYING') return;
        answerInput.value = String(n);
        showSuggestion(n, false);
        const target = Targeting.getTarget();
        if (target) startAutoSubmit(target);
      },
      onResultDone: () => clearProcessing(),  // no-match or after any result

      // Sound lifecycle → drives mic button states
      onSoundStart:  () => btnMic.classList.add('sound-detected'),
      onSoundEnd:    () => btnMic.classList.remove('sound-detected'),
      onSpeechStart: () => micState('speaking'),
      onSpeechEnd:   () => {
        // Speech ended — engine is now processing. Show blue "thinking" state.
        micState('processing');
        // Safety: if no result arrives within 2.5s, revert to plain listening
        clearTimeout(processingClearTimer);
        processingClearTimer = setTimeout(() => micState('listening'), 2500);
      },

      onStatusChange: (active, reason) => {
        state.voiceActive = active && reason !== 'denied';
        if (active) {
          micState('listening');
          btnMic.title = 'Voice active — speak your answer';
        } else {
          micState('off');
          clearTimeout(processingClearTimer);
          btnMic.title = reason === 'denied'
            ? 'Microphone access denied'
            : 'Tap to enable voice input';
        }
        btnMic.classList.toggle('denied', reason === 'denied');
      },
    });

    btnMic.addEventListener('click', () => {
      if (tutorialLocksInput()) return;
      if (btnMic.classList.contains('denied')) return;
      if (_typingMode) {
        // User explicitly re-enables voice — exit typing mode
        _typingMode = false;
        btnMic.classList.remove('typing');
        Voice.start();
        return;
      }
      if (btnMic.classList.contains('listening')) {
        Voice.stop();
      } else {
        Voice.start();
      }
    });
  }
});

function useBomb() {
  if (state.bombCharges <= 0 || state.phase !== 'PLAYING') return;
  // Find the lowest (highest Y) live non-special object
  const candidates = state.objects.filter(o => !o.dead && !o.dying && !o.destroyed && !o.isFreeze && !o.isLifeUp && !o.isBoss);
  if (candidates.length === 0) return;
  const lowest = candidates.reduce((best, o) => o.y > best.y ? o : best, candidates[0]);
  const particleColor = Themes.particleColorForTheme(state.theme);
  Objects.triggerDestruction(lowest, particleColor);
  state.bombCharges--;
  Audio.play('correct');
  vibrate(60);
  UI.updateHUD(state);
}

// ---- SOS / Help ----
function useHelp() {
  if (state.phase !== 'PLAYING') return;
  if (state.helpCooldown > 0) return;
  const target = Targeting.getTarget();
  if (!target || target.isFreeze || target.isLifeUp || target.isBoss) return;

  // Reveal the answer on the targeted object for 4 seconds
  target._answerRevealed = true;
  target._helpRevealTimer = 4;

  state.helpCooldown = state.helpCooldownMax;
  Audio.play('levelUp');
  vibrate(60);
  refreshHelpBtn();
}

function refreshHelpBtn() {
  const t = Targeting.getTarget();
  const special = !t || t.isFreeze || t.isLifeUp || t.isBoss ||
                  t.isLightning || t.isScoreStar || t.isShield ||
                  t.isMagnet || t.isReveal;
  const key = `${Math.ceil(state.helpCooldown)}|${special ? 1 : 0}`;
  if (key === _lastHelpBtnKey) return;
  _lastHelpBtnKey = key;
  UI.updateHelpBtn(state.helpCooldown, state.helpCooldownMax, special);
}

function togglePause() {
  if (state.phase !== 'PLAYING' && !Engine.isPaused()) return;
  const btnMic = document.getElementById('btn-mic');
  if (Engine.isPaused()) {
    Engine.resume();
    if (!_typingMode && (!tutorialActive() || tutorialState.playerControl)) Voice.start();     // mic activates immediately (skip if user chose keyboard mode)
    state.unpauseFreezeTimer = 1.5;      // objects hold for 1.5s so player can orient
    btnMic.classList.remove('above-overlay');
    document.getElementById('pause-overlay').classList.remove('visible');
    focusAnswerInput();
  } else {
    Engine.pause();
    Voice.stop();
    btnMic.classList.add('above-overlay');  // lift mic above the pause overlay
    document.getElementById('pause-overlay').classList.add('visible');
  }
}

function startTutorial(settings) {
  startGame({
    ...settings,
    tutorialMode: true,
    operation: 'multiply',
    operations: ['multiply'],
    minTable: 2,
    maxTable: 5,
    difficulty: 'easy',
    practiceMode: false,
    runMode: false,
    isDaily: false,
    isChallenge: false,
    seed: TUTORIAL_SEED,
  });
}

function startGame(settings) {
  _lastHelpBtnKey = null;
  TutorialRun.stop();
  Progress.setPlayer(settings.name, settings.age);
  state.tutorialMode = !!settings.tutorialMode;
  state.name = settings.name;
  state.age = settings.age;
  state.theme = settings.theme;
  document.body.dataset.theme = settings.theme;
  state.minTable = settings.minTable;
  state.maxTable = settings.maxTable;
  state.operation = settings.operation || 'multiply';
  state.zehner = settings.zehner || false;
  state.halbschriftlich = settings.halbschriftlich || false;
  state.operations  = settings.operations  || [settings.operation || 'multiply'];
  state.operation   = state.operations[0]; // backward compat
  state.addSubRange = settings.addSubRange || 100;
  state.difficulty = settings.difficulty;
  state.hintThreshold = settings.hintThreshold || 3;
  state.practiceMode = settings.practiceMode || false;
  state.isDaily = settings.isDaily || false;
  state.runMode = settings.runMode || false;
  const startDiff = DIFFICULTY[settings.difficulty] || DIFFICULTY.medium;
  state.score = 0;
  state.level = 1;
  state.lives = startDiff.lives;
  state.maxLives = startDiff.lives;
  state.gameTimeSecs = 0;
  state.correctThisLevel = 0;
  state.attemptsThisLevel = 0;
  state.levelStars = [];
  state.totalCorrect = 0;
  state.totalAttempts = 0;
  state.streak = 0;
  state.maxStreak = 0;
  state.bossesDefeated = 0;
  state.objects = [];
  state.missedList = [];
  state.wrongQueue = [];
  state.lifeUpTimer = 0;
  state.freezeTimer = 0;
  state._bossSpawnedThisLevel = false;
  state.freezeActive = 0;
  state.lightningTimer = 0;
  state.scoreStarTimer = 0;
  state.shieldTimer = 0;
  state.magnetTimer = 0;
  state.revealTimer = 0;
  state.magnetActive = 0;
  state.revealBonusActive = 0;
  state.scoreStarActive = false;
  state.shieldBonusActive = false;
  state.bonusFlash = null;
  state.levelTransitionTimer = 0;
  state.unpauseFreezeTimer = 0;
  state.ttsFreezeActive = false;
  state.voiceActive = false;
  state.masteryWin = false;
  state.masteredTablesAnnounced = new Set();
  // Seeded RNG — generated fresh each game unless a challenge seed is provided
  state.seed = settings.seed || (Math.random() * 0xFFFFFFFF | 0);
  state.rng  = Questions.mulberry32(state.seed);
  state.isChallenge      = settings.isChallenge      || false;
  state.challengerScore  = settings.challengerScore  || null;
  state.seenTablesAnnounced = state.tutorialMode
    ? new Set()
    : new Set(Progress.getTableBadges(settings.minTable, settings.maxTable, settings.operation || 'multiply'));
  state.confetti = [];
  state.streakFlashTimer = 0;
  state.streakFlashLevel = 0;
  state.answerStartTime = Date.now();

  // Run mode state
  state.currentAnte = 1;
  state.anteStartScore = 0;
  state.activeUpgrades = [];
  state.activeUpgradeIds = [];
  // Upgrade flags (all off by default)
  state.chainAnswer       = false;
  state.streakBoost       = false;
  state.shieldCharges     = 0;
  state.speedMult         = 1;
  state.bombCharges       = 0;
  state.hotZoneBoost      = false;
  state.luckyBonus        = false;
  state.luckyBonusCounter = 0;
  state.quickBonus        = false;
  state.commutativePair   = false;
  state.streakSlow        = false;
  state.streakSlowTimer   = 0;
  state.streakSlowDuration = 5;
  state.revealOnHotZone   = false;
  state.lastChanceAvailable = false;
  state.lastChanceUsed    = false;
  state.missCount         = 0;
  state.adjacencyBonuses  = new Set();
  // Shop economy state
  state.runCoins          = 0;
  state.bonusCoinPerAnte  = 0;
  state.shopBuysThisRun   = 0;
  // Score multiplier state
  state.scoreMultiplier   = 1;
  state.perfectMultEnabled = false;
  // Echo flags
  state.echoLucky         = false;
  state.echoChain         = false;
  state.echoStreak        = false;
  // Replay counters
  state.replayCount       = 0;
  state.replayLuckyCount  = 0;
  state.replayChain       = false;
  state.replayHotZone     = false;
  state.replayStreak      = false;
  // Slot system
  state.maxUpgradeSlots   = 4;
  // Operation boosters
  state.multiBooster      = false;
  state.divideBooster     = false;
  state.addBooster        = false;
  state.subtractBooster   = false;
  // Exponential mechanics
  state.cascadeMultCount  = 0;
  state.compoundGrowth    = false;
  state.luckyFrequency    = false;

  // Help / SOS system
  state.helpCooldown    = 0;   // seconds remaining on cooldown (0 = ready)
  state.helpCooldownMax = 30;  // cooldown duration in seconds

  state.phase = 'PLAYING';

  Targeting.reset();
  cancelAutoSubmit();
  _lastSpokenTarget = null;
  clearTimeout(_speakTimer);
  clearTimeout(_ttsSafetyTimer);
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  Themes.init(state.theme, window.innerWidth, window.innerHeight);
  Audio.setTheme(state.theme);
  Audio.playMusic(state.theme);
  Audio.setRunMode(state.runMode);
  Audio.notifyLevel(state.level);

  document.getElementById('answer-input').value = '';
  hideSuggestion();
  UI.updateHUD(state);
  UI.showScreen('game');
  Engine.start();
  Voice.setTriggerMode(true, settings.triggerWord || '');
  if (state.tutorialMode) {
    Voice.stop();
    TutorialRun.start(settings);
  } else {
    UI.hideTutorialOverlay();
    Voice.start();
  }
}


// ---- UPDATE ----
function update(dt) {
  if (state.phase !== 'PLAYING' && state.phase !== 'ENDING') return;

  // Track total game time (used for spawn stagger)
  state.gameTimeSecs += dt;

  // Tick down active freeze
  _prevFreezeActive = state.freezeActive;
  if (state.freezeActive > 0) {
    state.freezeActive = Math.max(0, state.freezeActive - dt);
    if (state.freezeActive === 0) syncMusicIntensity(); // freeze ended
  }

  // Tick down magnet and reveal bonuses
  if (state.magnetActive > 0) {
    state.magnetActive = Math.max(0, state.magnetActive - dt);
    // Pull all live objects toward horizontal centre
    const cx = window.innerWidth / 2;
    for (const obj of state.objects) {
      if (!obj.dead && !obj.dying && !obj.destroyed && !obj.isLifeUp && !obj.isFreeze &&
          !obj.isLightning && !obj.isScoreStar && !obj.isShield && !obj.isMagnet && !obj.isReveal && !obj.isBoss) {
        obj.x += (cx - obj.x) * Math.min(1, dt * 2.5);
      }
    }
  }
  if (state.revealBonusActive > 0) state.revealBonusActive = Math.max(0, state.revealBonusActive - dt);

  // Tick down bonus activation flash
  if (state.bonusFlash && state.bonusFlash.timer > 0) {
    state.bonusFlash.timer = Math.max(0, state.bonusFlash.timer - dt);
  }

  // Set reveal flag on all objects
  for (const obj of state.objects) {
    obj._revealBonus = state.revealBonusActive > 0;
  }

  // Tick down level-transition freeze
  if (state.levelTransitionTimer > 0) {
    state.levelTransitionTimer = Math.max(0, state.levelTransitionTimer - dt);
  }

  // Tick down unpause grace period
  if (state.unpauseFreezeTimer > 0) {
    state.unpauseFreezeTimer = Math.max(0, state.unpauseFreezeTimer - dt);
  }

  // Tick down streak flash
  if (state.streakFlashTimer > 0) {
    state.streakFlashTimer = Math.max(0, state.streakFlashTimer - dt);
  }

  // Tick down help cooldown
  if (state.helpCooldown > 0) {
    const prev = state.helpCooldown;
    state.helpCooldown = Math.max(0, state.helpCooldown - dt);
    // Update button only on integer-second boundaries (avoids per-frame DOM writes)
    if (Math.ceil(state.helpCooldown) !== Math.ceil(prev)) {
      refreshHelpBtn();
    }
  }

  // Update confetti particles
  if (state.confetti.length > 0) {
    updateConfetti(state.confetti, dt);
    state.confetti = state.confetti.filter(p => p.life > 0);
  }

  // Speed multiplier: 0 during level transition, TTS, or unpause grace; 0.25× during freeze item
  const levelFreezing   = state.levelTransitionTimer > 0;
  const ttsFreezing     = state.ttsFreezeActive;
  const unpauseFreezing = state.unpauseFreezeTimer > 0;
  const freezeMult      = (levelFreezing || ttsFreezing || unpauseFreezing) ? 0
    : (state.freezeActive > 0 ? 0.25 : state.magnetActive > 0 ? 0.4 : 1);

  // Boss aura: regular objects fall at 65% speed while a boss is alive
  const hasBossActive = state.objects.some(o => o.isBoss && !o.dead && !o.dying && !o.destroyed);
  const bossMult = hasBossActive ? 0.65 : 1;

  // Update all objects (keep animating during ENDING)
  for (const obj of state.objects) {
    // Special items ignore boss aura; boss ignores its own aura; regular objects slowed by it
    const isSpecial = obj.isFreeze || obj.isLifeUp || obj.isBoss ||
      obj.isLightning || obj.isScoreStar || obj.isShield || obj.isMagnet || obj.isReveal;
    const effectiveDt = isSpecial ? dt * freezeMult : dt * freezeMult * bossMult;
    Objects.update(obj, effectiveDt, window.innerHeight - 148);

    // Detect first frame of gracing (1s grace window to answer before life is lost)
    if (obj.gracing && !obj._graceHandled && !obj.isFreeze && !obj.isLifeUp && !obj.isBoss &&
        !obj.isLightning && !obj.isScoreStar && !obj.isShield && !obj.isMagnet && !obj.isReveal) {
      obj._graceHandled = true;
      if (!state.practiceMode) {
        UI.showLevelUp(I18n.t('lastChanceMsg'), null);
      }
    }

    // Detect first frame of dying (object hit bottom)
    if (obj.dying && !obj._dieHandled) {
      obj._dieHandled = true;
      if (Targeting.getTarget() === obj) {
        document.getElementById('answer-input').value = '';
      }
      if (obj.isLifeUp || obj.isLightning || obj.isScoreStar || obj.isShield || obj.isMagnet || obj.isReveal) {
        // Bonus item missed — just disappears, no penalty
      } else {
        // Crash counts as a wrong attempt — lowers mastery for this fact
        if (!obj.isFreeze && !state.tutorialMode) {
          Progress.recordAttempt(obj.key, false, Date.now() - obj.spawnTime);
        }
        if (!state.practiceMode) {
          state.missCount = (state.missCount || 0) + 1;
          // Last Chance / Supernova / Tsunami / Cyclone: on 4th miss, destroy all objects
          if (state.lastChanceAvailable && !state.lastChanceUsed && state.missCount >= 4) {
            state.lastChanceUsed = true;
            const particleColor = Themes.particleColorForTheme(state.theme);
            for (const o of state.objects) {
              if (!o.dead && !o.dying && !o.destroyed) {
                Objects.triggerDestruction(o, particleColor);
              }
            }
            UI.showLevelUp('Last Chance!', null);
          }
          // Shield absorbs the next miss
          if (state.shieldCharges > 0) {
            state.shieldCharges--;
            if (state.tutorialMode) TutorialRun.onShieldAbsorbed();
            // ADJACENCY: Shield + Bomb neighbours → each absorb refunds 1 bomb charge
            if (state.adjacencyBonuses && state.adjacencyBonuses.has('adj_shieldBomb')) {
              state.bombCharges = (state.bombCharges || 0) + 1;
            }
            UI.showLevelUp(
              (state.adjacencyBonuses && state.adjacencyBonuses.has('adj_shieldBomb'))
                ? 'Shield! +1 Bomb' : 'Shield!', null);
            state.missedList.push({ question: obj.question, answer: obj.answer });
            UI.showMissFlash(obj.question, obj.answer);
            UI.updateHUD(state);
          } else if (state.shieldBonusActive) {
            state.shieldBonusActive = false;
            if (state.tutorialMode) TutorialRun.onShieldAbsorbed();
            UI.showLevelUp('🛡 Shield absorbed!', null);
            Audio.play('correct');
            state.bonusFlash = { type: 'shieldAbsorbed', timer: 0.85, maxTimer: 0.85 };
            state.missedList.push({ question: obj.question, answer: obj.answer });
            UI.showMissFlash(obj.question, obj.answer);
            UI.updateHUD(state);
          } else {
            state.lives = Math.max(0, state.lives - 1);
            if (state.tutorialMode) TutorialRun.onLifeLost();
            state.missedList.push({ question: obj.question, answer: obj.answer });
            UI.showMissFlash(obj.question, obj.answer);
            Audio.play('lifeLost');
            syncMusicIntensity();
            vibrate(200);
            UI.updateHUD(state);
            if (state.lives <= 0 && state.phase === 'PLAYING') {
              state.phase = 'ENDING';
              setTimeout(() => endGame(), 1400);
            }
          }
        } else {
          // Practice mode: track missed but no life loss
          state.missedList.push({ question: obj.question, answer: obj.answer });
          UI.showMissFlash(obj.question, obj.answer);
        }
      }
    }
  }

  if (state.phase === 'ENDING') {
    state.objects = state.objects.filter(o => !o.dead);
    return;
  }

  const diff = DIFFICULTY[state.difficulty];
  // Phone + voice: reduce max concurrent objects and falling speed so there's
  // enough time to speak an answer before items hit the bottom.
  const isPhoneVoice = window.innerWidth < 640 && state.voiceActive;
  const maxObj = state.halbschriftlich
    ? Math.min(2, diff.maxObjects)
    : diff.maxObjects + (state.level > 5 ? 1 : 0) - (isPhoneVoice ? 1 : 0);
  const rawSpeed = diff.baseSpeed * Math.pow(1 + SPEED_INCREASE_PER_LEVEL, state.level - 1);
  const phoneVoiceMult = isPhoneVoice ? 0.65 : 1;
  // Apply streak-slow timer (Dark Matter / Abyss Pull / Storm Front)
  if (state.streakSlowTimer > 0) {
    state.streakSlowTimer = Math.max(0, state.streakSlowTimer - dt);
  }
  const streakSlowMult = state.streakSlowTimer > 0 ? 0.60 : 1;
  const clampedSpeedMult = Math.max(0.4, state.speedMult || 1);
  const halbMult = state.halbschriftlich ? 0.7 : 1;
  const speed = Math.min(diff.maxSpeed * phoneVoiceMult, rawSpeed * phoneVoiceMult)
    * clampedSpeedMult * streakSlowMult * halbMult;

  // Boss round: spawn one giant boss on levels that are multiples of 5
  const hasBoss = state.objects.some(o => o.isBoss && !o.dead && !o.dying && !o.destroyed);
  const isBossLevel = !state.tutorialMode && state.level > 1 && state.level % 5 === 0 && state.correctThisLevel === 0 && !state._bossSpawnedThisLevel;
  if (isBossLevel && !hasBoss) {
    state._bossSpawnedThisLevel = true;
    Audio.setMusicState('boss');
    const stats = Progress.getStats();
    // Scale number of questions with level: 2 at L5, 3 at L10, 4 at L15, cap at 5
    const numQ = Math.min(5, 1 + Math.floor(state.level / 5));
    const usedAnswers = [];
    const bossQuestions = [];
    for (let i = 0; i < numQ; i++) {
      const q = _pickQuestion(usedAnswers);
      bossQuestions.push(q);
      usedAnswers.push(q.answer);
    }
    state.objects.push(Objects.createBoss(bossQuestions, window.innerWidth, window.innerHeight, speed));
  }
  if (state.level % 5 !== 0 || state.correctThisLevel > 0) {
    state._bossSpawnedThisLevel = false;
  }

  // If boss is alive, skip normal spawns
  if (hasBoss) {
    Targeting.syncTarget(state.objects);
    maybeSpeak();
    for (const obj of state.objects) {
      if (!obj.isLifeUp && !obj.isFreeze) obj.hintActive = obj.wrongAttempts >= state.hintThreshold;
    }
    UI.updateHUD(state);
    const currentTarget = Targeting.getTarget();
    const inp = document.getElementById('answer-input');
    inp.placeholder = (currentTarget && currentTarget.isBoss) ? I18n.t('bossPlaceholder') : I18n.t('answerPlaceholder');
    return;
  }

  if (!state.tutorialMode) {
    // Spawn freeze item — at most one on screen, every ~30s
    const hasFreeze = state.objects.some(o => o.isFreeze && !o.dead && !o.dying && !o.destroyed);
    if (!hasFreeze && state.freezeActive <= 0) {
      state.freezeTimer += dt;
      if (state.freezeTimer >= 30) {
        state.freezeTimer = 0;
        const excludeAnswers = state.objects.filter(o => !o.dead).map(o => o.answer);
        const q = _pickQuestion(excludeAnswers);
        const liveX = state.objects.filter(o => !o.dead).map(o => o.x);
        const fz = Objects.createFreeze(q, window.innerWidth, speed, liveX);
        if (fz) state.objects.push(fz); else state.freezeTimer = 28; // retry in 2s
      }
    } else if (hasFreeze) {
      state.freezeTimer = 0;
    }

    // Spawn life-up item — at most one on screen, only when injured, every ~20s
    const hasLifeUp = state.objects.some(o => o.isLifeUp && !o.dead && !o.dying && !o.destroyed);
    if (!hasLifeUp && state.lives < state.maxLives) {
      state.lifeUpTimer += dt;
      if (state.lifeUpTimer >= 20) {
        state.lifeUpTimer = 0;
        const excludeAnswers = state.objects.filter(o => !o.dead).map(o => o.answer);
        const q = _pickQuestion(excludeAnswers);
        const liveX = state.objects.filter(o => !o.dead).map(o => o.x);
        const lu = Objects.createLifeUp(q, window.innerWidth, speed, liveX);
        if (lu) state.objects.push(lu); else state.lifeUpTimer = 18; // retry in 2s
      }
    } else {
      state.lifeUpTimer = 0; // reset timer when at full health or one already active
    }

    // ⚡ Lightning — level 6+, ~45s
    const hasLightning = state.objects.some(o => o.isLightning && !o.dead && !o.dying && !o.destroyed);
    if (!hasLightning && state.level >= 6) {
      state.lightningTimer += dt;
      if (state.lightningTimer >= 45) {
        state.lightningTimer = 0;
        const q = _pickQuestion(state.objects.filter(o => !o.dead).map(o => o.answer));
        const liveX = state.objects.filter(o => !o.dead).map(o => o.x);
        const item = Objects.createLightning(q, window.innerWidth, speed, liveX);
        if (item) state.objects.push(item); else state.lightningTimer = 43;
      }
    } else if (hasLightning) { state.lightningTimer = 0; }

    // 🌟 Score Star — always, ~35s
    const hasScoreStar = state.objects.some(o => o.isScoreStar && !o.dead && !o.dying && !o.destroyed);
    if (!hasScoreStar && !state.scoreStarActive) {
      state.scoreStarTimer += dt;
      if (state.scoreStarTimer >= 35) {
        state.scoreStarTimer = 0;
        const q = _pickQuestion(state.objects.filter(o => !o.dead).map(o => o.answer));
        const liveX = state.objects.filter(o => !o.dead).map(o => o.x);
        const item = Objects.createScoreStar(q, window.innerWidth, speed, liveX);
        if (item) state.objects.push(item); else state.scoreStarTimer = 33;
      }
    } else { state.scoreStarTimer = 0; }

    // 🛡 Shield — only when at full health, ~40s
    const hasShield = state.objects.some(o => o.isShield && !o.dead && !o.dying && !o.destroyed);
    if (!hasShield && !state.shieldBonusActive && state.lives >= state.maxLives) {
      state.shieldTimer += dt;
      if (state.shieldTimer >= 40) {
        state.shieldTimer = 0;
        const q = _pickQuestion(state.objects.filter(o => !o.dead).map(o => o.answer));
        const liveX = state.objects.filter(o => !o.dead).map(o => o.x);
        const item = Objects.createShield(q, window.innerWidth, speed, liveX);
        if (item) state.objects.push(item); else state.shieldTimer = 38;
      }
    } else { state.shieldTimer = 0; }

    // 🧲 Magnet — 4+ live question objects, ~50s
    const liveQuestionCount = state.objects.filter(o => !o.dead && !o.dying && !o.destroyed &&
      !o.isLifeUp && !o.isFreeze && !o.isLightning && !o.isScoreStar && !o.isShield && !o.isMagnet && !o.isReveal && !o.isBoss).length;
    const hasMagnet = state.objects.some(o => o.isMagnet && !o.dead && !o.dying && !o.destroyed);
    if (!hasMagnet && state.magnetActive <= 0 && liveQuestionCount >= 4) {
      state.magnetTimer += dt;
      if (state.magnetTimer >= 50) {
        state.magnetTimer = 0;
        const q = _pickQuestion(state.objects.filter(o => !o.dead).map(o => o.answer));
        const liveX = state.objects.filter(o => !o.dead).map(o => o.x);
        const item = Objects.createMagnet(q, window.innerWidth, speed, liveX);
        if (item) state.objects.push(item); else state.magnetTimer = 48;
      }
    } else if (hasMagnet) { state.magnetTimer = 0; }

    // 💡 Reveal — accuracy < 60%, ~60s
    const accuracy = state.totalAttempts > 0 ? state.totalCorrect / state.totalAttempts : 1;
    const hasReveal = state.objects.some(o => o.isReveal && !o.dead && !o.dying && !o.destroyed);
    if (!hasReveal && state.revealBonusActive <= 0 && state.totalAttempts >= 5 && accuracy < 0.6) {
      state.revealTimer += dt;
      if (state.revealTimer >= 60) {
        state.revealTimer = 0;
        const q = _pickQuestion(state.objects.filter(o => !o.dead).map(o => o.answer));
        const liveX = state.objects.filter(o => !o.dead).map(o => o.x);
        const item = Objects.createReveal(q, window.innerWidth, speed, liveX);
        if (item) state.objects.push(item); else state.revealTimer = 58;
      }
    } else if (hasReveal) { state.revealTimer = 0; }

    // Spawn new question objects (skip during level transition or TTS)
    // Stagger start: allow 1 object immediately, add a slot every 4s so the screen
    // doesn't fill instantly at game start. Fully ramped after (maxObj-1)*4 seconds.
    const staggerMax = Math.min(maxObj, 1 + Math.floor(state.gameTimeSecs / 4));
    const aliveCount = state.objects.filter(o => !o.dead && !o.dying && !o.destroyed && !o.isLifeUp && !o.isFreeze &&
      !o.isLightning && !o.isScoreStar && !o.isShield && !o.isMagnet && !o.isReveal).length;
    if (!levelFreezing && !ttsFreezing && !unpauseFreezing && aliveCount < staggerMax) {
      const excludeAnswers = state.objects.filter(o => !o.dead).map(o => o.answer);
      const q = _pickQuestion(excludeAnswers);
      const liveX = state.objects.filter(o => !o.dead).map(o => o.x);
      const obj = Objects.create(q, window.innerWidth, window.innerHeight, speed, liveX);
      if (obj) state.objects.push(obj);
      // else: no room yet — retry happens automatically next frame
    }
  }

  // Remove fully dead objects
  state.objects = state.objects.filter(o => !o.dead);

  // Sync targeting
  Targeting.syncTarget(state.objects);
  maybeSpeak();

  // Update hint visibility
  const hzTopN    = state.hotZoneBoost ? HOT_ZONE_TOP_WIDE    : HOT_ZONE_TOP;
  const hzBottomN = state.hotZoneBoost ? HOT_ZONE_BOTTOM_WIDE : HOT_ZONE_BOTTOM;
  for (const obj of state.objects) {
    if (!obj.isLifeUp && !obj.isLightning && !obj.isScoreStar && !obj.isShield && !obj.isMagnet && !obj.isReveal) obj.hintActive = obj.wrongAttempts >= state.hintThreshold;
    // Pulsar / Sonar Ping / Radar Sweep: reveal answer when lowest enters hot zone
    if (state.revealOnHotZone && !obj.isFreeze && !obj.isLifeUp && !obj.isBoss) {
      const inZone = obj.y >= window.innerHeight * hzTopN && obj.y <= window.innerHeight * hzBottomN;
      if (inZone && !obj._revealTimer) {
        obj._revealTimer = 1; // show for 1s
        obj._answerRevealed = true;
      }
    }
    if (obj._revealTimer > 0) {
      obj._revealTimer = Math.max(0, obj._revealTimer - dt);
      if (obj._revealTimer <= 0) obj._answerRevealed = false;
    }
    // Help reveal timer (set by useHelp)
    if (obj._helpRevealTimer > 0) {
      obj._helpRevealTimer = Math.max(0, obj._helpRevealTimer - dt);
      if (obj._helpRevealTimer <= 0) obj._answerRevealed = false;
    }
  }

  UI.updateHUD(state);
  refreshHelpBtn();

  // Update input placeholder — hint when a life-up is targeted
  const currentTarget = Targeting.getTarget();
  const inp = document.getElementById('answer-input');
  inp.placeholder = (currentTarget && currentTarget.isLifeUp)    ? I18n.t('lifeUpPlaceholder')
    : (currentTarget && currentTarget.isFreeze)    ? I18n.t('freezePlaceholder')
    : (currentTarget && currentTarget.isLightning) ? I18n.t('lightningPlaceholder')
    : (currentTarget && currentTarget.isScoreStar) ? I18n.t('scoreStarPlaceholder')
    : (currentTarget && currentTarget.isShield)    ? I18n.t('shieldPlaceholder')
    : (currentTarget && currentTarget.isMagnet)    ? I18n.t('magnetPlaceholder')
    : (currentTarget && currentTarget.isReveal)    ? I18n.t('revealPlaceholder')
    : I18n.t('answerPlaceholder');
}

// ---- RENDER ----
function render(ctx, w, h, t) {
  ctx.clearRect(0, 0, w, h);

  // Screen shake on hot streak
  const shaking = state.streakFlashTimer > 0;
  if (shaking) {
    const mag = state.streakFlashTimer > 0.35 ? 5 : 3;
    ctx.save();
    ctx.translate(
      (Math.random() - 0.5) * mag * 2,
      (Math.random() - 0.5) * mag * 2
    );
  }

  Themes.drawBackground(ctx, w, h, state.theme, t);

  // Hot zone band (behind objects so it doesn't obscure text)
  if (state.phase === 'PLAYING') {
    const hzTop    = state.hotZoneBoost ? HOT_ZONE_TOP_WIDE    : HOT_ZONE_TOP;
    const hzBottom = state.hotZoneBoost ? HOT_ZONE_BOTTOM_WIDE : HOT_ZONE_BOTTOM;
    drawHotZone(ctx, w, h, t, hzTop, hzBottom);
  }

  for (const obj of state.objects) {
    Themes.drawObject(ctx, obj, state.theme);
  }

  const target = Targeting.getTarget();

  // Progress bar on targeted question object
  if (target && !target.isFreeze && !target.isLifeUp && state.phase === 'PLAYING') {
    drawProgressBar(ctx, target, h);
  }

  const tx = target ? target.x + target.wobbleX : w / 2;
  const ty = target ? target.y : h / 2;
  Themes.drawWeapon(ctx, w, h, state.theme, tx, ty);

  if (state.freezeActive > 0) {
    Themes.drawFreezeOverlay(ctx, w, h, state.freezeActive);
  }
  if (state.magnetActive > 0) Themes.drawMagnetOverlay(ctx, w, h, state.magnetActive, state.theme);
  if (state.revealBonusActive > 0) Themes.drawRevealOverlay(ctx, w, h, state.revealBonusActive);
  if (state.shieldBonusActive || state.shieldCharges > 0) {
    Themes.drawShieldForceField(ctx, w, h, state.theme);
  }
  if (state.scoreStarActive) {
    const _tx = target ? target.x + (target.wobbleX || 0) : w / 2;
    const _ty = target ? target.y : h / 2;
    Themes.drawScoreStarAura(ctx, w, h, _tx, _ty, state.theme);
  }

  // Streak vignette (drawn inside the shake transform so it shakes too)
  if (state.streakFlashTimer > 0) {
    const intensity = state.streakFlashTimer / 0.5;
    drawStreakOverlay(ctx, w, h, state.streakFlashLevel, intensity);
  }

  if (shaking) ctx.restore();

  // Bonus activation animations (drawn outside shake, on top of everything)
  if (state.bonusFlash && state.bonusFlash.timer > 0) {
    Themes.drawBonusActivation(ctx, w, h, state.bonusFlash, state.theme);
  }

  // Confetti drawn on top, outside shake so it stays stable
  if (state.confetti.length > 0) {
    drawConfetti(ctx, state.confetti);
  }
}

// ---- ANSWER SUBMISSION ----
function submitAnswer() {
  if (state.phase !== 'PLAYING') return;
  hideSuggestion();
  const input = document.getElementById('answer-input');

  const target = Targeting.getTarget();
  if (!target) { input.value = ''; focusAnswerInput(); return; }

  const val = parseInt(input.value.trim());
  if (isNaN(val)) { focusAnswerInput(); return; }

  // Boss: cycles through multiple questions; shrinks on correct, grows on wrong
  if (target.isBoss) {
    state.totalAttempts++;
    state.attemptsThisLevel++;
    if (val === target.answer) {
      const particleColor = Themes.particleColorForTheme(state.theme);
      if (!state.tutorialMode) {
        Progress.recordAttempt(target.key, true, Date.now() - state.answerStartTime, { hintActive: !!target.hintActive });
      }
      state.wrongQueue = state.wrongQueue.filter(q => q.key !== target.key);
      state.totalCorrect++;
      state.correctThisLevel++;
      state.streak++;
      state.maxStreak = Math.max(state.maxStreak, state.streak);
      if ([3, 5, 8].includes(state.streak)) Audio.notifyStreak(state.streak);
      state.score += 15;
      target.questionIndex++;
      target.scale = Math.max(0.3, target.scale - 0.25); // shrink on each hit

      if (target.questionIndex >= target.questionsTotal) {
        // All questions answered — boss defeated
        Objects.triggerDestruction(target, particleColor, 40); // big explosion
        state.score += 30; // kill bonus
        state.bossesDefeated++;

        // Chain kill: destroy all nearby objects within 160px
        const killRadius = 160;
        for (const obj of state.objects) {
          if (obj === target || obj.dead || obj.dying || obj.destroyed) continue;
          const dx = obj.x - target.x;
          const dy = obj.y - target.y;
          if (Math.sqrt(dx * dx + dy * dy) <= killRadius) {
            Objects.triggerDestruction(obj, particleColor);
            state.score += 5;
          }
        }
        if (!state.tutorialMode) checkTableMastery();
        Audio.play('levelUp');
        syncMusicIntensity();
        vibrate([60, 80, 120]);
        state.confetti = spawnConfetti(window.innerWidth);

        // Level accuracy stars for this boss level
        const levelAcc = state.attemptsThisLevel > 0 ? state.correctThisLevel / state.attemptsThisLevel : 1;
        const bossStars = levelAcc >= 0.9 ? 3 : levelAcc >= 0.7 ? 2 : 1;
        state.levelStars.push(bossStars);

        if (state.tutorialMode) {
          UI.updateHUD(state);
          input.value = '';
          input.placeholder = I18n.t('answerPlaceholder');
          state.answerStartTime = Date.now();
          Targeting.syncTarget(state.objects);
          TutorialRun.onBossDefeated();
        } else if (state.runMode) {
          // Run mode has no end — automatically continue
          state.level++;
          state.correctThisLevel = 0;
          state.attemptsThisLevel = 0;
          state.levelTransitionTimer = 1.0;
          state.unpauseFreezeTimer = 1.5;
          if (!_typingMode) Voice.start();
          focusAnswerInput();
        } else {
          // Pause and let the player choose: keep going or finish
          Engine.pause();
          Voice.stop();
          UI.showBossVictory(bossStars, state.score, state.name, state.age,
            // Keep going
            () => {
              state.level++;
              state.correctThisLevel = 0;
              state.attemptsThisLevel = 0;
              state.levelTransitionTimer = 1.0;
              state.unpauseFreezeTimer = 1.5;
              Engine.resume();
              if (!_typingMode) Voice.start();
              focusAnswerInput();
            },
            // Finish
            () => {
              state.phase = 'ENDING';
              Engine.resume();
              setTimeout(() => endGame(), 800);
            }
          );
        }
      } else {
        // Advance to the next question
        const nextQ = target.questions[target.questionIndex];
        target.question = nextQ.display;
        target.answer = nextQ.answer;
        target.key = nextQ.key;
        target.wrongAttempts = 0;
        _lastSpokenTarget = null; // same object ref, so force TTS to re-speak
        if (!state.tutorialMode) checkTableMastery();
        Audio.play('levelUp');
        UI.showLevelUp(`${target.questionIndex}/${target.questionsTotal}`, null);
      }
      UI.updateHUD(state);
      input.value = '';
      input.placeholder = I18n.t('answerPlaceholder');
      state.answerStartTime = Date.now();
      Targeting.syncTarget(state.objects);
    } else {
      target.scale = Math.min(1.5, (target.scale ?? 1.0) + 0.15); // grow on wrong answer
      target.wrongAttempts = (target.wrongAttempts || 0) + 1;
      if (!state.tutorialMode) Progress.recordWrong(target.key);
      Audio.play('wrong');
      UI.shakeInput();
      UI.showTryAgain(target.question, target.answer);
      input.value = '';
      state.answerStartTime = Date.now();
    }
    focusAnswerInput();
    return;
  }

  // Freeze: correct answer slows all objects for 5s
  if (target.isFreeze) {
    if (val === target.answer) {
      Objects.triggerDestruction(target, '#00d4ff');
      state.freezeActive = 5;
      UI.updateHUD(state);
      Audio.play('freeze');
      Audio.setMusicState('freeze');
      input.value = '';
      input.placeholder = I18n.t('answerPlaceholder');
      Targeting.syncTarget(state.objects);
    } else {
      Audio.play('wrong');
      UI.shakeInput();
      UI.showTryAgain(target.question, target.answer);
      input.value = '';
    }
    focusAnswerInput();
    return;
  }

  // Life-up: correct answer earns a life, wrong answer just shakes
  if (target.isLifeUp) {
    if (val === target.answer) {
      Objects.triggerDestruction(target, '#2ed573');
      state.lives = Math.min(state.maxLives, state.lives + 1);
      state.bonusFlash = { type: 'lifeup', timer: 0.9, maxTimer: 0.9 };
      UI.updateHUD(state);
      // Animate the newly gained heart in the HUD
      const livesEl = document.getElementById('hud-lives');
      if (livesEl) {
        livesEl.classList.remove('life-gained');
        void livesEl.offsetWidth; // force reflow to restart animation
        livesEl.classList.add('life-gained');
        setTimeout(() => livesEl.classList.remove('life-gained'), 600);
      }
      Audio.play('levelUp');
      Audio.setMusicState('hopeful', syncMusicIntensity);
      input.value = '';
      input.placeholder = I18n.t('answerPlaceholder');
      Targeting.syncTarget(state.objects);
    } else {
      Audio.play('wrong');
      UI.shakeInput();
      UI.showTryAgain(target.question, target.answer);
      input.value = '';
    }
    focusAnswerInput();
    return;
  }

  if (target.isLightning) {
    if (val === target.answer) {
      Objects.triggerDestruction(target, '#ffe066');
      let cleared = 0;
      for (const obj of state.objects) {
        if (!obj.dead && !obj.dying && !obj.destroyed && !obj.isBoss &&
            !obj.isLifeUp && !obj.isFreeze && !obj.isLightning && !obj.isScoreStar &&
            !obj.isShield && !obj.isMagnet && !obj.isReveal) {
          Objects.triggerDestruction(obj, '#ffe066');
          cleared++;
        }
      }
      state.bonusFlash = { type: 'lightning', timer: 1.4, maxTimer: 1.4 };
      if (cleared > 0) UI.showLevelUp(`⚡ ${cleared} cleared!`, null);
      Audio.play('correct');
      input.value = ''; input.placeholder = I18n.t('answerPlaceholder');
      Targeting.syncTarget(state.objects);
    } else { Audio.play('wrong'); UI.shakeInput(); UI.showTryAgain(target.question, target.answer); input.value = ''; }
    focusAnswerInput(); return;
  }

  if (target.isScoreStar) {
    if (val === target.answer) {
      Objects.triggerDestruction(target, '#ffd700');
      state.scoreStarActive = true;
      state.bonusFlash = { type: 'scoreStar', timer: 0.65, maxTimer: 0.65 };
      UI.showLevelUp('🌟 Next answer ×3!', null);
      Audio.play('correct');
      input.value = ''; input.placeholder = I18n.t('answerPlaceholder');
      Targeting.syncTarget(state.objects);
    } else { Audio.play('wrong'); UI.shakeInput(); UI.showTryAgain(target.question, target.answer); input.value = ''; }
    focusAnswerInput(); return;
  }

  if (target.isShield) {
    if (val === target.answer) {
      Objects.triggerDestruction(target, '#a29bfe');
      state.shieldBonusActive = true;
      state.bonusFlash = { type: 'shield', timer: 0.7, maxTimer: 0.7 };
      UI.showLevelUp('🛡 Shield ready!', null);
      Audio.play('correct');
      input.value = ''; input.placeholder = I18n.t('answerPlaceholder');
      Targeting.syncTarget(state.objects);
    } else { Audio.play('wrong'); UI.shakeInput(); UI.showTryAgain(target.question, target.answer); input.value = ''; }
    focusAnswerInput(); return;
  }

  if (target.isMagnet) {
    if (val === target.answer) {
      Objects.triggerDestruction(target, '#fd79a8');
      state.magnetActive = 4.0;
      state.bonusFlash = { type: 'magnet', timer: 0.9, maxTimer: 0.9 };
      UI.showLevelUp('🧲 Magnet 4s!', null);
      Audio.play('freeze');
      input.value = ''; input.placeholder = I18n.t('answerPlaceholder');
      Targeting.syncTarget(state.objects);
    } else { Audio.play('wrong'); UI.shakeInput(); UI.showTryAgain(target.question, target.answer); input.value = ''; }
    focusAnswerInput(); return;
  }

  if (target.isReveal) {
    if (val === target.answer) {
      Objects.triggerDestruction(target, '#55efc4');
      state.revealBonusActive = 3.0;
      UI.showLevelUp('💡 Answers revealed 3s!', null);
      Audio.play('correct');
      input.value = ''; input.placeholder = I18n.t('answerPlaceholder');
      Targeting.syncTarget(state.objects);
    } else { Audio.play('wrong'); UI.shakeInput(); UI.showTryAgain(target.question, target.answer); input.value = ''; }
    focusAnswerInput(); return;
  }

  const elapsed = Date.now() - state.answerStartTime;
  state.totalAttempts++;
  state.attemptsThisLevel++;

  if (val === target.answer) {
    // Correct!
    const wasGracing = target.gracing;
    const prevMasteredLevel = state.tutorialMode ? 1 : (Progress.getStats()[target.key]?.masteredLevel ?? 0);

    state.totalCorrect++;
    state.streak++;
    state.maxStreak = Math.max(state.maxStreak, state.streak);
    state.correctThisLevel++;
    if ([3, 5, 8].includes(state.streak)) Audio.notifyStreak(state.streak);

    // Streak recharges help every 3 in a row
    if (state.streak % 3 === 0 && state.helpCooldown > 0) {
      state.helpCooldown = 0;
      refreshHelpBtn();
      UI.showLevelUp('💡 Help recharged!', null);
    }

    if (!state.tutorialMode) {
      Progress.recordAttempt(target.key, true, elapsed, { hintActive: !!target.hintActive });
      checkTableMastery();

      // Check for newly cleared tables (all facts answered correctly ≥1 time)
      const newBadges = Progress.getTableBadges(state.minTable, state.maxTable, state.operation);
      for (const table of newBadges) {
        if (!state.seenTablesAnnounced.has(table)) {
          state.seenTablesAnnounced.add(table);
          UI.showTableClearedBanner(table, state.operation);
        }
      }
    }

    // Graduate out of wrong queue if it was there
    state.wrongQueue = state.wrongQueue.filter(q => q.key !== target.key);

    // Scoring
    let pts = 10;
    if (elapsed < 3000) pts += 10;
    else if (elapsed < 6000) pts += 5;
    // Quick bonus (Warp Strike / Flash Current / Tailwind)
    // CONFLICT: Slow All + Quick Bonus → window halves from 1500ms to 750ms
    // ADJACENCY: Streak Boost + Quick Bonus neighbours → conflict suppressed, window stays 1500ms
    const adjStreakQuick = state.adjacencyBonuses && state.adjacencyBonuses.has('adj_streakQuick');
    const hasSynSlowQuick = state.speedMult < 1 && state.quickBonus && !adjStreakQuick;
    const quickWindow = hasSynSlowQuick ? 750 : 1500;
    if (state.quickBonus && elapsed < quickWindow) {
      // SYNERGY: Streak Boost + Quick Bonus → +30 instead of +20
      pts += (state.streakBoost && state.streak >= 3) ? 30 : 20;
    }
    // Streak multiplier — boosted by Solar Flare / Tidal Surge / Jet Stream
    let mult;
    if (state.streakBoost) {
      mult = state.streak >= 8 ? 4 : state.streak >= 5 ? 3 : state.streak >= 3 ? 2 : 1;
    } else {
      mult = state.streak >= 5 ? 2 : state.streak >= 3 ? 1.5 : 1;
    }
    pts = Math.round(pts * mult);
    // Hot zone bonus: ×1.5 (or ×2 with reveal synergy) if in the glowing band
    const canvasH = window.innerHeight;
    const hzTop    = state.hotZoneBoost ? HOT_ZONE_TOP_WIDE    : HOT_ZONE_TOP;
    const hzBottom = state.hotZoneBoost ? HOT_ZONE_BOTTOM_WIDE : HOT_ZONE_BOTTOM;
    const inHotZone = target.y >= canvasH * hzTop && target.y <= canvasH * hzBottom;
    const preHotZonePts = pts; // used by echoStreak
    if (inHotZone) {
      // SYNERGY: Hot Zone Boost + Reveal → ×2 (or ×2.5 when adjacent) when answer was revealed
      const adjHotReveal = state.adjacencyBonuses && state.adjacencyBonuses.has('adj_hotReveal');
      const hotMult = (state.revealOnHotZone && target._answerRevealed)
        ? (adjHotReveal ? 2.5 : 2) : 1.5;
      pts = Math.round(pts * hotMult);
      UI.showLevelUp(hotMult >= 2.5 ? '👁✦ Precision Lock+!' : hotMult >= 2 ? '👁 Precision Lock!' : '🔥 Hot zone!', null);
      // Streak Echo: hot-zone streak bonus echoes — streak mult applied a second time
      if (state.echoStreak) {
        const echoStreakMult = state.streakBoost
          ? (state.streak >= 8 ? 4 : state.streak >= 5 ? 3 : state.streak >= 3 ? 2 : 1)
          : (state.streak >= 5 ? 2 : state.streak >= 3 ? 1.5 : 1);
        const echoStreakBonus = Math.round(preHotZonePts * (echoStreakMult - 1));
        if (echoStreakBonus > 0) {
          pts += echoStreakBonus;
          UI.showLevelUp('💠 Streak Echo!', null);
          UI.flashUpgrade && UI.flashUpgrade('echoStreak');
        }
      }
      // Replay Hot Zone: apply the hot-zone multiplier a second time as a flat bonus
      if (state.replayHotZone) {
        pts += Math.round(preHotZonePts * (hotMult - 1));
        UI.showLevelUp('⭕ Zone Repeat!', null);
        UI.flashUpgrade && UI.flashUpgrade('replayHotZone');
      }
      // Score Mult Perfect: each hot-zone answer ramps the score multiplier
      if (state.perfectMultEnabled) {
        const perfCap = (state.hotZoneBoost &&
          state.activeUpgradeIds && state.activeUpgradeIds.includes('hotZoneBoost')) ? 12 : 8;
        state.scoreMultiplier = Math.min(state.scoreMultiplier * 1.2, perfCap);
      }
    }
    // Adjacency: Echo Streak + Quick Bonus neighbours → echo fires on quick answers too
    if (!inHotZone && state.echoStreak && state.quickBonus &&
        state.adjacencyBonuses && state.adjacencyBonuses.has('adj_echoQuick') &&
        elapsed < (hasSynSlowQuick ? 750 : 1500)) {
      const echoStreakMult = state.streakBoost
        ? (state.streak >= 8 ? 4 : state.streak >= 5 ? 3 : state.streak >= 3 ? 2 : 1)
        : (state.streak >= 5 ? 2 : state.streak >= 3 ? 1.5 : 1);
      const echoQuickBonus = Math.round(preHotZonePts * (echoStreakMult - 1) * 0.5);
      if (echoQuickBonus > 0) pts += echoQuickBonus;
    }
    // Lucky bonus (Nebula Luck / Treasure Drift / Lucky Wind)
    let _luckyFiredFromChain = false; // used by echoLucky negative synergy
    if (state.luckyBonus) {
      state.luckyBonusCounter = (state.luckyBonusCounter || 0) + 1;
      const luckyThreshold = state.luckyFrequency ? 3 : 5;
      if (state.luckyBonusCounter % luckyThreshold === 0) {
        const luckyMult = 2 + Math.floor(Math.random() * 4); // ×2–×5
        pts = Math.round(pts * luckyMult);
        UI.showLevelUp(`🍀 Lucky ×${luckyMult}!`, null);
        // Cascade Mult: each lucky permanently boosts score multiplier
        if (state.cascadeMultCount > 0) {
          const cascadeBonus = 0.3 * state.cascadeMultCount;
          // SYNERGY: cascadeMult + luckyBonus → double rate
          const hasSynCascade = state.activeUpgradeIds &&
            state.activeUpgradeIds.includes('cascadeMult') &&
            state.activeUpgradeIds.includes('luckyBonus');
          const finalCascade = hasSynCascade ? cascadeBonus * 2 : cascadeBonus;
          state.scoreMultiplier = (state.scoreMultiplier || 1) + finalCascade;
          // ADJACENCY: adj_cascadeLucky → +1 coin per 3rd lucky
          if (state.adjacencyBonuses && state.adjacencyBonuses.has('adj_cascadeLucky')) {
            state.runCoins = (state.runCoins || 0) + 1;
          }
          UI.flashUpgrade && UI.flashUpgrade('cascadeMult');
        }
        // Echo Lucky: fires a second time (synergy with luckyBonus uncaps range)
        if (state.echoLucky) {
          const hasEchoFull = state.activeUpgradeIds && state.activeUpgradeIds.includes('luckyBonus');
          const adjEcho = state.adjacencyBonuses && state.adjacencyBonuses.has('adj_echoLucky');
          const echoMax = (hasEchoFull || adjEcho) ? 4 : 2; // full range or capped ×3
          const echoMult = 2 + Math.floor(Math.random() * echoMax);
          pts = Math.round(pts * echoMult);
          UI.showLevelUp(`🔮 Echo Lucky ×${echoMult}!`, null);
          UI.flashUpgrade && UI.flashUpgrade('echoLucky');
        }
        // Replay Lucky: each stack fires one more lucky roll
        for (let r = 0; r < (state.replayLuckyCount || 0); r++) {
          const replayMult = 2 + Math.floor(Math.random() * 4);
          pts = Math.round(pts * replayMult);
          UI.showLevelUp(`🎲 Lucky Replay ×${replayMult}!`, null);
          UI.flashUpgrade && UI.flashUpgrade('replayLucky');
          // Echo fires on replay rolls too (synergy: replayLucky + echoLucky)
          if (state.echoLucky &&
              state.activeUpgradeIds && state.activeUpgradeIds.includes('replayLucky')) {
            const rEchoMult = 2 + Math.floor(Math.random() * 4);
            pts = Math.round(pts * rEchoMult);
          }
        }
      }
    }
    if (state.scoreStarActive) {
      pts *= 3;
      state.scoreStarActive = false;
      UI.showLevelUp('🌟 ×3!', null);
    }
    // Apply global score multiplier, then add to score
    const finalPts = Math.round(pts * (state.scoreMultiplier || 1));
    state.score += finalPts;
    // Synergy: Score Mult Large + Score Mult Small → +10 flat pts per answer
    if (state.activeUpgradeIds &&
        state.activeUpgradeIds.includes('scoreMultLarge') &&
        state.activeUpgradeIds.includes('scoreMultSmall')) {
      state.score += 10;
    }
    // Operation-specific boosters
    if (state.runMode) {
      const op = state.operation || 'multiply';
      if (state.multiBooster && op === 'multiply') {
        state.score += finalPts; // +×2 effective (double scoring)
        UI.flashUpgrade && UI.flashUpgrade('multiBooster');
      }
      if (state.divideBooster && op === 'divide') {
        state.score += finalPts;
        UI.flashUpgrade && UI.flashUpgrade('divideBooster');
      }
      if (state.addBooster && op === 'add') {
        state.score += finalPts;
        UI.flashUpgrade && UI.flashUpgrade('addBooster');
      }
      if (state.subtractBooster && op === 'subtract') {
        state.score += finalPts;
        UI.flashUpgrade && UI.flashUpgrade('subtractBooster');
      }
      // SYNERGY: addBooster + subtractBooster → +10 flat pts
      if (state.addBooster && state.subtractBooster &&
          (op === 'add' || op === 'subtract')) {
        state.score += 10;
      }
    }

    // Compound Growth: score multiplier ramps ×1.02 each answer
    if (state.compoundGrowth) {
      const growthRate = (state.adjacencyBonuses && state.adjacencyBonuses.has('adj_compoundReplay'))
        ? 1.03 : 1.02;
      // SYNERGY: compoundGrowth + scoreMultPerfect → ×1.04
      const hasSynCompound = state.activeUpgradeIds &&
        state.activeUpgradeIds.includes('compoundGrowth') &&
        state.activeUpgradeIds.includes('scoreMultPerfect');
      const finalGrowthRate = hasSynCompound ? 1.04 : growthRate;
      state.scoreMultiplier = (state.scoreMultiplier || 1) * finalGrowthRate;
      UI.flashUpgrade && UI.flashUpgrade('compoundGrowth');
    }

    // Replay Score: replay the full pts calculation N more times
    for (let r = 0; r < (state.replayCount || 0); r++) {
      state.score += finalPts;
      // Replay earns +1 coin per replay (synergy: replayScore + scoreMultSmall)
      if (state.runMode && state.activeUpgradeIds &&
          state.activeUpgradeIds.includes('scoreMultSmall')) {
        state.runCoins = (state.runCoins || 0) + 1;
      }
    }
    // Coin earning for correct answers (run mode only)
    // Earn coins for skilled play only — not every answer
    if (state.runMode) {
      let coinsEarned = 0;
      if (inHotZone) coinsEarned += 1;  // hot zone precision
      if (state.streak > 0 && state.streak % 5 === 0) coinsEarned += 2;  // streak milestones
      if (coinsEarned > 0) state.runCoins = (state.runCoins || 0) + coinsEarned;
    }

    // Destroy object
    const particleColor = Themes.particleColorForTheme(state.theme);
    Objects.triggerDestruction(target, particleColor);
    Audio.play('correct');
    vibrate(40);

    // Magnet splash: while magnet is active a correct answer chain-destroys all
    // nearby question objects — this is the payoff for pulling them together
    if (state.magnetActive > 0) {
      const splashRadius = 130;
      const splashObjs = state.objects.filter(obj =>
        obj !== target && !obj.dead && !obj.dying && !obj.destroyed && !obj.isBoss &&
        !obj.isFreeze && !obj.isLifeUp && !obj.isLightning && !obj.isScoreStar &&
        !obj.isShield && !obj.isMagnet && !obj.isReveal &&
        Math.hypot(obj.x - target.x, obj.y - target.y) <= splashRadius
      );
      if (splashObjs.length > 0) {
        splashObjs.forEach((obj, i) => {
          setTimeout(() => {
            if (!obj.dead && !obj.destroyed) {
              Objects.triggerDestruction(obj, particleColor);
              state.score += Math.round(pts * 0.4);
            }
          }, (i + 1) * 130);
        });
        UI.showLevelUp(`🧲 ${splashObjs.length} pulled in!`, null);
      }
    }

    // Encouragement banners
    if (wasGracing) UI.showSaved();
    else if (!state.tutorialMode && prevMasteredLevel === 0) UI.showFirstTime(target.question);

    // Chain-answer (Gravity Well / Riptide / Lightning Strike)
    if (state.chainAnswer) {
      let chainCount = 0;
      const chainKilledObjects = [];
      for (const obj of state.objects) {
        if (obj !== target && !obj.dying && !obj.dead && !obj.destroyed &&
            !obj.isFreeze && !obj.isLifeUp && !obj.isBoss &&
            !obj.isLightning && !obj.isScoreStar && !obj.isShield && !obj.isMagnet && !obj.isReveal &&
            obj.answer === target.answer) {
          Objects.triggerDestruction(obj, particleColor);
          state.score += Math.round(pts * 0.5);
          chainKilledObjects.push(obj);
          chainCount++;
        }
      }
      // Replay Chain: chain scoring fires a second time
      if (state.replayChain && chainCount > 0) {
        state.score += Math.round(pts * 0.5 * chainCount);
        UI.showLevelUp(`💥 Chain ×2!`, null);
        UI.flashUpgrade && UI.flashUpgrade('replayChain');
      }
      // Echo Chain: each chain kill also destroys its commutative mirror
      if (state.echoChain && chainKilledObjects.length > 0) {
        const adjEchoChain = state.adjacencyBonuses && state.adjacencyBonuses.has('adj_echoChain');
        for (const killed of chainKilledObjects) {
          const mirror = state.objects.find(o =>
            !o.dying && !o.dead && !o.destroyed && !o.isFreeze && !o.isLifeUp && !o.isBoss &&
            o !== target && o.a === killed.b && o.b === killed.a
          );
          if (mirror) {
            Objects.triggerDestruction(mirror, particleColor);
            // SYNERGY: echoChain + chain → echo kills also score 50%
            const echoChainPts = state.activeUpgradeIds && state.activeUpgradeIds.includes('chain')
              ? Math.round(pts * 0.5)
              : Math.round(pts * 0.25);
            state.score += echoChainPts;
            // ADJACENCY: adj_echoChain → echo chain kill counts as a lucky tick
            if (adjEchoChain && state.luckyBonus) {
              state.luckyBonusCounter = (state.luckyBonusCounter || 0) + 1;
              if (state.luckyBonusCounter % 5 === 0) {
                const luckyMult = 2 + Math.floor(Math.random() * 4);
                state.score += Math.round(pts * luckyMult * 0.5);
                UI.showLevelUp(`⛓🍀 Echo Lucky ×${luckyMult}!`, null);
              }
            }
          }
        }
      }
      // SYNERGY: Chain + Lucky — each chain kill counts toward the lucky counter
      // ADJACENCY: Chain + Lucky neighbours → each kill counts as 2 ticks
      // NEGATIVE SYNERGY: echoLucky + chain → echoLucky does not fire on chain-triggered lucky
      if (state.luckyBonus && chainCount > 0) {
        const chainLuckyTicks = (state.adjacencyBonuses && state.adjacencyBonuses.has('adj_chainLucky')) ? 2 : 1;
        for (let i = 0; i < chainCount; i++) {
          state.luckyBonusCounter = (state.luckyBonusCounter || 0) + chainLuckyTicks;
          if (state.luckyBonusCounter % 5 === 0) {
            const luckyMult = 2 + Math.floor(Math.random() * 4);
            state.score += Math.round(pts * luckyMult * 0.5);
            UI.showLevelUp(`⛓ Chain Lucky ×${luckyMult}!`, null);
            // SYNERGY: replayChain + chain → replay lucky counter advance
            if (state.replayChain) {
              const replayLuckyMult = 2 + Math.floor(Math.random() * 4);
              state.score += Math.round(pts * replayLuckyMult * 0.5);
            }
          }
        }
      }
    }
    // Commutative pair (Twin Stars / Echo Wave / Harmonic)
    if (state.commutativePair) {
      const mirror = state.objects.find(o =>
        !o.dying && !o.dead && !o.destroyed &&
        !o.isFreeze && !o.isLifeUp && !o.isBoss &&
        o !== target && o.a === target.b && o.b === target.a
      );
      if (mirror) {
        Objects.triggerDestruction(mirror, particleColor);
        state.score += Math.round(pts * 0.5);
      }
    }
    // Streak slow (Dark Matter / Abyss Pull / Storm Front)
    // CONFLICT: Streak Slow + Slow All → 2s instead of 5s
    // ADJACENCY: Streak Slow + Slow All neighbours → conflict offset: 2s → 3s
    if (state.streakSlow && state.streak > 0 && state.streak % 5 === 0) {
      let dur = (state.speedMult < 1) ? 2 : 5;
      if (dur === 2 && state.adjacencyBonuses && state.adjacencyBonuses.has('adj_slowSlow')) dur = 3;
      state.streakSlowTimer   = dur;
      state.streakSlowDuration = dur;
    }

    // Replay Streak: when a streak threshold is newly crossed, award the answer score again
    if (state.replayStreak) {
      const prevStreak = state.streak - 1;
      const thresholdCrossed =
        (state.streak >= 3 && prevStreak < 3) ||
        (state.streak >= 5 && prevStreak < 5) ||
        (state.streak >= 8 && prevStreak < 8);
      if (thresholdCrossed) {
        state.score += finalPts;
        UI.showLevelUp('🚀 Streak Surge!', null);
        UI.flashUpgrade && UI.flashUpgrade('replayStreak');
      }
    }

    // Streak flash at ×1.5 (streak 3+) and ×2 (streak 5+)
    if (state.streak >= 3) {
      state.streakFlashTimer = 0.5;
      state.streakFlashLevel = state.streak;
    }

    UI.showCombo(state.streak);
    if (state.tutorialMode) TutorialRun.onRegularCorrect();

    // Level up check
    if (state.correctThisLevel >= CORRECT_PER_LEVEL) {
      // Award stars based on level accuracy (correct / attempts this level)
      const levelAcc = state.attemptsThisLevel > 0 ? state.correctThisLevel / state.attemptsThisLevel : 1;
      const stars = levelAcc >= 0.9 ? 3 : levelAcc >= 0.7 ? 2 : 1;
      state.levelStars.push(stars);

      const prevLevel = state.level;
      state.level++;
      state.correctThisLevel = 0;
      state.attemptsThisLevel = 0;
      Audio.play('levelUp');
      Audio.notifyLevel(state.level);
      vibrate([40, 60, 80]);
      state.levelTransitionTimer = 1.0;
      state.confetti = spawnConfetti(window.innerWidth);
      UI.showLevelUp(state.level, stars);
      if (state.tutorialMode) TutorialRun.onLevelChanged(state.level);

      // Coin award for level stars (run mode)
      if (state.runMode) {
        const starCoins = [0, 0, 1, 2][stars] || 0;
        if (starCoins > 0) state.runCoins = (state.runCoins || 0) + starCoins;
      }

      // Run mode: every 3 levels — pause, check ante, open shop
      if (state.runMode && prevLevel % 3 === 0) {
        // Ante check: did player meet the score target?
        const anteTargetScore = anteTarget(state.currentAnte);
        const scoreGained = state.score - state.anteStartScore;
        if (scoreGained < anteTargetScore) {
          // Missed ante — run ends
          state.phase = 'ENDING';
          setTimeout(() => endGame(), 1400);
        } else {
          // Advance ante — award coins, open shop
          state.currentAnte++;
          state.anteStartScore = state.score;
          const anteCoins = 5 + (state.bonusCoinPerAnte || 0);
          state.runCoins = (state.runCoins || 0) + anteCoins;
          // Adjacency: adj_multStack → +1 coin when both multipliers adjacent
          if (state.adjacencyBonuses && state.adjacencyBonuses.has('adj_multStack')) {
            state.runCoins += 1;
          }
          Engine.pause();
          const rp = Progress.getRunProgress();
          const unlockedIds = rp.unlockedUpgrades || [];
          const shopOptions = drawShopOptions(3, unlockedIds, state.activeUpgradeIds);
          const isFreeStarter = (state.currentAnte === 2); // free pick on first ante
          UI.showShop(shopOptions, state.runCoins, state.theme, state.activeUpgrades, isFreeStarter, state.maxUpgradeSlots || 4, (result) => {
            // Apply reordered bar (newOrder already includes bought items from shop UI)
            state.activeUpgrades   = result.newOrder;
            state.activeUpgradeIds = state.activeUpgrades.map(u => u.id);
            // Reverse effects of sold upgrades
            for (const sold of (result.sold || [])) {
              unapplyUpgrade(sold, state);
            }
            // Apply effects of newly bought upgrades
            const boughtItems = result.boughtList || (result.bought ? [result.bought] : []);
            for (const bought of boughtItems) {
              bought.apply(state);
              if (state.speedMult !== undefined) state.speedMult = Math.max(0.4, state.speedMult);
            }
            state.shopBuysThisRun = (state.shopBuysThisRun || 0) + boughtItems.length;
            if (boughtItems.length > 0) {
              state.activeUpgradeIds = state.activeUpgrades.map(u => u.id);
              Progress.unlockNextUpgrade(state.activeUpgradeIds);
            }
            state.runCoins = result.newCoins;
            // Recompute adjacency bonuses with updated order
            state.adjacencyBonuses = getAdjacencyBonuses(state.activeUpgrades);
            Engine.resume();
            state.unpauseFreezeTimer = 1.0;
            if (!_typingMode) Voice.start();
            focusAnswerInput();
          });
        }
      }
    }

    input.value = '';
    state.answerStartTime = Date.now();
    Targeting.syncTarget(state.objects);

  } else {
    // Wrong — add to this session's wrong queue if not already there
    target.wrongAttempts = (target.wrongAttempts || 0) + 1;
    state.streak = 0;
    UI.showCombo(0);
    if (!state.tutorialMode) Progress.recordAttempt(target.key, false, elapsed);
    if (!state.wrongQueue.find(q => q.key === target.key)) {
      state.wrongQueue.push({ key: target.key, display: target.question, answer: target.answer });
    }
    Audio.play('wrong');
    vibrate([30, 50, 30]);
    UI.shakeInput();
    UI.showTryAgain(target.question, target.answer);
    input.value = '';
    state.answerStartTime = Date.now();
  }

  focusAnswerInput();
}

// ---- GAME OVER ----
function endGame() {
  const wasTutorialRun = state.tutorialMode;
  const tutorialTriggerWord = tutorialState?.triggerWord || '';
  Audio.stopMusic();
  Engine.stop();
  Voice.stop();
  clearTimeout(_speakTimer);
  clearTimeout(_ttsSafetyTimer);
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  _lastSpokenTarget = null;
  state.phase = 'GAME_OVER';
  if (wasTutorialRun) TutorialRun.stop();

  const accuracy = state.totalAttempts > 0 ? state.totalCorrect / state.totalAttempts : 0;
  const session = {
    name: state.name,
    age:  state.age,
    score: state.score,
    level: state.level,
    accuracy,
    theme: state.theme,
    levelStars: state.levelStars,
    maxStreak: state.maxStreak || 0,
    bossesDefeated: state.bossesDefeated || 0,
    missCount: state.missedList.length,
    masteryWin: state.masteryWin || false,
    isChallenge: state.isChallenge || false,
    challengerScore: state.challengerScore || null,
  };
  const newAchievements = wasTutorialRun ? [] : Progress.saveSession(session);
  if (!wasTutorialRun && state.isDaily) {
    Progress.saveDailyResult({ score: state.score, level: state.level, accuracy });
    session.dailyBadge = true;
  }

  // Run mode: save result and check unlocks
  let runData = null;
  if (!wasTutorialRun && state.runMode) {
    const prevRunProgress = Progress.getRunProgress();
    const prevBest = prevRunProgress.bestAnte || 0;
    Progress.saveRunResult({
      ante: state.currentAnte,
      upgrades: state.activeUpgradeIds,
      bossesDefeated: state.bossesDefeated,
      maxStreak: state.maxStreak,
      coinsEarned: state.runCoins || 0,
      shopBuysThisRun: state.shopBuysThisRun || 0,
    });
    const newUnlocks = Progress.checkRunUnlocks();
    runData = {
      runMode: true,
      ante: state.currentAnte,
      isNewBest: state.currentAnte > prevBest,
      activeUpgrades: state.activeUpgrades,
      newUnlocks,
      theme: state.theme,
    };
  }

  const masteryData = wasTutorialRun ? null : Progress.getMastery(state.minTable, state.maxTable, state.operation);

  // Build challenge link for sharing
  if (!wasTutorialRun) {
    const challengePayload = {
      op: state.operations.length === 1 ? state.operations[0] : 'mixed',
      ops: state.operations,
      min: state.minTable, max: state.maxTable,
      diff: state.difficulty,
      seed: state.seed,
      score: state.score,
      v: 1,
    };
    const challengeUrl = `${location.origin}${location.pathname}?c=${encodeURIComponent(btoa(JSON.stringify(challengePayload)))}`;
    session.challengeUrl  = challengeUrl;
    session.isChallenge   = state.isChallenge;
    session.challengerScore = state.challengerScore;
  }

  const lastGameSettings = {
    name: state.name, age: state.age, theme: state.theme,
    operations: state.operations, operation: state.operations[0],
    minTable: state.minTable, maxTable: state.maxTable,
    difficulty: state.difficulty, hintThreshold: state.hintThreshold,
    practiceMode: state.practiceMode, zehner: state.zehner,
    halbschriftlich: state.halbschriftlich, addSubRange: state.addSubRange,
    tutorialMode: wasTutorialRun, seed: state.seed, triggerWord: tutorialTriggerWord,
  };

  UI.showGameOver(
    session,
    state.missedList,
    newAchievements,
    masteryData,
    () => { window._challengeConfig = null; startGame(lastGameSettings); },
    () => { window._challengeConfig = null; UI.showScreen('onboarding'); },
    () => UI.showLeaderboard(() => UI.showScreen('gameover')),
    runData
  );
  // Special confetti burst for the Klasse 3 Komplett milestone
  if (!wasTutorialRun && newAchievements.some(a => a.id === 'klasse3_komplett')) {
    state.confetti = spawnConfetti(window.innerWidth);
  }
}
window.__endGame = endGame;
window.__Voice = Voice;
window.__Targeting = Targeting;
