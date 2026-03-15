/**
 * Injects a controllable SpeechRecognition stub before game code loads.
 * Call injectSpeechMock(page) before page.goto().
 *
 * From the test, fire a synthetic result with:
 *   await page.evaluate(t => window.__fireSpeechResult(t), '6');
 */
export async function injectSpeechMock(page) {
  await page.addInitScript(() => {
    const callbacks = {};

    class MockRecognition {
      constructor() {
        this.continuous = false;
        this.interimResults = false;
        this.lang = '';
      }
      start() {}
      stop() {}
      abort() {}

      set onresult(fn) { callbacks.onresult = fn; }
      get onresult() { return callbacks.onresult; }

      set onerror(fn) { callbacks.onerror = fn; }
      get onerror() { return callbacks.onerror; }

      set onend(fn) { callbacks.onend = fn; }
      get onend() { return callbacks.onend; }

      set onstart(fn) { callbacks.onstart = fn; }
      get onstart() { return callbacks.onstart; }
    }

    window.SpeechRecognition = MockRecognition;
    window.webkitSpeechRecognition = MockRecognition;

    /** Fire a synthetic voice result from test code. */
    window.__fireSpeechResult = (transcript) => {
      if (!callbacks.onresult) return;
      const event = {
        results: {
          0: { 0: { transcript, confidence: 0.99 }, isFinal: true, length: 1 },
          length: 1,
        },
        resultIndex: 0,
      };
      callbacks.onresult(event);
    };

    /** Simulate recognition ending (triggers onend → game restarts listening). */
    window.__fireSpeechEnd = () => {
      if (callbacks.onend) callbacks.onend({});
    };
  });
}

/**
 * Seeds localStorage with a saved player name so the onboarding screen:
 *   1. Does NOT auto-open the settings modal on load (name is non-empty)
 *   2. Pre-fills #input-name and #input-age from stored values
 *
 * Call this via addInitScript *before* page.goto().
 * After goto(), calling page.click('#btn-start') works directly.
 */
export async function seedPlayerStorage(page, name = 'TestPlayer', age = '8') {
  await page.addInitScript(({ n, a }) => {
    try {
      localStorage.setItem('multiblaster_settings', JSON.stringify({ lastPlayer: n, lastAge: a }));
    } catch {}
  }, { n: name, a: age });
}

/**
 * Navigates to the game and starts playing as TestPlayer.
 * Uses storage seeding so #input-name/#input-age are pre-filled on load,
 * allowing a direct click on #btn-start without opening the settings modal.
 */
export async function startNormalGame(page, overrides = {}) {
  const opts = { name: 'TestPlayer', age: '8', lang: 'en', ...overrides };

  // Pre-seed storage so inputs are auto-filled and modal doesn't auto-open
  await seedPlayerStorage(page, opts.name, opts.age);
  await page.goto('/');

  // Language (optional)
  if (opts.lang) {
    await page.click(`[data-lang="${opts.lang}"]`);
  }

  // Inputs are pre-filled from storage — click start directly
  await page.click('#btn-start');
  await page.waitForSelector('#screen-game.active', { timeout: 5000 });
}

/**
 * Types an answer into the answer input and presses Enter.
 */
export async function typeAnswer(page, answer) {
  const input = page.locator('#answer-input');
  await input.fill(String(answer));
  await page.keyboard.press('Enter');
}

/**
 * Returns the current score value from the HUD.
 */
export async function getScore(page) {
  return parseInt(await page.locator('#score-val').textContent(), 10);
}

/**
 * Returns all question labels currently visible as falling objects
 * by reading state.objects from the page.
 */
export async function getObjects(page) {
  return page.evaluate(() => {
    if (!window.__gameState) return [];
    return (window.__gameState.objects || []).map(o => ({
      question: o.question,
      answer: o.answer,
      type: o.type,
      alive: !o.dead && !o.dying && !o.destroyed,
    }));
  });
}
