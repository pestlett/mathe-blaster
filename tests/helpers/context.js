// tests/helpers/context.js
// Factory for vm sandbox contexts that simulate the browser environment
// needed to run IIFE game modules under Node.js / Jest.

const vm   = require('vm');
const fs   = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '../../js');

/**
 * Create a minimal browser-like vm context.
 * Callers can override / extend the returned ctx before loading modules.
 */
function makeContext(overrides = {}) {
  // Minimal localStorage shim backed by a plain object
  const _store = {};
  const localStorage = {
    getItem:    (k) => Object.prototype.hasOwnProperty.call(_store, k) ? _store[k] : null,
    setItem:    (k, v) => { _store[k] = String(v); },
    removeItem: (k) => { delete _store[k]; },
    clear:      () => { for (const k in _store) delete _store[k]; },
    _store,
  };

  const ctx = vm.createContext({
    console,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    Date,
    Math,
    JSON,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    Number,
    String,
    Array,
    Object,
    Set,
    Map,
    Promise,
    localStorage,
    // Stub out browser APIs that modules reference but tests don't need
    document: {
      querySelectorAll: () => [],
      querySelector:    () => null,
      getElementById:   () => null,
      createElement:    () => ({ style: {}, classList: { add(){}, remove(){}, toggle(){} }, appendChild(){} }),
    },
    window: {},
    ...overrides,
  });

  return ctx;
}

/**
 * Load a js/ module into a vm context.
 * IIFEs use `const X = (() => { ... })()` at top-level which does NOT expose X
 * on the context.  We rewrite that one binding to `var` so it lands on ctx.
 */
function loadModule(ctx, filename) {
  let src = fs.readFileSync(path.join(SRC, filename), 'utf8');
  // Replace `const Foo =` or `let Foo =` at start of file with `var Foo =`
  // so the variable is accessible on the vm context object.
  src = src.replace(/^(?:const|let)\s+([A-Z][A-Za-z0-9_]*)\s*=/m, 'var $1 =');
  vm.runInContext(src, ctx);
}

module.exports = { makeContext, loadModule };
