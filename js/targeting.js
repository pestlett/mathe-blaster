// targeting.js - arrow-key snap targeting

const Targeting = (() => {
  let currentIndex = -1;

  function reset() { currentIndex = -1; }

  function getIndex() { return currentIndex; }

  function getTarget(objects) {
    if (currentIndex < 0 || currentIndex >= objects.length) return null;
    return objects[currentIndex];
  }

  function syncTarget(objects) {
    // If current target is dead/destroyed pick a new one
    if (currentIndex < 0 || currentIndex >= objects.length ||
        objects[currentIndex].dead || objects[currentIndex].dying || objects[currentIndex].destroyed) {
      autoTarget(objects);
    }
    // Keep isTargeted flag synced
    objects.forEach((o, i) => {
      o.isTargeted = (i === currentIndex);
    });
  }

  function autoTarget(objects) {
    const alive = objects
      .map((o, i) => ({ o, i }))
      .filter(({ o }) => !o.dead && !o.dying && !o.destroyed);
    if (alive.length === 0) { currentIndex = -1; return; }
    // Pick the one lowest on screen (highest y) as default
    alive.sort((a, b) => b.o.y - a.o.y);
    currentIndex = alive[0].i;
  }

  function moveLeft(objects) {
    const current = objects[currentIndex];
    if (!current) { autoTarget(objects); return; }
    const cx = current.x + current.wobbleX;
    const candidates = objects
      .map((o, i) => ({ o, i }))
      .filter(({ o, i }) => i !== currentIndex && !o.dead && !o.dying && !o.destroyed && (o.x + o.wobbleX) < cx);
    if (candidates.length === 0) return;
    candidates.sort((a, b) => (b.o.x + b.o.wobbleX) - (a.o.x + a.o.wobbleX));
    currentIndex = candidates[0].i;
  }

  function moveRight(objects) {
    const current = objects[currentIndex];
    if (!current) { autoTarget(objects); return; }
    const cx = current.x + current.wobbleX;
    const candidates = objects
      .map((o, i) => ({ o, i }))
      .filter(({ o, i }) => i !== currentIndex && !o.dead && !o.dying && !o.destroyed && (o.x + o.wobbleX) > cx);
    if (candidates.length === 0) return;
    candidates.sort((a, b) => (a.o.x + a.o.wobbleX) - (b.o.x + b.o.wobbleX));
    currentIndex = candidates[0].i;
  }

  return { reset, getIndex, getTarget, syncTarget, autoTarget, moveLeft, moveRight };
})();
