// main.js - game state machine & entry point

function isMobile() {
  return navigator.maxTouchPoints > 0;
}

function focusAnswerInput() {
  if (!isMobile()) document.getElementById('answer-input').focus();
}

const DIFFICULTY = {
  easy:   { maxObjects: 2, baseSpeed: 48,  maxSpeed: 160 },
  medium: { maxObjects: 3, baseSpeed: 70,  maxSpeed: 240 },
  hard:   { maxObjects: 4, baseSpeed: 96,  maxSpeed: 320 }
};
const MAX_LIVES = 3;
const CORRECT_PER_LEVEL = 10;
const SPEED_INCREASE_PER_LEVEL = 0.18;

// ---- Game state ----
let state = {
  phase: 'ONBOARDING', // ONBOARDING | PLAYING | GAME_OVER
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

// ---- Bootstrap ----
window.addEventListener('DOMContentLoaded', () => {
  Engine.init(update, render);

  UI.initOnboarding(startGame);

  const answerInput = document.getElementById('answer-input');
  const btnFire = document.getElementById('btn-fire');

  document.addEventListener('keydown', e => {
    if (state.phase !== 'PLAYING') return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); Targeting.moveLeft(state.objects); }
    if (e.key === 'ArrowRight') { e.preventDefault(); Targeting.moveRight(state.objects); }
    if (e.key === 'Enter') { e.preventDefault(); submitAnswer(); }
    // Keep input focused on desktop
    if (!['ArrowLeft','ArrowRight','Enter','Tab'].includes(e.key)) {
      focusAnswerInput();
    }
  });

  answerInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); submitAnswer(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); Targeting.moveLeft(state.objects); }
    if (e.key === 'ArrowRight') { e.preventDefault(); Targeting.moveRight(state.objects); }
  });

  btnFire.addEventListener('click', submitAnswer);

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
  if (!Voice.supported) {
    btnMic.style.display = 'none';
  } else {
    Voice.init({
      onNext:     () => { if (state.phase === 'PLAYING') Targeting.moveRight(state.objects); },
      onPrevious: () => { if (state.phase === 'PLAYING') Targeting.moveLeft(state.objects); },
      onClear:    () => { if (state.phase === 'PLAYING') answerInput.value = ''; },
      // Interim: show number in input field as user speaks (live feedback)
      onInterim:  (n) => { if (state.phase === 'PLAYING') answerInput.value = String(n); },
      // Fire: submit whatever is currently in the input box
      onFire:     () => { if (state.phase === 'PLAYING') submitAnswer(); },
      onNumber:   (n) => {
        if (state.phase !== 'PLAYING') return;
        answerInput.value = String(n);
        submitAnswer();
      },
      onStatusChange: (active, reason) => {
        btnMic.classList.toggle('listening', active);
        btnMic.classList.toggle('denied', reason === 'denied');
        if (!active) btnMic.classList.remove('sound-detected');
      },
      onSoundStart: () => { btnMic.classList.add('sound-detected'); },
      onSoundEnd:   () => { btnMic.classList.remove('sound-detected'); },
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
    Voice.start();
    document.getElementById('pause-overlay').classList.remove('visible');
    focusAnswerInput();
  } else {
    Engine.pause();
    Voice.stop();
    document.getElementById('pause-overlay').classList.add('visible');
  }
}

function startGame(settings) {
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
  state.answerStartTime = Date.now();
  state.phase = 'PLAYING';

  Targeting.reset();
  Themes.init(state.theme, window.innerWidth, window.innerHeight);
  Audio.setTheme(state.theme);
  Audio.playMusic(state.theme);

  document.getElementById('answer-input').value = '';
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

  // Speed multiplier: 0.25× while freeze is active
  const freezeMult = state.freezeActive > 0 ? 0.25 : 1;

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
      } else if (!state.practiceMode) {
        state.lives = Math.max(0, state.lives - 1);
        state.missedList.push({ question: obj.question, answer: obj.answer });
        UI.showMissFlash(obj.question, obj.answer);
        Audio.play('lifeLost');
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

  if (state.phase === 'ENDING') {
    state.objects = state.objects.filter(o => !o.dead);
    return;
  }

  const diff = DIFFICULTY[state.difficulty];
  const maxObj = diff.maxObjects + (state.level > 5 ? 1 : 0);
  const speed = Math.min(diff.maxSpeed, diff.baseSpeed * Math.pow(1 + SPEED_INCREASE_PER_LEVEL, state.level - 1));

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
      state.objects.push(Objects.createFreeze(q, window.innerWidth, speed, liveX));
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
      state.objects.push(Objects.createLifeUp(q, window.innerWidth, speed, liveX));
    }
  } else {
    state.lifeUpTimer = 0; // reset timer when at full health or one already active
  }

  // Spawn new question objects
  const aliveCount = state.objects.filter(o => !o.dead && !o.dying && !o.destroyed && !o.isLifeUp && !o.isFreeze).length;
  if (aliveCount < maxObj) {
    const stats = Progress.getStats();
    const excludeAnswers = state.objects.filter(o => !o.dead).map(o => o.answer);
    const q = Questions.pick(state.minTable, state.maxTable, stats, excludeAnswers, state.wrongQueue);
    const liveX = state.objects.filter(o => !o.dead).map(o => o.x);
    state.objects.push(Objects.create(q, window.innerWidth, window.innerHeight, speed, liveX));
  }

  // Remove fully dead objects
  state.objects = state.objects.filter(o => !o.dead);

  // Sync targeting
  Targeting.syncTarget(state.objects);

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
  Themes.drawBackground(ctx, w, h, state.theme, t);

  // Draw all objects
  for (const obj of state.objects) {
    Themes.drawObject(ctx, obj, state.theme);
  }

  // Draw weapon aimed at target
  const target = Targeting.getTarget();
  const tx = target ? target.x + target.wobbleX : w / 2;
  const ty = target ? target.y : h / 2;
  Themes.drawWeapon(ctx, w, h, state.theme, tx, ty);

  // Freeze overlay
  if (state.freezeActive > 0) {
    Themes.drawFreezeOverlay(ctx, w, h, state.freezeActive);
  }
}

