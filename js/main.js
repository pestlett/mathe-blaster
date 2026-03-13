// main.js - game state machine & entry point

function isMobile() {
  return navigator.maxTouchPoints > 0;
}

function focusAnswerInput() {
  if (!isMobile()) document.getElementById('answer-input').focus();
}

const DIFFICULTY = {
  // baseSpeed reduced ~25% to give voice-input users time to react.
  // Speed still ramps per level so it gets challenging quickly.
  easy:   { maxObjects: 2, baseSpeed: 36,  maxSpeed: 130 },
  medium: { maxObjects: 3, baseSpeed: 52,  maxSpeed: 190 },
  hard:   { maxObjects: 4, baseSpeed: 72,  maxSpeed: 260 }
};
const MAX_LIVES = 3;
const CORRECT_PER_LEVEL = 10;
const SPEED_INCREASE_PER_LEVEL = 0.18;

// ---- Game state ----
let state = {
  phase: 'ONBOARDING', // ONBOARDING | PLAYING | GAME_OVER
  voiceActive: false,  // true while SpeechRecognition is actively listening
  name: 'Player',
  age: null,
  theme: 'space',
  minTable: 1,
  maxTable: 10,
  difficulty: 'medium',
  practiceMode: false, // no lives lost, no game over
  score: 0,
  level: 1,
  lives: MAX_LIVES,
  maxLives: MAX_LIVES,
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
  answerStartTime: 0,
  hintThreshold: 3, // wrong attempts before dot-grid hint appears
};

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

function drawHotZone(ctx, w, h, t) {
  const top    = h * HOT_ZONE_TOP;
  const bottom = h * HOT_ZONE_BOTTOM;
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
  const target = Targeting.getTarget();
  Voice.setActiveQuestion(target?.key || '');
  if (target && target !== _lastSpokenTarget) {
    _lastSpokenTarget = target;
    speakQuestion(target.question);
  }
}

// ---- Per-table mastery announcements ----
// Checks if any table in the current range has had all its facts mastered
// for the first time this session. Shows a banner and confetti but does NOT
// end the game. When every table in the range is done, extended tables are
// unlocked.
function checkTableMastery() {
  if (state.phase !== 'PLAYING') return;
  const { facts } = Progress.getMastery(state.minTable, state.maxTable);
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
    UI.showLevelUp(I18n.t('tableMastered', { table: a }), null);
  }

  // Unlock extended tables when every table in range is done
  if (allDone && aValues.length > 0) {
    Progress.unlockExtendedTables();
    state.masteryWin = true; // flag for game-over summary only
  }
}

// ---- Bootstrap ----
window.addEventListener('DOMContentLoaded', () => {
  Engine.init(update, render);

  UI.initOnboarding(startGame);

  const answerInput = document.getElementById('answer-input');
  const btnFire = document.getElementById('btn-fire');

  document.addEventListener('keydown', e => {
    if (state.phase !== 'PLAYING') return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); hideSuggestion(); Targeting.moveLeft(state.objects); }
    if (e.key === 'ArrowRight') { e.preventDefault(); hideSuggestion(); Targeting.moveRight(state.objects); }
    if (e.key === 'Enter') { e.preventDefault(); submitAnswer(); }
    // Keep input focused on desktop
    if (!['ArrowLeft','ArrowRight','Enter','Tab'].includes(e.key)) {
      focusAnswerInput();
    }
  });

  answerInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); submitAnswer(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); hideSuggestion(); Targeting.moveLeft(state.objects); }
    if (e.key === 'ArrowRight') { e.preventDefault(); hideSuggestion(); Targeting.moveRight(state.objects); }
  });

  btnFire.addEventListener('click', submitAnswer);

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
  btnPause.addEventListener('click', togglePause);
  btnResume.addEventListener('click', togglePause);
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
      if (btnMic.classList.contains('denied')) return;
      if (btnMic.classList.contains('listening')) {
        Voice.stop();
      } else {
        Voice.start();
      }
    });
  }
});

function togglePause() {
  if (state.phase !== 'PLAYING' && !Engine.isPaused()) return;
  if (Engine.isPaused()) {
    Engine.resume();
    Voice.start();                       // mic activates immediately
    state.unpauseFreezeTimer = 1.5;      // objects hold for 1.5s so player can orient
    document.getElementById('pause-overlay').classList.remove('visible');
    focusAnswerInput();
  } else {
    Engine.pause();
    Voice.stop();
    document.getElementById('pause-overlay').classList.add('visible');
  }
}

