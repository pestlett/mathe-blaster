// tests/voice-processing.test.js
// Regression tests for voice processing state:
// - dedupe must be scoped to the active question
// - TTS question echoes like "68" from "6 × 8" must be filtered

const { makeContext, loadModule } = require('./helpers/context');

function makeVoiceHarness(lang = 'en') {
  let recInstance = null;

  class FakeRecognition {
    constructor() {
      recInstance = this;
      this.onstart = null;
      this.onend = null;
      this.onresult = null;
      this.onerror = null;
      this.onsoundstart = null;
      this.onsoundend = null;
      this.onspeechstart = null;
      this.onspeechend = null;
    }

    start() { this.onstart?.(); }
    stop() { this.onend?.(); }
    abort() { this.onend?.(); }

    emitFinal(transcripts, confidences = []) {
      const finalResult = { isFinal: true, length: transcripts.length };
      transcripts.forEach((transcript, i) => {
        finalResult[i] = {
          transcript,
          confidence: confidences[i] ?? 0.9,
        };
      });
      this.onresult?.({
        resultIndex: 0,
        results: [finalResult],
      });
    }
  }

  const ctx = makeContext({
    window: {
      SpeechRecognition: FakeRecognition,
      webkitSpeechRecognition: null,
      speechSynthesis: null,
    },
  });
  ctx.I18n = { getLang: () => lang };
  loadModule(ctx, 'voice.js');

  const numbers = [];
  ctx.Voice.init({
    onNumber: n => numbers.push(n),
    onStatusChange: () => {},
    onResultDone: () => {},
  });
  ctx.Voice.start();

  return { ctx, rec: recInstance, numbers };
}

describe('Voice processing regressions', () => {
  test('dedupe applies only within the same active question', () => {
    const { ctx, rec, numbers } = makeVoiceHarness('en');

    ctx.Voice.setActiveQuestion('2x6');
    rec.emitFinal(['fire 12'], [0.9]);
    rec.emitFinal(['fire 12'], [0.9]);
    expect(numbers).toEqual([12]); // same question -> deduped

    ctx.Voice.setActiveQuestion('3x4');
    rec.emitFinal(['fire 12'], [0.9]);
    expect(numbers).toEqual([12, 12]); // new question -> accepted
  });

  test('bare echo does not fire (no trigger word); explicit "fire N" fires', () => {
    const { ctx, rec, numbers } = makeVoiceHarness('en');

    ctx.Voice.setActiveQuestion('6x8');
    ctx.Voice.setTTSEchoFilter({
      nums: [6, 8],
      operands: [6, 8],
      lang: 'en',
      numberGraceMs: 2000,
      phraseGraceMs: 2000,
    });

    // TTS acoustic echo ("68") has no trigger word → trigger mode blocks it automatically
    rec.emitFinal(['68'], [0.9]);
    expect(numbers).toEqual([]);

    // User explicitly says "fire 48" → fires (trigger word present, not an echo)
    rec.emitFinal(['fire 48'], [0.9]);
    expect(numbers).toEqual([48]);
  });
});
