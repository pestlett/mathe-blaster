// targeting.js - arrow-key snap targeting
// Tracks by object reference so array re-ordering / filtering never causes silent switches.

const Targeting = (() => {
  let current = null; // direct reference to the targeted object

  function reset() { current = null; }

  function getTarget() { return current; }

  function setTarget(obj) { current = obj || null; }

  // Call every frame to keep isTargeted flags correct.
  // Only auto-picks a new target when there is genuinely no valid one.
  function syncTarget(objects) {
    const stillValid = current &&
      objects.includes(current) &&
      !current.dead && !current.dying && !current.destroyed;

    if (!stillValid) {
      // Current target is gone — pick a new one automatically
      _autoTarget(objects);
    }

    objects.forEach(o => { o.isTargeted = (o === current); });
  }

  // An object is targetable only once it has entered the visible canvas area.
  // Objects spawn at y = -80; y > 0 means the reference point is on-screen.
  function _visible(o) { return o.y > 0; }

  function _alive(o) { return !o.dead && !o.dying && !o.destroyed; }

  function _autoTarget(objects) {
    const candidates = objects.filter(o => _alive(o) && _visible(o));
    if (candidates.length === 0) { current = null; return; }
    // Default to the object furthest down the screen (most urgent)
    candidates.sort((a, b) => b.y - a.y);
    current = candidates[0];
  }

  function moveLeft(objects) {
    if (!current) { _autoTarget(objects); return; }
    const cx = current.x + current.wobbleX;
    const candidates = objects.filter(
      o => o !== current && _alive(o) && _visible(o) && (o.x + o.wobbleX) < cx
    );
    if (candidates.length === 0) return;
    candidates.sort((a, b) => (b.x + b.wobbleX) - (a.x + a.wobbleX));
    current = candidates[0];
  }

  function moveRight(objects) {
    if (!current) { _autoTarget(objects); return; }
    const cx = current.x + current.wobbleX;
    const candidates = objects.filter(
      o => o !== current && _alive(o) && _visible(o) && (o.x + o.wobbleX) > cx
    );
    if (candidates.length === 0) return;
    candidates.sort((a, b) => (a.x + a.wobbleX) - (b.x + b.wobbleX));
    current = candidates[0];
  }

  return { reset, getTarget, setTarget, syncTarget, moveLeft, moveRight };
})();
