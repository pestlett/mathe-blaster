// engine.js - canvas game loop

const Engine = (() => {
  let canvas, ctx;
  let rafId = null;
  let lastTime = 0;
  let elapsedTime = 0;
  let running = false;
  let paused = false;

  // Callbacks set by main.js
  let onUpdate = null;
  let onRender = null;

  function init(updateFn, renderFn) {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    onUpdate = updateFn;
    onRender = renderFn;
    resize();
    window.addEventListener('resize', resize);
  }

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function start() {
    if (running) return;
    running = true;
    paused = false;
    lastTime = performance.now();
    elapsedTime = 0;
    rafId = requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  }

  function pause() {
    paused = true;
  }

  function resume() {
    if (!paused) return;
    paused = false;
    lastTime = performance.now(); // reset so dt doesn't jump after pause
  }

  function isPaused() { return paused; }

  function loop(timestamp) {
    if (!running) return;
    rafId = requestAnimationFrame(loop);
    if (paused) { lastTime = timestamp; return; } // canvas holds last frame
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;
    elapsedTime += dt;
    onUpdate(dt, elapsedTime);
    onRender(ctx, canvas.width, canvas.height, elapsedTime);
  }

  function getCanvas() { return canvas; }
  function getCtx() { return ctx; }

  return { init, start, stop, pause, resume, isPaused, resize, getCanvas, getCtx };
})();
