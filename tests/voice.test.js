// tests/voice.test.js
// Unit tests for the Voice module — focuses on parseNumber() which has
// historically been the most fragile part of the voice recognition pipeline.

const { makeContext, loadModule } = require('./helpers/context');

// Stub the browser globals voice.js needs at module load time
function makeVoiceCtx(lang = 'en') {
  const ctx = makeContext({
    window: {
      SpeechRecognition: null,
      webkitSpeechRecognition: null,
    },
  });
  // Provide a minimal I18n stub so voice.js can call I18n.getLang()
  ctx.I18n = { getLang: () => lang };
  loadModule(ctx, 'voice.js');
  return ctx;
}

function makeVoiceRuntimeCtx(lang = 'en') {
  let recognitionInstance = null;

  class FakeSpeechRecognition {
    constructor() {
      recognitionInstance = this;
      this.continuous = false;
      this.interimResults = false;
      this.maxAlternatives = 1;
      this.lang = 'en-US';
    }
    start() {}
    stop() {}
    abort() {}
  }

  const ctx = makeContext({
    window: {
      SpeechRecognition: FakeSpeechRecognition,
      webkitSpeechRecognition: null,
    },
  });
  ctx.I18n = { getLang: () => lang };
  loadModule(ctx, 'voice.js');
  return {
    ctx,
    getRecognition: () => recognitionInstance,
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────
function parse(ctx, text) {
  return ctx.Voice.parseNumber(text);
}

// ── English tests ──────────────────────────────────────────────────────────
describe('parseNumber — English', () => {
  let ctx;
  beforeEach(() => { ctx = makeVoiceCtx('en'); });

  // Direct digit strings
  test('single digit string "7"', () => expect(parse(ctx, '7')).toBe(7));
  test('two-digit string "48"', () => expect(parse(ctx, '48')).toBe(48));
  test('three-digit string "100"', () => expect(parse(ctx, '100')).toBe(100));

  // Space-separated digits — the "1 1" bug
  test('"1 1" all same → 1', () => expect(parse(ctx, '1 1')).toBe(1));
  test('"2 2" all same → 2', () => expect(parse(ctx, '2 2')).toBe(2));
  test('"2 1" different → 21', () => expect(parse(ctx, '2 1')).toBe(21));
  test('"4 8" different → 48', () => expect(parse(ctx, '4 8')).toBe(48));

  // Simple words
  test('"zero"', () => expect(parse(ctx, 'zero')).toBe(0));
  test('"one"', () => expect(parse(ctx, 'one')).toBe(1));
  test('"twelve"', () => expect(parse(ctx, 'twelve')).toBe(12));
  test('"twenty"', () => expect(parse(ctx, 'twenty')).toBe(20));

  // Homophones
  test('"won" → 1', () => expect(parse(ctx, 'won')).toBe(1));
  test('"to" → 2', () => expect(parse(ctx, 'to')).toBe(2));
  test('"too" → 2', () => expect(parse(ctx, 'too')).toBe(2));
  test('"for" → 4', () => expect(parse(ctx, 'for')).toBe(4));
  test('"ate" → 8', () => expect(parse(ctx, 'ate')).toBe(8));
  test('"niner" → 9', () => expect(parse(ctx, 'niner')).toBe(9));

  // Compound words ("twenty four")
  test('"twenty four" → 24', () => expect(parse(ctx, 'twenty four')).toBe(24));
  test('"forty eight" → 48', () => expect(parse(ctx, 'forty eight')).toBe(48));
  test('"fourty eight" (misspelling) → 48', () => expect(parse(ctx, 'fourty eight')).toBe(48));
  test('"thirty two" → 32', () => expect(parse(ctx, 'thirty two')).toBe(32));
  test('"ninety nine" → 99', () => expect(parse(ctx, 'ninety nine')).toBe(99));

  // Hundred
  test('"one hundred" → 100', () => expect(parse(ctx, 'one hundred')).toBe(100));
  test('"a hundred" → 100', () => expect(parse(ctx, 'a hundred')).toBe(100));
  test('"one hundred and forty four" → 144', () => expect(parse(ctx, 'one hundred and forty four')).toBe(144));
  test('"one hundred forty four" → 144', () => expect(parse(ctx, 'one hundred forty four')).toBe(144));

  // Noise stripping
  test('"um forty eight" → 48', () => expect(parse(ctx, 'um forty eight')).toBe(48));
  test('"uh seven" → 7', () => expect(parse(ctx, 'uh seven')).toBe(7));
  test('"the answer is twenty" — strips noise → 20', () => expect(parse(ctx, 'the answer is twenty')).toBe(20));
  test('"i think forty" → 40', () => expect(parse(ctx, 'i think forty')).toBe(40));

  // Edge cases
  test('empty string → null', () => expect(parse(ctx, '')).toBeNull());
  test('whitespace only → null', () => expect(parse(ctx, '   ')).toBeNull());
  test('gibberish → null', () => expect(parse(ctx, 'blah xyz')).toBeNull());
  // parseNumber itself returns -5; the >=0 guard is in handleTranscript, not here
  test('negative number string returns the number (range guard is in handleTranscript)', () => expect(parse(ctx, '-5')).toBe(-5));
});

// ── German tests ───────────────────────────────────────────────────────────
describe('parseNumber — German', () => {
  let ctx;
  beforeEach(() => { ctx = makeVoiceCtx('de'); });

  test('"null" → 0', () => expect(parse(ctx, 'null')).toBe(0));
  test('"eins" → 1', () => expect(parse(ctx, 'eins')).toBe(1));
  test('"acht" → 8', () => expect(parse(ctx, 'acht')).toBe(8));
  test('"zwanzig" → 20', () => expect(parse(ctx, 'zwanzig')).toBe(20));
  test('"achtundvierzig" → 48', () => expect(parse(ctx, 'achtundvierzig')).toBe(48));
  test('"vierundachtzig" → 84', () => expect(parse(ctx, 'vierundachtzig')).toBe(84));
  test('"hundert" → 100', () => expect(parse(ctx, 'hundert')).toBe(100));
  test('"einhundert" → 100', () => expect(parse(ctx, 'einhundert')).toBe(100));
  test('"einhundertdreiundvierzig" → 143', () => expect(parse(ctx, 'einhundertdreiundvierzig')).toBe(143));
  // Digit strings still work
  test('"48" in DE context → 48', () => expect(parse(ctx, '48')).toBe(48));
});

// ── Spanish tests ──────────────────────────────────────────────────────────
describe('parseNumber — Spanish', () => {
  let ctx;
  beforeEach(() => { ctx = makeVoiceCtx('es'); });

  test('"cero" → 0', () => expect(parse(ctx, 'cero')).toBe(0));
  test('"uno" → 1', () => expect(parse(ctx, 'uno')).toBe(1));
  test('"ocho" → 8', () => expect(parse(ctx, 'ocho')).toBe(8));
  test('"veinte" → 20', () => expect(parse(ctx, 'veinte')).toBe(20));
  test('"veintiuno" → 21', () => expect(parse(ctx, 'veintiuno')).toBe(21));
  test('"treinta y uno" (compound) → 31', () => expect(parse(ctx, 'treinta y uno')).toBe(31));
  test('"cuarenta y ocho" → 48', () => expect(parse(ctx, 'cuarenta y ocho')).toBe(48));
  test('"noventa y nueve" → 99', () => expect(parse(ctx, 'noventa y nueve')).toBe(99));
  test('"cien" → 100', () => expect(parse(ctx, 'cien')).toBe(100));
  test('"ciento veinte" → 120', () => expect(parse(ctx, 'ciento veinte')).toBe(120));
});

// ── Runtime TTS-tail behaviour ───────────────────────────────────────────────
describe('voice runtime — TTS tail handling', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  function makeFinalResult(...alternatives) {
    const entries = alternatives.map(alt => ({
      transcript: alt.transcript,
      confidence: alt.confidence ?? 0.9,
    }));
    return {
      resultIndex: 0,
      results: [{
        isFinal: true,
        length: entries.length,
        ...entries,
      }],
    };
  }

  test('speechstart during TTS tail releases mute so the first answer is captured', () => {
    const { ctx, getRecognition } = makeVoiceRuntimeCtx('en');
    const seen = [];
    ctx.Voice.init({
      onNumber: n => seen.push(n),
      onSpeechStart: () => {},
      onStatusChange: () => {},
    });

    ctx.Voice.start();
    ctx.Voice.muteResults(true);
    ctx.Voice.armTTSTailFilter({
      promptText: '6 times 8',
      promptNumbers: [6, 8],
      allowedAnswer: 48,
      tailMs: 280,
      graceMs: 780,
    });

    const recognition = getRecognition();
    recognition.onspeechstart();
    recognition.onresult(makeFinalResult({ transcript: 'forty eight', confidence: 0.92 }));

    expect(seen).toEqual([48]);
  });

  test('prompt digits are still filtered during the TTS grace window', () => {
    const { ctx, getRecognition } = makeVoiceRuntimeCtx('en');
    const seen = [];
    ctx.Voice.init({
      onNumber: n => seen.push(n),
      onSpeechStart: () => {},
      onStatusChange: () => {},
      onResultDone: () => {},
    });

    ctx.Voice.start();
    ctx.Voice.muteResults(true);
    ctx.Voice.armTTSTailFilter({
      promptText: '6 times 8',
      promptNumbers: [6, 8],
      allowedAnswer: 48,
      tailMs: 280,
      graceMs: 780,
    });

    const recognition = getRecognition();
    recognition.onspeechstart();
    recognition.onresult(makeFinalResult({ transcript: '8', confidence: 0.91 }));

    expect(seen).toEqual([]);
  });
});