function startGame(settings) {
  Progress.setPlayer(settings.name, settings.age);
  state.name = settings.name;
  state.age = settings.age;
  state.theme = settings.theme;
  state.minTable = settings.minTable;
  state.maxTable = settings.maxTable;
  state.difficulty = settings.difficulty;
  state.hintThreshold = settings.hintThreshold || 3;
  state.practiceMode = settings.practiceMode || false;
  state.isDaily = settings.isDaily || false;
  state.score = 0;
  state.level = 1;
  state.lives = MAX_LIVES;
  state.maxLives = MAX_LIVES;
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
  state.levelTransitionTimer = 0;
  state.unpauseFreezeTimer = 0;
  state.ttsFreezeActive = false;
  state.voiceActive = false;
  state.masteryWin = false;
  state.masteredTablesAnnounced = new Set();
  state.confetti = [];
  state.streakFlashTimer = 0;
  state.streakFlashLevel = 0;
  state.answerStartTime = Date.now();
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

  document.getElementById('answer-input').value = '';
  hideSuggestion();
  UI.updateHUD(state);
  UI.showScreen('game');
  Engine.start();
  Voice.start();
}


// ---- UPDATE ----
function update(dt) {
  if (state.phase !== 'PLAYING' && state.phase !== 'ENDING') return;

  // Tick down active freeze
  if (state.freezeActive > 0) {
    state.freezeActive = Math.max(0, state.freezeActive - dt);
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

  // Update confetti particles
  if (state.confetti.length > 0) {
    updateConfetti(state.confetti, dt);
    state.confetti = state.confetti.filter(p => p.life > 0);
  }

  // Speed multiplier: 0 during level transition, TTS, or unpause grace; 0.25× during freeze item
  const levelFreezing   = state.levelTransitionTimer > 0;
  const ttsFreezing     = state.ttsFreezeActive;
  const unpauseFreezing = state.unpauseFreezeTimer > 0;
  const freezeMult      = (levelFreezing || ttsFreezing || unpauseFreezing) ? 0 : (state.freezeActive > 0 ? 0.25 : 1);

  // Update all objects (keep animating during ENDING)
  for (const obj of state.objects) {
    // Apply freeze slowdown to non-special objects
    const effectiveDt = (obj.isFreeze || obj.isLifeUp) ? dt : dt * freezeMult;
    Objects.update(obj, effectiveDt, window.innerHeight - 148);

    // Detect first frame of dying (object hit bottom)
    if (obj.dying && !obj._dieHandled) {
      obj._dieHandled = true;
      if (obj.isLifeUp) {
        // Life-up missed — just disappears, no penalty
      } else {
        // Crash counts as a wrong attempt — lowers mastery for this fact
        if (!obj.isFreeze) {
          Progress.recordAttempt(obj.key, false, Date.now() - obj.spawnTime);
        }
        if (!state.practiceMode) {
          state.lives = Math.max(0, state.lives - 1);
          state.missedList.push({ question: obj.question, answer: obj.answer });
          UI.showMissFlash(obj.question, obj.answer);
          Audio.play('lifeLost');
          vibrate(200);
          UI.updateHUD(state);
          if (state.lives <= 0 && state.phase === 'PLAYING') {
            state.phase = 'ENDING';
            setTimeout(() => endGame(), 1400);
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
  const maxObj = diff.maxObjects + (state.level > 5 ? 1 : 0) - (isPhoneVoice ? 1 : 0);
  const rawSpeed = diff.baseSpeed * Math.pow(1 + SPEED_INCREASE_PER_LEVEL, state.level - 1);
  const phoneVoiceMult = isPhoneVoice ? 0.65 : 1;
  const speed = Math.min(diff.maxSpeed * phoneVoiceMult, rawSpeed * phoneVoiceMult);

  // Boss round: spawn one giant boss on levels that are multiples of 5
  const hasBoss = state.objects.some(o => o.isBoss && !o.dead && !o.dying && !o.destroyed);
  const isBossLevel = state.level > 1 && state.level % 5 === 0 && state.correctThisLevel === 0 && !state._bossSpawnedThisLevel;
  if (isBossLevel && !hasBoss) {
    state._bossSpawnedThisLevel = true;
    const stats = Progress.getStats();
    const q = Questions.pick(state.minTable, state.maxTable, stats, [], state.wrongQueue);
    state.objects.push(Objects.createBoss(q, window.innerWidth, window.innerHeight, speed));
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

  // Spawn freeze item — at most one on screen, every ~30s
  const hasFreeze = state.objects.some(o => o.isFreeze && !o.dead && !o.dying && !o.destroyed);
  if (!hasFreeze && state.freezeActive <= 0) {
    state.freezeTimer += dt;
    if (state.freezeTimer >= 30) {
      state.freezeTimer = 0;
      const stats = Progress.getStats();
      const excludeAnswers = state.objects.filter(o => !o.dead).map(o => o.answer);
      const q = Questions.pick(state.minTable, state.maxTable, stats, excludeAnswers, state.wrongQueue);
      const liveX = state.objects.filter(o => !o.dead).map(o => o.x);
      const fz = Objects.createFreeze(q, window.innerWidth, speed, liveX);
      if (fz) state.objects.push(fz); else state.freezeTimer = 28; // retry in 2s
    }
  } else if (hasFreeze) {
    state.freezeTimer = 0;
  }

  // Spawn life-up item — at most one on screen, only when injured, every ~20s
  const hasLifeUp = state.objects.some(o => o.isLifeUp && !o.dead && !o.dying && !o.destroyed);
  if (!hasLifeUp && state.lives < MAX_LIVES) {
    state.lifeUpTimer += dt;
    if (state.lifeUpTimer >= 20) {
      state.lifeUpTimer = 0;
      const stats = Progress.getStats();
      const excludeAnswers = state.objects.filter(o => !o.dead).map(o => o.answer);
      const q = Questions.pick(state.minTable, state.maxTable, stats, excludeAnswers, state.wrongQueue);
      const liveX = state.objects.filter(o => !o.dead).map(o => o.x);
      const lu = Objects.createLifeUp(q, window.innerWidth, speed, liveX);
      if (lu) state.objects.push(lu); else state.lifeUpTimer = 18; // retry in 2s
    }
  } else {
    state.lifeUpTimer = 0; // reset timer when at full health or one already active
  }

  // Spawn new question objects (skip during level transition or TTS)
  const aliveCount = state.objects.filter(o => !o.dead && !o.dying && !o.destroyed && !o.isLifeUp && !o.isFreeze).length;
  if (!levelFreezing && !ttsFreezing && !unpauseFreezing && aliveCount < maxObj) {
    const stats = Progress.getStats();
    const excludeAnswers = state.objects.filter(o => !o.dead).map(o => o.answer);
    const q = Questions.pick(state.minTable, state.maxTable, stats, excludeAnswers, state.wrongQueue);
    const liveX = state.objects.filter(o => !o.dead).map(o => o.x);
    const obj = Objects.create(q, window.innerWidth, window.innerHeight, speed, liveX);
    if (obj) state.objects.push(obj);
    // else: no room yet — retry happens automatically next frame
  }

  // Remove fully dead objects
  state.objects = state.objects.filter(o => !o.dead);

  // Sync targeting
  Targeting.syncTarget(state.objects);
  maybeSpeak();

  // Update hint visibility
  for (const obj of state.objects) {
    if (!obj.isLifeUp) obj.hintActive = obj.wrongAttempts >= state.hintThreshold;
  }

  UI.updateHUD(state);

  // Update input placeholder — hint when a life-up is targeted
  const currentTarget = Targeting.getTarget();
  const inp = document.getElementById('answer-input');
  inp.placeholder = (currentTarget && currentTarget.isLifeUp) ? I18n.t('lifeUpPlaceholder')
    : (currentTarget && currentTarget.isFreeze) ? I18n.t('freezePlaceholder')
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
  if (state.phase === 'PLAYING') drawHotZone(ctx, w, h, t);

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

  // Streak vignette (drawn inside the shake transform so it shakes too)
  if (state.streakFlashTimer > 0) {
    const intensity = state.streakFlashTimer / 0.5;
    drawStreakOverlay(ctx, w, h, state.streakFlashLevel, intensity);
  }

  if (shaking) ctx.restore();

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

  // Boss: correct answer awards 50 bonus pts and ends boss round
  if (target.isBoss) {
    if (val === target.answer) {
      const particleColor = Themes.particleColorForTheme(state.theme);
      Objects.triggerDestruction(target, particleColor);
      state.score += 50;
      state.totalCorrect++;
      state.streak++;
      state.maxStreak = Math.max(state.maxStreak, state.streak);
      state.bossesDefeated++;
      Progress.recordAttempt(target.key, true, Date.now() - state.answerStartTime);
      state.wrongQueue = state.wrongQueue.filter(q => q.key !== target.key);
      checkTableMastery();
      Audio.play('levelUp');
      UI.showLevelUp('Boss!', null);
      UI.updateHUD(state);
      input.value = '';
      input.placeholder = I18n.t('answerPlaceholder');
      state.answerStartTime = Date.now();
      Targeting.syncTarget(state.objects);
    } else {
      target.wrongAttempts = (target.wrongAttempts || 0) + 1;
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
      state.lives = Math.min(MAX_LIVES, state.lives + 1);
      UI.updateHUD(state);
      Audio.play('levelUp');
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

  const elapsed = Date.now() - state.answerStartTime;
  state.totalAttempts++;
  state.attemptsThisLevel++;

  if (val === target.answer) {
    // Correct!
    state.totalCorrect++;
    state.streak++;
    state.maxStreak = Math.max(state.maxStreak, state.streak);
    state.correctThisLevel++;

    Progress.recordAttempt(target.key, true, elapsed);
    checkTableMastery();

    // Graduate out of wrong queue if it was there
    state.wrongQueue = state.wrongQueue.filter(q => q.key !== target.key);

    // Scoring
    let pts = 10;
    if (elapsed < 3000) pts += 10;
    else if (elapsed < 6000) pts += 5;
    const mult = state.streak >= 5 ? 2 : state.streak >= 3 ? 1.5 : 1;
    pts = Math.round(pts * mult);
    // Hot zone bonus: ×1.5 if answered while object is in the glowing band
    const canvasH = window.innerHeight;
    const inHotZone = target.y >= canvasH * HOT_ZONE_TOP && target.y <= canvasH * HOT_ZONE_BOTTOM;
    if (inHotZone) {
      pts = Math.round(pts * 1.5);
      UI.showLevelUp('🔥 Hot zone!', null);
    }
    state.score += pts;

    // Destroy object
    const particleColor = Themes.particleColorForTheme(state.theme);
    Objects.triggerDestruction(target, particleColor);
    Audio.play('correct');
    vibrate(40);

    // Streak flash at ×1.5 (streak 3+) and ×2 (streak 5+)
    if (state.streak >= 3) {
      state.streakFlashTimer = 0.5;
      state.streakFlashLevel = state.streak;
    }

    UI.showCombo(state.streak);

    // Level up check
    if (state.correctThisLevel >= CORRECT_PER_LEVEL) {
      // Award stars based on level accuracy (correct / attempts this level)
      const levelAcc = state.attemptsThisLevel > 0 ? state.correctThisLevel / state.attemptsThisLevel : 1;
      const stars = levelAcc >= 0.9 ? 3 : levelAcc >= 0.7 ? 2 : 1;
      state.levelStars.push(stars);

      state.level++;
      state.correctThisLevel = 0;
      state.attemptsThisLevel = 0;
      Audio.play('levelUp');
      vibrate([40, 60, 80]);
      state.levelTransitionTimer = 1.0;
      state.confetti = spawnConfetti(window.innerWidth);
      UI.showLevelUp(state.level, stars);
    }

    input.value = '';
    state.answerStartTime = Date.now();
    Targeting.syncTarget(state.objects);

  } else {
    // Wrong — add to this session's wrong queue if not already there
    target.wrongAttempts = (target.wrongAttempts || 0) + 1;
    state.streak = 0;
    UI.showCombo(0);
    Progress.recordAttempt(target.key, false, elapsed);
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
  Audio.stopMusic();
  Engine.stop();
  Voice.stop();
  clearTimeout(_speakTimer);
  clearTimeout(_ttsSafetyTimer);
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  _lastSpokenTarget = null;
  state.phase = 'GAME_OVER';

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
  };
  const newAchievements = Progress.saveSession(session);
  if (state.isDaily) {
    Progress.saveDailyResult({ score: state.score, level: state.level, accuracy });
    session.dailyBadge = true;
  }
  const masteryData = Progress.getMastery(state.minTable, state.maxTable);

  UI.showGameOver(
    session,
    state.missedList,
    newAchievements,
    masteryData,
    () => { UI.showScreen('onboarding'); },
    () => UI.showLeaderboard(() => UI.showScreen('onboarding'))
  );
}