// ---- ANSWER SUBMISSION ----
function submitAnswer() {
  if (state.phase !== 'PLAYING') return;
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
      UI.showTryAgain();
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
      UI.showTryAgain();
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
      UI.showTryAgain();
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

    // Graduate out of wrong queue if it was there
    state.wrongQueue = state.wrongQueue.filter(q => q.key !== target.key);

    // Scoring
    let pts = 10;
    if (elapsed < 3000) pts += 10;
    else if (elapsed < 6000) pts += 5;
    const mult = state.streak >= 5 ? 2 : state.streak >= 3 ? 1.5 : 1;
    pts = Math.round(pts * mult);
    state.score += pts;

    // Destroy object
    const particleColor = Themes.particleColorForTheme(state.theme);
    Objects.triggerDestruction(target, particleColor);
    Audio.play('correct');

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
    UI.shakeInput();
    UI.showTryAgain();
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
  state.phase = 'GAME_OVER';

  const accuracy = state.totalAttempts > 0 ? state.totalCorrect / state.totalAttempts : 0;
  const session = {
    score: state.score,
    level: state.level,
    accuracy,
    theme: state.theme,
    levelStars: state.levelStars,
    maxStreak: state.maxStreak || 0,
    bossesDefeated: state.bossesDefeated || 0,
    missCount: state.missedList.length
  };
  const newAchievements = Progress.saveSession(session);
  if (state.isDaily) {
    Progress.saveDailyResult({ score: state.score, level: state.level, accuracy });
    session.dailyBadge = true;
  }

  UI.showGameOver(
    session,
    state.missedList,
    newAchievements,
    () => { UI.showScreen('onboarding'); },
    () => UI.showLeaderboard(() => UI.showScreen('onboarding'))
  );
}
