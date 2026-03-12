// engine.js - canvas game loop

const Engine = (() => {
  let canvas, ctx;
  let rafId = null;
  let lastTime = 0;
  let elapsedTime = 0;
  let running = false;

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
    lastTime = performance.now();
    elapsedTime = 0;
    rafId = requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  }

  function loop(timestamp) {
    if (!running) return;
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1); // cap at 100ms
    lastTime = timestamp;
    elapsedTime += dt;

    onUpdate(dt, elapsedTime);
    onRender(ctx, canvas.width, canvas.height, elapsedTime);

    rafId = requestAnimationFrame(loop);
  }

  function getCanvas() { return canvas; }
  function getCtx() { return ctx; }

  return { init, start, stop, resize, getCanvas, getCtx };
})();
