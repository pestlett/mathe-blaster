// voice.js - Web Speech API recognition for mobile voice commands
// Commands: "next", "previous", "clear", or a spoken number (the answer)

const Voice = (() => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const supported = !!SpeechRecognition;

  let recognition = null;
  let listening = false;
  let shouldRestart = false;
  let restartTimer = null;
  let watchdogTimer = null;
  let callbacks = {};

  // ---- Map game language → BCP-47 recognition lang ----
  const LANG_MAP = { en: 'en-US', de: 'de-DE', es: 'es-ES' };

  function recognitionLang() {
    const gameLang = (typeof I18n !== 'undefined') ? I18n.getLang() : 'en';
    return LANG_MAP[gameLang] || 'en-US';
  }

  // ---- Word → number tables per language ----
  // Covers 0–144 (full 1×1 to 12×12 range)

  const WORD_MAP_EN = {
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

  const WORD_MAP_DE = {
    'null':0,
    'ein':1, 'eins':1, 'eine':1,
    'zwei':2,
    'drei':3,
    'vier':4,
    'fünf':5,
    'sechs':6,
    'sieben':7,
    'acht':8,
    'neun':9,
    'zehn':10,
    'elf':11,
    'zwölf':12,
    'dreizehn':13,
    'vierzehn':14,
    'fünfzehn':15,
    'sechzehn':16,
    'siebzehn':17,
    'achtzehn':18,
    'neunzehn':19,
    'zwanzig':20,
    'einundzwanzig':21,
    'zweiundzwanzig':22,
    'dreiundzwanzig':23,
    'vierundzwanzig':24,
    'fünfundzwanzig':25,
    'sechsundzwanzig':26,
    'siebenundzwanzig':27,
    'achtundzwanzig':28,
    'neunundzwanzig':29,
    'dreißig':30, 'dreizig':30,
    'einunddreißig':31,
    'zweiunddreißig':32,
    'dreiunddreißig':33,
    'vierunddreißig':34,
    'fünfunddreißig':35,
    'sechsunddreißig':36,
    'siebenunddreißig':37,
    'achtunddreißig':38,
    'neununddreißig':39,
    'vierzig':40,
    'einundvierzig':41,
    'zweiundvierzig':42,
    'dreiundvierzig':43,
    'vierundvierzig':44,
    'fünfundvierzig':45,
    'sechsundvierzig':46,
    'siebenundvierzig':47,
    'achtundvierzig':48,
    'neunundvierzig':49,
    'fünfzig':50,
    'einundfünfzig':51,
    'zweiundfünfzig':52,
    'dreiundfünfzig':53,
    'vierundfünfzig':54,
    'fünfundfünfzig':55,
    'sechsundfünfzig':56,
    'siebenundfünfzig':57,
    'achtundfünfzig':58,
    'neunundfünfzig':59,
    'sechzig':60,
    'einundsechzig':61,
    'zweiundsechzig':62,
    'dreiundsechzig':63,
    'vierundsechzig':64,
    'fünfundsechzig':65,
    'sechsundsechzig':66,
    'siebenundsechzig':67,
    'achtundsechzig':68,
    'neunundsechzig':69,
    'siebzig':70,
    'einundsiebzig':71,
    'zweiundsiebzig':72,
    'dreiundsiebzig':73,
    'vierundsiebzig':74,
    'fünfundsiebzig':75,
    'sechsundsiebzig':76,
    'siebenundsiebzig':77,
    'achtundsiebzig':78,
    'neunundsiebzig':79,
    'achtzig':80,
    'einundachtzig':81,
    'zweiundachtzig':82,
    'dreiundachtzig':83,
    'vierundachtzig':84,
    'fünfundachtzig':85,
    'sechsundachtzig':86,
    'siebenundachtzig':87,
    'achtundachtzig':88,
    'neunundachtzig':89,
    'neunzig':90,
    'einundneunzig':91,
    'zweiundneunzig':92,
    'dreiundneunzig':93,
    'vierundneunzig':94,
    'fünfundneunzig':95,
    'sechsundneunzig':96,
    'siebenundneunzig':97,
    'achtundneunzig':98,
    'neunundneunzig':99,
    'hundert':100, 'einhundert':100,
    'einhunderteins':101, 'einhundertein':101,
    'einhundertzwei':102,
    'einhundertdrei':103,
    'einhundertvierzig':140,
    'einhunderteinundvierzig':141,
    'einhundertzweiundvierzig':142,
    'einhundertdreiundvierzig':143,
    'einhundertvierundvierzig':144,
  };

  const WORD_MAP_ES = {
    'cero':0,
    'uno':1, 'una':1,
    'dos':2,
    'tres':3,
    'cuatro':4,
    'cinco':5,
    'seis':6,
    'siete':7,
    'ocho':8,
    'nueve':9,
    'diez':10,
    'once':11,
    'doce':12,
    'trece':13,
    'catorce':14,
    'quince':15,
    'dieciséis':16, 'dieciseis':16,
    'diecisiete':17,
    'dieciocho':18,
    'diecinueve':19,
    'veinte':20,
    'veintiuno':21, 'veintiún':21,
    'veintidós':22, 'veintidos':22,
    'veintitrés':23, 'veintitres':23,
    'veinticuatro':24,
    'veinticinco':25,
    'veintiséis':26, 'veintiseis':26,
    'veintisiete':27,
    'veintiocho':28,
    'veintinueve':29,
    'treinta':30,
    'cuarenta':40,
    'cincuenta':50,
    'sesenta':60,
    'setenta':70,
    'ochenta':80,
    'noventa':90,
    'cien':100, 'ciento':100,
  };

  // Spanish compound: "treinta y uno" = 31
  const ES_TENS = { 'treinta':30, 'cuarenta':40, 'cincuenta':50, 'sesenta':60, 'setenta':70, 'ochenta':80, 'noventa':90 };
  const ES_ONES = { 'uno':1,'una':1,'dos':2,'tres':3,'cuatro':4,'cinco':5,'seis':6,'siete':7,'ocho':8,'nueve':9 };

  function getWordMap() {
    const gameLang = (typeof I18n !== 'undefined') ? I18n.getLang() : 'en';
    if (gameLang === 'de') return WORD_MAP_DE;
    if (gameLang === 'es') return WORD_MAP_ES;
    return WORD_MAP_EN;
  }

  function parseNumber(text) {
    text = text.trim().toLowerCase()
      // strip accents for fallback matching
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9 \-]/g, '');

    // Direct digit string ("42", "7")
    const asInt = parseInt(text, 10);
    if (!isNaN(asInt) && String(asInt) === text.trim()) return asInt;

    const map = getWordMap();
    const gameLang = (typeof I18n !== 'undefined') ? I18n.getLang() : 'en';

    // Normalise hyphens and "and"/"und"/"y"
    const clean = text
      .replace(/-/g, ' ')
      .replace(/\b(and|und)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Direct word lookup (single word or short phrase)
    if (map[clean] !== undefined) return map[clean];
    if (WORD_MAP_EN[clean] !== undefined) return WORD_MAP_EN[clean]; // digit fallback always

    // Spanish: "treinta y uno" → 31 (strip "y" for the lookup above, but handle explicitly)
    if (gameLang === 'es') {
      const esClean = text.replace(/\by\b/g, '').replace(/\s+/g, ' ').trim();
      if (map[esClean] !== undefined) return map[esClean];
      const esParts = esClean.split(' ').filter(Boolean);
      if (esParts.length === 2) {
        const t = ES_TENS[esParts[0]], o = ES_ONES[esParts[1]];
        if (t !== undefined && o !== undefined) return t + o;
      }
      // "ciento X" / "cien X"
      if ((esParts[0] === 'ciento' || esParts[0] === 'cien') && esParts[1]) {
        const rest = parseNumber(esParts.slice(1).join(' '));
        if (rest !== null) return 100 + rest;
      }
    }

    // English: "twenty four" / "forty eight"
    const parts = clean.split(' ').filter(Boolean);
    if (parts.length === 2) {
      const a = map[parts[0]], b = map[parts[1]];
      if (a !== undefined && b !== undefined) {
        if (a >= 20 && b > 0 && b < 10) return a + b;   // "twenty four"
        if (a === 100 && b > 0) return 100 + b;          // "hundred four"
      }
    }

    // "one hundred [and] X"
    const hundredIdx = parts.indexOf('hundred');
    if (hundredIdx !== -1) {
      const before = parts.slice(0, hundredIdx).join(' ');
      const after  = parts.slice(hundredIdx + 1).filter(p => p !== 'and' && p !== 'und').join(' ');
      const bVal = map[before] ?? WORD_MAP_EN[before] ?? parseInt(before, 10);
      const aVal = after ? parseNumber(after) : 0;
      if (!isNaN(bVal) && bVal > 0 && aVal !== null) return bVal * 100 + (aVal ?? 0);
    }

    return null;
  }

  // ---- Navigation commands per language ----
  const NAV_COMMANDS = {
    en: {
      next:     ['next', 'next one', 'next question', 'forward'],
      previous: ['previous', 'prev', 'back', 'previous one', 'go back', 'last'],
      clear:    ['clear', 'delete', 'reset', 'cancel', 'erase'],
    },
    de: {
      next:     ['weiter', 'nächste', 'vor', 'vorwärts', 'next'],
      previous: ['zurück', 'vorherige', 'vorige', 'back', 'previous'],
      clear:    ['löschen', 'zurücksetzen', 'abbrechen', 'clear'],
    },
    es: {
      next:     ['siguiente', 'adelante', 'próxima', 'next'],
      previous: ['anterior', 'atrás', 'volver', 'back', 'previous'],
      clear:    ['borrar', 'limpiar', 'cancelar', 'clear'],
    },
  };

  function handleTranscript(alternatives) {
    const gameLang = (typeof I18n !== 'undefined') ? I18n.getLang() : 'en';
    const cmds = NAV_COMMANDS[gameLang] || NAV_COMMANDS.en;

    for (const raw of alternatives) {
      const text = raw.trim().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

      if (cmds.next.includes(text)) {
        console.log('[Voice] command: next');
        callbacks.onNext?.(); return;
      }
      if (cmds.previous.includes(text)) {
        console.log('[Voice] command: previous');
        callbacks.onPrevious?.(); return;
      }
      if (cmds.clear.includes(text)) {
        console.log('[Voice] command: clear');
        callbacks.onClear?.(); return;
      }

      const num = parseNumber(text);
      if (num !== null && num >= 0 && num <= 200) {
        console.log(`[Voice] number ${num} (from "${raw.trim()}")`);
        callbacks.onNumber?.(num);
        return;
      }
    }
    console.log('[Voice] no match for:', alternatives);
  }

  // ---- Watchdog: if recognition silently dies, restart ----
  const WATCHDOG_MS = 8000;
  function resetWatchdog() {
    clearTimeout(watchdogTimer);
    if (shouldRestart && listening) {
      watchdogTimer = setTimeout(() => {
        if (shouldRestart && listening) {
          console.log('[Voice] watchdog restart');
          try { recognition.stop(); } catch (_) {}
          // onend will trigger the actual restart
        }
      }, WATCHDOG_MS);
    }
  }

  function scheduleRestart() {
    clearTimeout(restartTimer);
    restartTimer = setTimeout(() => {
      if (shouldRestart && listening) {
        recognition.lang = recognitionLang();
        try {
          recognition.start();
          resetWatchdog();
        } catch (e) {
          // If already running, that's fine; otherwise retry once more
          if (e.name !== 'InvalidStateError') {
            setTimeout(scheduleRestart, 200);
          }
        }
      }
    }, 80); // tight gap — was 300ms
  }

  function init(cbs) {
    if (!supported) return;
    callbacks = cbs;

    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.maxAlternatives = 5;

    recognition.onresult = e => {
      resetWatchdog();
      const alternatives = [];
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          for (let j = 0; j < e.results[i].length; j++) {
            alternatives.push(e.results[i][j].transcript);
          }
        }
      }
      if (alternatives.length) {
        console.log('[Voice] heard:', alternatives);
        handleTranscript(alternatives);
      }
    };

    recognition.onstart = () => {
      resetWatchdog();
    };

    recognition.onend = () => {
      clearTimeout(watchdogTimer);
      if (shouldRestart && listening) scheduleRestart();
    };

    recognition.onerror = e => {
      console.log('[Voice] error:', e.error);
      if (e.error === 'no-speech') return;    // onend will restart
      if (e.error === 'aborted')   return;    // our own stop()
      if (e.error === 'network') {
        // transient — let onend fire and restart
        return;
      }
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        listening = false;
        shouldRestart = false;
        clearTimeout(restartTimer);
        clearTimeout(watchdogTimer);
        callbacks.onStatusChange?.(false, 'denied');
      }
    };
  }

  function start() {
    if (!supported || !recognition) return;
    listening = true;
    shouldRestart = true;
    recognition.lang = recognitionLang();
    try {
      recognition.start();
      resetWatchdog();
    } catch (_) {}
    callbacks.onStatusChange?.(true);
  }

  function stop() {
    if (!supported || !recognition) return;
    listening = false;
    shouldRestart = false;
    clearTimeout(restartTimer);
    clearTimeout(watchdogTimer);
    try { recognition.stop(); } catch (_) {}
    callbacks.onStatusChange?.(false);
  }

  return { supported, init, start, stop, parseNumber };
})();
