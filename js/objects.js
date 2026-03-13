// objects.js - falling object logic

const Objects = (() => {
  const WOBBLE_AMPLITUDE = 18;
  const WOBBLE_SPEED = 1.8; // radians per second

  function create(question, canvasWidth, canvasHeight, speed, index) {
    const margin = 90;
    // Spread objects horizontally with some separation
    const slotWidth = (canvasWidth - margin * 2) / 4;
    const baseX = margin + (index % 4) * slotWidth + slotWidth / 2 + (Math.random() - 0.5) * 30;
    return {
      question: question.display,
      answer: question.answer,
      key: question.key,
      x: Math.max(margin, Math.min(canvasWidth - margin, baseX)),
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
      spawnTime: Date.now()
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

  function createLifeUp(canvasWidth, speed) {
    const margin = 90;
    const x = margin + Math.random() * (canvasWidth - margin * 2);
    return {
      isLifeUp: true,
      question: '❤ +1',
      answer: null,
      key: '__lifeup__',
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

  return { create, createLifeUp, update, triggerDestruction };
})();
