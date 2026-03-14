// tests/objects.test.js
// Unit tests for Objects module — pickX null return, minSep, create, update

const { makeContext, loadModule } = require('./helpers/context');
const vm   = require('vm');
const fs   = require('fs');
const path = require('path');

// Load with internals exposed for direct testing
function makeObjCtxWithInternals() {
  const ctx = makeContext();
  let src = fs.readFileSync(path.resolve(__dirname, '../js/objects.js'), 'utf8');
  // Expose pickX and minSep on the returned object
  src = src.replace(
    'return { create, createBoss, createFreeze, createLifeUp, update, triggerDestruction };',
    'return { create, createBoss, createFreeze, createLifeUp, update, triggerDestruction, _pickX: pickX, _minSep: minSep };'
  );
  src = src.replace(/^(?:const|let)\s+([A-Z][A-Za-z0-9_]*)\s*=/m, 'var $1 =');
  vm.runInContext(src, ctx);
  return ctx;
}

function makeObjCtx() {
  const ctx = makeContext();
  loadModule(ctx, 'objects.js');
  return ctx;
}

// Minimal question object
const Q = { display: '3 × 4', answer: 12, key: '3x4' };

describe('Objects._minSep', () => {
  let ctx;
  beforeEach(() => { ctx = makeObjCtxWithInternals(); });

  test('wide canvas → capped at 130', () => {
    // usable = 800 - 120 = 680; 680/4 = 170 → capped at 130
    expect(ctx.Objects._minSep(800)).toBe(130);
  });

  test('narrow mobile canvas → floored at 60', () => {
    // usable = 200 - 120 = 80; 80/4 = 20 → floored at 60
    expect(ctx.Objects._minSep(200)).toBe(60);
  });

  test('medium canvas → proportional', () => {
    // usable = 400 - 120 = 280; 280/4 = 70 → between 60 and 130
    expect(ctx.Objects._minSep(400)).toBe(70);
  });
});

describe('Objects._pickX', () => {
  let ctx;
  beforeEach(() => { ctx = makeObjCtxWithInternals(); });

  test('returns a number on empty canvas', () => {
    const x = ctx.Objects._pickX(800, []);
    expect(typeof x).toBe('number');
    expect(x).toBeGreaterThanOrEqual(60);
    expect(x).toBeLessThanOrEqual(740);
  });

  test('respects margin: x between MARGIN and width-MARGIN', () => {
    for (let i = 0; i < 20; i++) {
      const x = ctx.Objects._pickX(800, []);
      expect(x).toBeGreaterThanOrEqual(60);
      expect(x).toBeLessThanOrEqual(740);
    }
  });

  test('returns null when no gap exists (narrow screen, many objects)', () => {
    // Fill a narrow canvas with objects every 10px — no 60px gap possible
    const existing = [80, 90, 100, 110, 120, 130, 140, 150, 160];
    // With 200px canvas, MARGIN=60, usable=80, minSep=60, basically no room
    const x = ctx.Objects._pickX(200, existing);
    expect(x).toBeNull();
  });

  test('keeps separation from existing objects', () => {
    const existing = [400];
    for (let i = 0; i < 50; i++) {
      const x = ctx.Objects._pickX(800, existing);
      if (x !== null) {
        expect(Math.abs(x - 400)).toBeGreaterThanOrEqual(130);
      }
    }
  });
});

describe('Objects.create', () => {
  let ctx;
  beforeEach(() => { ctx = makeObjCtx(); });

  test('returns null when no gap exists', () => {
    // Pack existing positions to leave no room
    const existing = [80, 90, 100, 110, 120, 130, 140, 150, 160];
    const result = ctx.Objects.create(Q, 200, 600, 100, existing);
    expect(result).toBeNull();
  });

  test('returns object with correct fields on success', () => {
    const result = ctx.Objects.create(Q, 800, 600, 100, []);
    expect(result).not.toBeNull();
    expect(result.question).toBe('3 × 4');
    expect(result.answer).toBe(12);
    expect(result.key).toBe('3x4');
    expect(result.y).toBe(-80);
    expect(result.speed).toBe(100);
    expect(result.dead).toBe(false);
    expect(result.dying).toBe(false);
    expect(result.destroyed).toBe(false);
    expect(result.wrongAttempts).toBe(0);
    expect(result.hintActive).toBe(false);
  });
});

describe('Objects.update', () => {
  let ctx;
  beforeEach(() => { ctx = makeObjCtx(); });

  test('y increases by speed * dt', () => {
    const o = ctx.Objects.create(Q, 800, 600, 100, []);
    const startY = o.y;
    ctx.Objects.update(o, 1.0, 600);
    expect(o.y).toBeCloseTo(startY + 100, 0);
  });

  test('age increases by dt', () => {
    const o = ctx.Objects.create(Q, 800, 600, 100, []);
    ctx.Objects.update(o, 0.5, 600);
    expect(o.age).toBeCloseTo(0.5, 5);
  });

  test('sets gracing (not dying immediately) when y reaches canvasHeight', () => {
    const o = ctx.Objects.create(Q, 800, 600, 100, []);
    o.y = 595;
    ctx.Objects.update(o, 1.0, 600);
    expect(o.gracing).toBe(true);
    expect(o.dying).toBe(false);
  });

  test('sets dying after grace period expires (1s)', () => {
    const o = ctx.Objects.create(Q, 800, 600, 100, []);
    o.y = 600;
    o.gracing = true;
    o.graceTimer = 999;
    ctx.Objects.update(o, 0.002, 600); // advances graceTimer to > 1000ms
    expect(o.dying).toBe(true);
    expect(o.gracing).toBe(false);
  });

  test('does not move when dying', () => {
    const o = ctx.Objects.create(Q, 800, 600, 100, []);
    o.dying = true;
    o.y = 600;
    ctx.Objects.update(o, 1.0, 600);
    expect(o.y).toBe(600);
  });

  test('dead=true after dying for > 1.8s', () => {
    const o = ctx.Objects.create(Q, 800, 600, 100, []);
    o.dying = true;
    o.dieTimer = 0;
    ctx.Objects.update(o, 2.0, 600);
    expect(o.dead).toBe(true);
  });
});

describe('Objects.triggerDestruction', () => {
  let ctx;
  beforeEach(() => { ctx = makeObjCtx(); });

  test('sets destroyed=true and spawns particles', () => {
    const o = ctx.Objects.create(Q, 800, 600, 100, []);
    ctx.Objects.triggerDestruction(o, '#ff0000');
    expect(o.destroyed).toBe(true);
    expect(o.particles.length).toBe(20);
  });

  test('particle has required fields', () => {
    const o = ctx.Objects.create(Q, 800, 600, 100, []);
    ctx.Objects.triggerDestruction(o, '#ff0000');
    const p = o.particles[0];
    expect(p).toHaveProperty('x');
    expect(p).toHaveProperty('y');
    expect(p).toHaveProperty('vx');
    expect(p).toHaveProperty('vy');
    expect(p).toHaveProperty('life');
    expect(p).toHaveProperty('color');
    expect(p.color).toBe('#ff0000');
  });

  test('object goes dead after destroy animation (> 1.5s)', () => {
    const o = ctx.Objects.create(Q, 800, 600, 100, []);
    ctx.Objects.triggerDestruction(o, '#ff0000');
    ctx.Objects.update(o, 2.0, 600);
    expect(o.dead).toBe(true);
  });
});
