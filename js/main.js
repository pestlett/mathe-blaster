// main.js - game state machine & entry point

const DIFFICULTY = {
  easy:   { maxObjects: 2, baseSpeed: 48 },
  medium: { maxObjects: 3, baseSpeed: 70 },
  hard:   { maxObjects: 4, baseSpeed: 96 }
};
const MAX_LIVES = 3;
const CORRECT_PER_LEVEL = 10;
const SPEED_INCREASE_PER_LEVEL = 0.10;

// ---- Game state ----
let state = {
  phase: 'ONBOARDING', // ONBOARDING | PLAYING | GAME_OVER
  name: 'Player',
  age: null,
  theme: 'space',
  minTable: 1,
  maxTable: 10,
  difficulty: 'medium',
  score: 0,
  level: 1,
  lives: MAX_LIVES,
  maxLives: MAX_LIVES,
  correctThisLevel: 0,
  totalCorrect: 0,
  totalAttempts: 0,
  streak: 0,
  objects: [],
  missedList: [],
  wrongQueue: [],   // questions answered incorrectly this session
  lifeUpTimer: 0,   // accumulates seconds toward next life-up spawn
  answerStartTime: 0,
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
    // Keep input focused
    if (!['ArrowLeft','ArrowRight','Enter','Tab'].includes(e.key)) {
      answerInput.focus();
    }
  });

  answerInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); submitAnswer(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); Targeting.moveLeft(state.objects); }
    if (e.key === 'ArrowRight') { e.preventDefault(); Targeting.moveRight(state.objects); }
  });

  btnFire.addEventListener('click', submitAnswer);

  // ---- Voice setup ----
  const btnMic = document.getElementById('btn-mic');
  if (!Voice.supported) {
    btnMic.style.display = 'none';
  } else {
    Voice.init({
      onNext:     () => { if (state.phase === 'PLAYING') Targeting.moveRight(state.objects); },
      onPrevious: () => { if (state.phase === 'PLAYING') Targeting.moveLeft(state.objects); },
      onClear:    () => { if (state.phase === 'PLAYING') answerInput.value = ''; },
      onNumber:   (n) => {
        if (state.phase !== 'PLAYING') return;
        answerInput.value = String(n);
        submitAnswer();
      },
      onStatusChange: (active, reason) => {
        btnMic.classList.toggle('listening', active);
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

function startGame(settings) {
  state.name = settings.name;
  state.age = settings.age;
  state.theme = settings.theme;
  state.minTable = settings.minTable;
  state.maxTable = settings.maxTable;
  state.difficulty = settings.difficulty;
  state.score = 0;
  state.level = 1;
  state.lives = MAX_LIVES;
  state.maxLives = MAX_LIVES;
  state.correctThisLevel = 0;
  state.totalCorrect = 0;
  state.totalAttempts = 0;
  state.streak = 0;
  state.objects = [];
  state.missedList = [];
  state.wrongQueue = [];
  state.lifeUpTimer = 0;
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

  // Update all objects (keep animating during ENDING)
  for (const obj of state.objects) {
    Objects.update(obj, dt, window.innerHeight - 148);

    // Detect first frame of dying (object hit bottom)
    if (obj.dying && !obj._dieHandled) {
      obj._dieHandled = true;
      if (obj.isLifeUp) {
        // Life-up missed — just disappears, no penalty
      } else {
        state.lives = Math.max(0, state.lives - 1);
        state.missedList.push({ question: obj.question, answer: obj.answer });
        Audio.play('lifeLost');
        UI.updateHUD(state);
        if (state.lives <= 0 && state.phase === 'PLAYING') {
          state.phase = 'ENDING';
          setTimeout(() => endGame(), 1400);
        }
      }
    }
  }

  if (state.phase === 'ENDING') {
    state.objects = state.objects.filter(o => !o.dead);
    return;
  }

  const diff = DIFFICULTY[state.difficulty];
  const maxObj = diff.maxObjects + (state.level > 5 ? 1 : 0);
  const speed = diff.baseSpeed * Math.pow(1 + SPEED_INCREASE_PER_LEVEL, state.level - 1);

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
  const aliveCount = state.objects.filter(o => !o.dead && !o.dying && !o.destroyed && !o.isLifeUp).length;
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
  UI.updateHUD(state);

  // Update input placeholder — hint when a life-up is targeted
  const currentTarget = Targeting.getTarget();
  const inp = document.getElementById('answer-input');
  inp.placeholder = (currentTarget && currentTarget.isLifeUp) ? 'Answer for +1 life!' : 'Answer...';
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
}

// ---- ANSWER SUBMISSION ----
function submitAnswer() {
  if (state.phase !== 'PLAYING') return;
  const input = document.getElementById('answer-input');

  const target = Targeting.getTarget();
  if (!target) { input.value = ''; input.focus(); return; }

  const val = parseInt(input.value.trim());
  if (isNaN(val)) { input.focus(); return; }

  // Life-up: correct answer earns a life, wrong answer just shakes
  if (target.isLifeUp) {
    if (val === target.answer) {
      Objects.triggerDestruction(target, '#2ed573');
      state.lives = Math.min(MAX_LIVES, state.lives + 1);
      UI.updateHUD(state);
      Audio.play('levelUp');
      input.value = '';
      input.placeholder = 'Answer...';
      Targeting.syncTarget(state.objects);
    } else {
      Audio.play('wrong');
      UI.shakeInput();
      UI.showTryAgain();
      input.value = '';
    }
    input.focus();
    return;
  }

  const elapsed = Date.now() - state.answerStartTime;
  state.totalAttempts++;

  if (val === target.answer) {
    // Correct!
    state.totalCorrect++;
    state.streak++;
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
      state.level++;
      state.correctThisLevel = 0;
      Audio.play('levelUp');
      UI.showLevelUp(state.level);
    }

    input.value = '';
    state.answerStartTime = Date.now();
    Targeting.syncTarget(state.objects);

  } else {
    // Wrong — add to this session's wrong queue if not already there
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

  input.focus();
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
    theme: state.theme
  };
  Progress.saveSession(session);

  UI.showGameOver(
    session,
    state.missedList,
    () => { UI.showScreen('onboarding'); },
    () => UI.showLeaderboard(() => UI.showScreen('onboarding'))
  );
}
