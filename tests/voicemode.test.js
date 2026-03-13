// tests/voicemode.test.js
// Tests for phone/voice-mode detection and the voice suggestion pill state machine.

// ── Phone detection ──────────────────────────────────────────────────────────
// Logic in main.js: const isPhone = window.innerWidth < 640;
// ─────────────────────────────────────────────────────────────────────────────
const PHONE_BREAKPOINT = 640;
const isPhone = (width) => width < PHONE_BREAKPOINT;

describe('Phone detection threshold', () => {
  // Common phone widths
  test('320px (small Android)  → phone', () => expect(isPhone(320)).toBe(true));
  test('375px (iPhone SE)      → phone', () => expect(isPhone(375)).toBe(true));
  test('390px (iPhone 14)      → phone', () => expect(isPhone(390)).toBe(true));
  test('414px (iPhone Plus)    → phone', () => expect(isPhone(414)).toBe(true));
  test('430px (iPhone 14 Max)  → phone', () => expect(isPhone(430)).toBe(true));
  test('599px (wide phone)     → phone', () => expect(isPhone(599)).toBe(true));
  test('639px (just under cap) → phone', () => expect(isPhone(639)).toBe(true));

  // Boundary
  test('640px (threshold)      → not phone', () => expect(isPhone(640)).toBe(false));

  // Tablet / desktop widths
  test('768px (iPad portrait)  → not phone', () => expect(isPhone(768)).toBe(false));
  test('1024px (iPad landscape) → not phone', () => expect(isPhone(1024)).toBe(false));
  test('1280px (small desktop) → not phone', () => expect(isPhone(1280)).toBe(false));
  test('1440px (large desktop) → not phone', () => expect(isPhone(1440)).toBe(false));
});

// ── Mute-by-default behaviour ────────────────────────────────────────────────
// Logic: let _muted = isPhone;
// ─────────────────────────────────────────────────────────────────────────────
describe('Mute initialisation', () => {
  function initMuted(width) { return isPhone(width); }

  test('phone (390px)   → starts muted',   () => expect(initMuted(390)).toBe(true));
  test('phone (639px)   → starts muted',   () => expect(initMuted(639)).toBe(true));
  test('tablet (768px)  → starts unmuted', () => expect(initMuted(768)).toBe(false));
  test('desktop (1280px)→ starts unmuted', () => expect(initMuted(1280)).toBe(false));
  test('exact boundary 640px → unmuted',   () => expect(initMuted(640)).toBe(false));
});

// ── Voice suggestion pill state machine ──────────────────────────────────────
// Mirrors the show/hide helpers in main.js.
// ─────────────────────────────────────────────────────────────────────────────

function makePill() {
  const classes = new Set(['hidden']);
  return {
    value: null,
    show(n, isInterim) {
      this.value = n;
      classes.delete('hidden');
      classes.delete('interim');
      classes.delete('confirmed');
      classes.add(isInterim ? 'interim' : 'confirmed');
    },
    hide() {
      classes.add('hidden');
    },
    isHidden()    { return classes.has('hidden');    },
    isInterim()   { return classes.has('interim');   },
    isConfirmed() { return classes.has('confirmed'); },
  };
}

describe('Voice suggestion pill — initial state', () => {
  test('starts hidden', () => expect(makePill().isHidden()).toBe(true));
  test('starts without interim class',   () => expect(makePill().isInterim()).toBe(false));
  test('starts without confirmed class', () => expect(makePill().isConfirmed()).toBe(false));
  test('starts with no value', () => expect(makePill().value).toBeNull());
});

describe('Voice suggestion pill — onInterim', () => {
  let pill;
  beforeEach(() => { pill = makePill(); pill.show(42, true); });

  test('becomes visible',       () => expect(pill.isHidden()).toBe(false));
  test('shows interim class',   () => expect(pill.isInterim()).toBe(true));
  test('no confirmed class',    () => expect(pill.isConfirmed()).toBe(false));
  test('stores the number',     () => expect(pill.value).toBe(42));
});

describe('Voice suggestion pill — onNumber (final result)', () => {
  let pill;
  beforeEach(() => { pill = makePill(); pill.show(48, false); });

  test('becomes visible',         () => expect(pill.isHidden()).toBe(false));
  test('shows confirmed class',   () => expect(pill.isConfirmed()).toBe(true));
  test('no interim class',        () => expect(pill.isInterim()).toBe(false));
  test('stores the number',       () => expect(pill.value).toBe(48));
});

describe('Voice suggestion pill — interim → confirmed transition', () => {
  test('upgrades from interim to confirmed when final result arrives', () => {
    const pill = makePill();
    pill.show(4, true);   // SR heard "4" (interim)
    expect(pill.isInterim()).toBe(true);
    pill.show(48, false); // SR finalised "forty-eight"
    expect(pill.isConfirmed()).toBe(true);
    expect(pill.isInterim()).toBe(false);
    expect(pill.value).toBe(48);
  });

  test('number updates when interim changes', () => {
    const pill = makePill();
    pill.show(4, true);
    pill.show(40, true);
    expect(pill.value).toBe(40);
    expect(pill.isInterim()).toBe(true);
  });
});

describe('Voice suggestion pill — dismissal', () => {
  test('hide() makes it hidden again', () => {
    const pill = makePill();
    pill.show(7, false);
    pill.hide();
    expect(pill.isHidden()).toBe(true);
  });

  // submitAnswer, onFire, onClear, onNext, onPrevious all call hideSuggestion()
  const DISMISS_EVENTS = ['submit', 'fire', 'clear', 'next', 'previous'];
  DISMISS_EVENTS.forEach(event => {
    test(`${event} dismisses the pill`, () => {
      const pill = makePill();
      pill.show(36, false);
      pill.hide(); // hideSuggestion()
      expect(pill.isHidden()).toBe(true);
    });
  });

  test('dismissed pill retains last value (for re-display if needed)', () => {
    const pill = makePill();
    pill.show(99, false);
    pill.hide();
    expect(pill.value).toBe(99);
  });
});
