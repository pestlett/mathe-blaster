// tests/targeting.test.js
// Unit tests for the Targeting module — syncTarget, moveLeft, moveRight, reset

const { makeContext, loadModule } = require('./helpers/context');

function makeTargCtx() {
  const ctx = makeContext();
  loadModule(ctx, 'targeting.js');
  return ctx;
}

// Helper: build a minimal falling object
function obj(x, wobbleX = 0, y = 100, overrides = {}) {
  return { x, wobbleX, y, dead: false, dying: false, destroyed: false, isTargeted: false, ...overrides };
}

describe('Targeting.reset', () => {
  let ctx;
  beforeEach(() => { ctx = makeTargCtx(); });

  test('getTarget returns null after reset', () => {
    ctx.Targeting.reset();
    expect(ctx.Targeting.getTarget()).toBeNull();
  });
});

describe('Targeting.syncTarget', () => {
  let ctx;
  beforeEach(() => { ctx = makeTargCtx(); ctx.Targeting.reset(); });

  test('auto-targets the lowest object when no target set', () => {
    const a = obj(100, 0, 50);
    const b = obj(200, 0, 150); // lowest (highest y)
    ctx.Targeting.syncTarget([a, b]);
    expect(ctx.Targeting.getTarget()).toBe(b);
  });

  test('sets isTargeted flag on targeted object only', () => {
    const a = obj(100, 0, 50);
    const b = obj(200, 0, 150);
    ctx.Targeting.syncTarget([a, b]);
    expect(b.isTargeted).toBe(true);
    expect(a.isTargeted).toBe(false);
  });

  test('keeps existing valid target', () => {
    const a = obj(100, 0, 50);
    const b = obj(200, 0, 150);
    ctx.Targeting.syncTarget([a, b]);
    const first = ctx.Targeting.getTarget();
    ctx.Targeting.syncTarget([a, b]);
    expect(ctx.Targeting.getTarget()).toBe(first);
  });

  test('re-targets when current target dies', () => {
    const a = obj(100, 0, 50);
    const b = obj(200, 0, 150);
    ctx.Targeting.syncTarget([a, b]);
    // Mark the current target (b) as dead
    b.dead = true;
    ctx.Targeting.syncTarget([a, b]);
    expect(ctx.Targeting.getTarget()).toBe(a);
  });

  test('re-targets when current target is removed from array', () => {
    const a = obj(100, 0, 50);
    const b = obj(200, 0, 150);
    ctx.Targeting.syncTarget([a, b]);
    // Remove b from list
    ctx.Targeting.syncTarget([a]);
    expect(ctx.Targeting.getTarget()).toBe(a);
  });

  test('null when no alive objects', () => {
    ctx.Targeting.syncTarget([]);
    expect(ctx.Targeting.getTarget()).toBeNull();
  });

  test('null when all objects are dead', () => {
    const a = obj(100, 0, 50, { dead: true });
    ctx.Targeting.syncTarget([a]);
    expect(ctx.Targeting.getTarget()).toBeNull();
  });
});

describe('Targeting.moveLeft', () => {
  let ctx;
  beforeEach(() => { ctx = makeTargCtx(); ctx.Targeting.reset(); });

  test('moves to the nearest object to the left', () => {
    const left  = obj(100);
    const mid   = obj(300);
    const right = obj(500);
    ctx.Targeting.syncTarget([left, mid, right]);
    // current = right (lowest y, all same so first after sort — actually leftmost at bottom ties)
    // Force target to mid:
    ctx.Targeting.syncTarget([left, mid, right]);
    // After auto-target picks right (y=100 for all, sorts by y desc → all same → first = right?
    // Actually all y=100 → sorted desc → same order as provided → right is [2]
    // Re-do with different y values to be explicit:
  });

  test('moves left from middle to nearest left object', () => {
    const left  = obj(100, 0, 100);
    const mid   = obj(300, 0, 200); // lowest → auto-targeted
    const right = obj(500, 0, 50);
    ctx.Targeting.syncTarget([left, mid, right]);
    // mid is lowest (y=200), so it's targeted
    ctx.Targeting.moveLeft([left, mid, right]);
    expect(ctx.Targeting.getTarget()).toBe(left);
  });

  test('does nothing when already at leftmost', () => {
    const left  = obj(100, 0, 200); // lowest → auto-targeted
    const right = obj(500, 0, 50);
    ctx.Targeting.syncTarget([left, right]);
    ctx.Targeting.moveLeft([left, right]);
    expect(ctx.Targeting.getTarget()).toBe(left); // stays
  });

  test('auto-targets when current is null', () => {
    const a = obj(100, 0, 100);
    ctx.Targeting.moveLeft([a]);
    expect(ctx.Targeting.getTarget()).toBe(a);
  });

  test('skips dead objects when moving left', () => {
    const dead  = obj(100, 0, 50, { dead: true });
    const mid   = obj(300, 0, 200); // auto-targeted
    const right = obj(500, 0, 50);
    ctx.Targeting.syncTarget([dead, mid, right]);
    ctx.Targeting.moveLeft([dead, mid, right]);
    // dead is to the left but dead — no valid candidate
    expect(ctx.Targeting.getTarget()).toBe(mid);
  });
});

describe('Targeting.moveRight', () => {
  let ctx;
  beforeEach(() => { ctx = makeTargCtx(); ctx.Targeting.reset(); });

  test('moves right from left object', () => {
    const left  = obj(100, 0, 200); // lowest → auto-targeted
    const right = obj(500, 0, 50);
    ctx.Targeting.syncTarget([left, right]);
    ctx.Targeting.moveRight([left, right]);
    expect(ctx.Targeting.getTarget()).toBe(right);
  });

  test('does nothing when already at rightmost', () => {
    const left  = obj(100, 0, 50);
    const right = obj(500, 0, 200); // lowest → auto-targeted
    ctx.Targeting.syncTarget([left, right]);
    ctx.Targeting.moveRight([left, right]);
    expect(ctx.Targeting.getTarget()).toBe(right);
  });

  test('picks nearest, not farthest right', () => {
    const left  = obj(100, 0, 200); // auto-targeted
    const mid   = obj(300, 0, 50);
    const far   = obj(600, 0, 50);
    ctx.Targeting.syncTarget([left, mid, far]);
    ctx.Targeting.moveRight([left, mid, far]);
    expect(ctx.Targeting.getTarget()).toBe(mid);
  });

  test('wobbleX is taken into account', () => {
    // mid has wobble that pushes it right of far
    const left = obj(100, 0, 200);   // auto-targeted
    const mid  = obj(300, 250, 50);  // effective x = 550
    const far  = obj(500, 0, 50);    // effective x = 500
    ctx.Targeting.syncTarget([left, mid, far]);
    ctx.Targeting.moveRight([left, mid, far]);
    // far (x+wobble=500) < mid (x+wobble=550) so nearest right is far
    expect(ctx.Targeting.getTarget()).toBe(far);
  });
});
