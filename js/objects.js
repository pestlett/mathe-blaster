// objects.js - falling object logic

const Objects = (() => {
  const WOBBLE_AMPLITUDE = 18;
  const WOBBLE_SPEED = 1.8; // radians per second

  const MARGIN = 60;

  // Minimum separation scales with usable screen width so narrow mobile
  // screens can still fit multiple objects without forcing overlap.
  function minSep(canvasWidth) {
    const usable = canvasWidth - 2 * MARGIN;
    return Math.min(130, Math.max(60, usable / 4));
  }

  // Returns null when no gap exists — caller should delay the spawn.
  function pickX(canvasWidth, existingXPositions) {
    const lo = MARGIN, hi = canvasWidth - MARGIN;
    const sep = minSep(canvasWidth);
    for (let attempt = 0; attempt < 60; attempt++) {
      const x = lo + Math.random() * (hi - lo);
      if (existingXPositions.every(ex => Math.abs(x - ex) >= sep)) return x;
    }
    return null; // no valid gap found — caller must wait
  }

  function create(question, canvasWidth, canvasHeight, speed, existingXPositions = []) {
    const x = pickX(canvasWidth, existingXPositions);
    if (x === null) return null; // no room yet — main.js will retry next frame
    return {
      question: question.display,
      answer: question.answer,
      key: question.key,
      x,
      y: -80,
      speed,
      isTargeted: false,
      wobbleOffset: Math.random() * Math.PI * 2,
      wobbleX: 0,
      age: 0,             // seconds alive
      dying: false,
      dieTimer: 0,        // counts up after hitting bottom
      dead: false,
      correctFlash: false,
      destroyTimer: 0,    // for destruction animation
      destroyed: false,
      particles: [],
      spawnTime: Date.now(),
      wrongAttempts: 0,   // wrong answers submitted against this object
      hintActive: false   // set by main.js when wrongAttempts >= threshold
    };
  }

  function update(obj, dt, canvasHeight) {
    obj.age += dt;

    if (obj.destroyed) {
      obj.destroyTimer += dt;
      updateParticles(obj.particles, dt);
      if (obj.destroyTimer > 1.5) obj.dead = true;
      return;
    }

    if (obj.dying) {
      obj.dieTimer += dt;
      if (obj.dieTimer > 1.8) obj.dead = true;
      return;
    }

    // Sinusoidal wobble
    obj.wobbleX = Math.sin(obj.age * WOBBLE_SPEED + obj.wobbleOffset) * WOBBLE_AMPLITUDE;
    obj.y += obj.speed * dt;

    // Check if it hit the crash line
    if (obj.y >= canvasHeight) {
      obj.y = canvasHeight;
      obj.dying = true;
      obj.dieTimer = 0;
    }
  }

  function triggerDestruction(obj, particleColor) {
    obj.destroyed = true;
    obj.destroyTimer = 0;
    const count = 20;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 60 + Math.random() * 140;
      obj.particles.push({
        x: obj.x + obj.wobbleX,
        y: obj.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        decay: 0.6 + Math.random() * 0.6,
        size: 3 + Math.random() * 5,
        color: particleColor
      });
    }
  }

  function updateParticles(particles, dt) {
    for (const p of particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 180 * dt; // gravity
      p.life -= p.decay * dt;
    }
  }

  function createBoss(question, canvasWidth, canvasHeight, speed) {
    // Boss spawns centred, moves slowly, is large
    const x = canvasWidth / 2;
    return {
      isBoss: true,
      question: question.display,
      answer: question.answer,
      key: question.key,
      x,
      y: -100,
      speed: Math.max(30, speed * 0.4), // much slower
      isTargeted: false,
      wobbleOffset: 0,
      wobbleX: 0,
      age: 0,
      dying: false,
      dieTimer: 0,
      dead: false,
      destroyTimer: 0,
      destroyed: false,
      particles: [],
      spawnTime: Date.now(),
      wrongAttempts: 0,
      hintActive: false
    };
  }

  function createFreeze(question, canvasWidth, speed, existingXPositions = []) {
    const x = pickX(canvasWidth, existingXPositions);
    if (x === null) return null;
    return {
      isFreeze: true,
      question: question.display,
      answer: question.answer,
      key: question.key,
      x,
      y: -80,
      speed: speed * 0.6,
      isTargeted: false,
      wobbleOffset: Math.random() * Math.PI * 2,
      wobbleX: 0,
      age: 0,
      dying: false,
      dieTimer: 0,
      dead: false,
      destroyTimer: 0,
      destroyed: false,
      particles: [],
      spawnTime: Date.now(),
      wrongAttempts: 0,
      hintActive: false
    };
  }

  function createLifeUp(question, canvasWidth, speed, existingXPositions = []) {
    const x = pickX(canvasWidth, existingXPositions);
    if (x === null) return null;
    return {
      isLifeUp: true,
      question: question.display,
      answer: question.answer,
      key: question.key,
      x,
      y: -80,
      speed: speed * 0.65,   // falls slower so the player has time to react
      isTargeted: false,
      wobbleOffset: Math.random() * Math.PI * 2,
      wobbleX: 0,
      age: 0,
      dying: false,
      dieTimer: 0,
      dead: false,
      destroyTimer: 0,
      destroyed: false,
      particles: [],
      spawnTime: Date.now()
    };
  }

  return { create, createBoss, createFreeze, createLifeUp, update, triggerDestruction };
})();
