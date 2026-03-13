// voice.js - Web Speech API recognition for mobile voice commands
// Commands: "next", "previous", "clear", or a spoken number (the answer)

const Voice = (() => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const supported = !!SpeechRecognition;

  let recognition = null;
  let listening = false;
  let shouldRestart = false;
  let callbacks = {};

  // ---- Word → number table (covers 1–144 for 1×1 through 12×12) ----
  const WORD_MAP = {
    'zero':0, 'oh':0,
    'one':1, 'won':1,
    'two':2, 'to':2, 'too':2,
    'three':3, 'tree':3,
    'four':4, 'for':4, 'fore':4,
    'five':5,
    'six':6,
    'seven':7,
    'eight':8, 'ate':8,
    'nine':9, 'niner':9,
    'ten':10,
    'eleven':11,
    'twelve':12,
    'thirteen':13,
    'fourteen':14,
    'fifteen':15,
    'sixteen':16,
    'seventeen':17,
    'eighteen':18,
    'nineteen':19,
    'twenty':20,
    'thirty':30,
    'forty':40, 'fourty':40,
    'fifty':50,
    'sixty':60,
    'seventy':70,
    'eighty':80,
    'ninety':90,
    'hundred':100, 'a hundred':100, 'one hundred':100,
  };

  function parseNumber(text) {
    text = text.trim().toLowerCase().replace(/[^a-z0-9 \-]/g, '');

    // Direct digit string
    const asInt = parseInt(text, 10);
    if (!isNaN(asInt) && String(asInt) === text) return asInt;

    // Single word
    if (WORD_MAP[text] !== undefined) return WORD_MAP[text];

    // Normalise hyphens and "and"
    const clean = text.replace(/-/g, ' ').replace(/\band\b/g, '').replace(/\s+/g, ' ').trim();

    if (WORD_MAP[clean] !== undefined) return WORD_MAP[clean];

    // Two-part: "twenty four", "forty eight", etc.
    const parts = clean.split(' ');
    if (parts.length === 2) {
      const a = WORD_MAP[parts[0]], b = WORD_MAP[parts[1]];
      if (a !== undefined && b !== undefined && a >= 20 && b > 0 && b < 10) return a + b;
    }

    // "one hundred and twenty" etc.
    if (parts.length >= 2) {
      const hundredIdx = parts.indexOf('hundred');
      if (hundredIdx !== -1) {
        const before = parts.slice(0, hundredIdx).join(' ');
        const after  = parts.slice(hundredIdx + 1).filter(p => p !== 'and').join(' ');
        const bVal = WORD_MAP[before] ?? parseInt(before, 10);
        const aVal = after ? (WORD_MAP[after] ?? parseNumber(after)) : 0;
        if (!isNaN(bVal) && bVal > 0 && aVal !== null) return bVal * 100 + (aVal ?? 0);
      }
    }

    return null;
  }

  function handleTranscript(alternatives) {
    for (const raw of alternatives) {
      const text = raw.trim().toLowerCase();

      // Navigation commands
      if (['next', 'next one', 'next question'].includes(text)) {
        callbacks.onNext?.(); return;
      }
      if (['previous', 'prev', 'back', 'previous one', 'go back'].includes(text)) {
        callbacks.onPrevious?.(); return;
      }
      if (['clear', 'delete', 'reset', 'cancel', 'erase'].includes(text)) {
        callbacks.onClear?.(); return;
      }

      // Number answer
      const num = parseNumber(text);
      if (num !== null && num >= 0 && num <= 200) {
        callbacks.onNumber?.(num);
        return;
      }
    }
  }

  function init(cbs) {
    if (!supported) return;
    callbacks = cbs;

    recognition = new SpeechRecognition();
    recognition.continuous = false;   // false works more reliably on iOS/Android
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 5;  // try multiple alternatives to catch homophones

    recognition.onresult = e => {
      const alternatives = [];
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          for (let j = 0; j < e.results[i].length; j++) {
            alternatives.push(e.results[i][j].transcript);
          }
        }
      }
      if (alternatives.length) handleTranscript(alternatives);
    };

    recognition.onend = () => {
      // Auto-restart while game is playing
      if (shouldRestart && listening) {
        try { recognition.start(); } catch (_) {}
      }
    };

    recognition.onerror = e => {
      if (e.error === 'no-speech') return; // normal timeout, onend will restart
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        listening = false;
        shouldRestart = false;
        callbacks.onStatusChange?.(false, 'denied');
      }
    };
  }

  function start() {
    if (!supported || !recognition) return;
    listening = true;
    shouldRestart = true;
    try { recognition.start(); } catch (_) {}
    callbacks.onStatusChange?.(true);
  }

  function stop() {
    if (!supported || !recognition) return;
    listening = false;
    shouldRestart = false;
    try { recognition.stop(); } catch (_) {}
    callbacks.onStatusChange?.(false);
  }

  return { supported, init, start, stop, parseNumber };
})();
