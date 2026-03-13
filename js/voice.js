// voice.js - Web Speech API recognition for mobile voice commands
// Commands: "next", "previous", "clear", "fire", or a spoken number (the answer)

const Voice = (() => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const supported = !!SpeechRecognition;

  let recognition   = null;
  let listening     = false;
  let shouldRestart = false;
  let restartTimer  = null;
  let watchdogTimer = null;
  let callbacks     = {};

  // Debounce: prevent the same number firing twice within this window
  const DEBOUNCE_MS = 1500;
  let lastFiredNum  = null;
  let lastFiredTime = 0;

  // While TTS is speaking, discard all SR results so the mic doesn't
  // hear the speaker output. SR stays running (no restart dead zone).
  let resultsMuted = false;

  // Echo-tail filter: even after muteResults → false, reject numbers that
  // match what TTS just said, for a short grace window (acoustic echo arrives
  // 50–400 ms after onend on most hardware).
  let _echoGraceUntil = 0;
  let _echoNums       = new Set(); // numeric values spoken in the last TTS

  function setTTSEchoFilter(nums, graceMs) {
    _echoNums       = new Set(nums);
    _echoGraceUntil = Date.now() + graceMs;
  }

  // getUserMedia echo-cancellation priming — done once on first mic use.
  // On Chrome/Android this primes the audio subsystem to use hardware AEC
  // before SpeechRecognition opens its own mic stream.
  let _micPrimed = false;
  function _primeMic() {
    if (_micPrimed || !navigator.mediaDevices?.getUserMedia) return;
    _micPrimed = true;
    navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: { ideal: true },
        noiseSuppression: { ideal: true },
        autoGainControl:  { ideal: true },
      }
    }).then(stream => {
      // Hold the stream open so the constraint stays active for SR
      window._voiceMicStream = stream;
    }).catch(() => {});
  }

  // ---- Map game language → BCP-47 recognition lang ----
  const LANG_MAP = { en: 'en-US', de: 'de-DE', es: 'es-ES' };
  function recognitionLang() {
    const l = (typeof I18n !== 'undefined') ? I18n.getLang() : 'en';
    return LANG_MAP[l] || 'en-US';
  }

  // ---- Noise word stripping ----
  // Removes filler words so "um forty eight" → "forty eight"
  const NOISE_RE = /\b(um+|uh+|err?|hmm+|like|the|a|an|my|is|it'?s?|answer|i think|i say|i|got|let me see)\b/g;
  function stripNoise(text) {
    return text.replace(NOISE_RE, '').replace(/\s+/g, ' ').trim();
  }

  // ---- Word → number tables per language ----
  const WORD_MAP_EN = {
    'zero':0, 'oh':0,
    'one':1, 'won':1,
    'two':2, 'to':2, 'too':2,
    'three':3, 'tree':3,
    'four':4, 'for':4, 'fore':4,
    'five':5, 'six':6, 'seven':7,
    'eight':8, 'ate':8,
    'nine':9, 'niner':9,
    'ten':10, 'eleven':11, 'twelve':12,
    'thirteen':13, 'fourteen':14, 'fifteen':15,
    'sixteen':16, 'seventeen':17, 'eighteen':18, 'nineteen':19,
    'twenty':20, 'thirty':30, 'forty':40, 'fourty':40,
    'fifty':50, 'sixty':60, 'seventy':70, 'eighty':80, 'ninety':90,
    'hundred':100, 'a hundred':100, 'one hundred':100,
  };

  const WORD_MAP_DE = {
    'null':0,
    'ein':1, 'eins':1, 'eine':1, 'zwei':2, 'drei':3, 'vier':4,
    'fünf':5, 'sechs':6, 'sieben':7, 'acht':8, 'neun':9, 'zehn':10,
    'elf':11, 'zwölf':12, 'dreizehn':13, 'vierzehn':14, 'fünfzehn':15,
    'sechzehn':16, 'siebzehn':17, 'achtzehn':18, 'neunzehn':19,
    'zwanzig':20,
    'einundzwanzig':21, 'zweiundzwanzig':22, 'dreiundzwanzig':23,
    'vierundzwanzig':24, 'fünfundzwanzig':25, 'sechsundzwanzig':26,
    'siebenundzwanzig':27, 'achtundzwanzig':28, 'neunundzwanzig':29,
    'dreißig':30, 'dreizig':30,
    'einunddreißig':31, 'zweiunddreißig':32, 'dreiunddreißig':33,
    'vierunddreißig':34, 'fünfunddreißig':35, 'sechsunddreißig':36,
    'siebenunddreißig':37, 'achtunddreißig':38, 'neununddreißig':39,
    'vierzig':40,
    'einundvierzig':41, 'zweiundvierzig':42, 'dreiundvierzig':43,
    'vierundvierzig':44, 'fünfundvierzig':45, 'sechsundvierzig':46,
    'siebenundvierzig':47, 'achtundvierzig':48, 'neunundvierzig':49,
    'fünfzig':50,
    'einundfünfzig':51, 'zweiundfünfzig':52, 'dreiundfünfzig':53,
    'vierundfünfzig':54, 'fünfundfünfzig':55, 'sechsundfünfzig':56,
    'siebenundfünfzig':57, 'achtundfünfzig':58, 'neunundfünfzig':59,
    'sechzig':60,
    'einundsechzig':61, 'zweiundsechzig':62, 'dreiundsechzig':63,
    'vierundsechzig':64, 'fünfundsechzig':65, 'sechsundsechzig':66,
    'siebenundsechzig':67, 'achtundsechzig':68, 'neunundsechzig':69,
    'siebzig':70,
    'einundsiebzig':71, 'zweiundsiebzig':72, 'dreiundsiebzig':73,
    'vierundsiebzig':74, 'fünfundsiebzig':75, 'sechsundsiebzig':76,
    'siebenundsiebzig':77, 'achtundsiebzig':78, 'neunundsiebzig':79,
    'achtzig':80,
    'einundachtzig':81, 'zweiundachtzig':82, 'dreiundachtzig':83,
    'vierundachtzig':84, 'fünfundachtzig':85, 'sechsundachtzig':86,
    'siebenundachtzig':87, 'achtundachtzig':88, 'neunundachtzig':89,
    'neunzig':90,
    'einundneunzig':91, 'zweiundneunzig':92, 'dreiundneunzig':93,
    'vierundneunzig':94, 'fünfundneunzig':95, 'sechsundneunzig':96,
    'siebenundneunzig':97, 'achtundneunzig':98, 'neunundneunzig':99,
    'hundert':100, 'einhundert':100,
    'einhunderteins':101, 'einhundertein':101, 'einhundertzwei':102,
    'einhundertdrei':103, 'einhundertvierzig':140,
    'einhunderteinundvierzig':141, 'einhundertzweiundvierzig':142,
    'einhundertdreiundvierzig':143, 'einhundertvierundvierzig':144,
  };

  const WORD_MAP_ES = {
    'cero':0, 'uno':1, 'una':1, 'dos':2, 'tres':3, 'cuatro':4,
    'cinco':5, 'seis':6, 'siete':7, 'ocho':8, 'nueve':9, 'diez':10,
    'once':11, 'doce':12, 'trece':13, 'catorce':14, 'quince':15,
    'dieciséis':16, 'dieciseis':16, 'diecisiete':17, 'dieciocho':18,
    'diecinueve':19, 'veinte':20,
    'veintiuno':21, 'veintiún':21, 'veintidós':22, 'veintidos':22,
    'veintitrés':23, 'veintitres':23, 'veinticuatro':24, 'veinticinco':25,
    'veintiséis':26, 'veintiseis':26, 'veintisiete':27, 'veintiocho':28,
    'veintinueve':29,
    'treinta':30, 'cuarenta':40, 'cincuenta':50, 'sesenta':60,
    'setenta':70, 'ochenta':80, 'noventa':90, 'cien':100, 'ciento':100,
  };
  const ES_TENS = { 'treinta':30,'cuarenta':40,'cincuenta':50,'sesenta':60,'setenta':70,'ochenta':80,'noventa':90 };
  const ES_ONES = { 'uno':1,'una':1,'dos':2,'tres':3,'cuatro':4,'cinco':5,'seis':6,'siete':7,'ocho':8,'nueve':9 };

  function getWordMap() {
    const l = (typeof I18n !== 'undefined') ? I18n.getLang() : 'en';
    if (l === 'de') return WORD_MAP_DE;
    if (l === 'es') return WORD_MAP_ES;
    return WORD_MAP_EN;
  }

  // ---- Number parser ----
  function parseNumber(text) {
    text = text.trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9 \-]/g, '');
    if (!text) return null;

    // Direct digit string ("42", "7")
    const asInt = parseInt(text, 10);
    if (!isNaN(asInt) && String(asInt) === text.trim()) return asInt;

    // Space-separated digit tokens: "1 1" → 1, "2 1" → 21
    const digitTokens = text.trim().split(/\s+/);
    if (digitTokens.length > 1 && digitTokens.every(t => /^\d+$/.test(t))) {
      const nums = digitTokens.map(Number);
      if (nums.every(n => n === nums[0])) return nums[0];
      const concat = parseInt(digitTokens.join(''), 10);
      if (!isNaN(concat)) return concat;
    }

    const map  = getWordMap();
    const lang = (typeof I18n !== 'undefined') ? I18n.getLang() : 'en';
    const clean = text.replace(/-/g, ' ').replace(/\b(and|und)\b/g, '').replace(/\s+/g, ' ').trim();

    if (map[clean]         !== undefined) return map[clean];
    if (WORD_MAP_EN[clean] !== undefined) return WORD_MAP_EN[clean];

    // Spanish compound: "treinta y uno" → 31
    if (lang === 'es') {
      const esClean = text.replace(/\by\b/g, '').replace(/\s+/g, ' ').trim();
      if (map[esClean] !== undefined) return map[esClean];
      const ep = esClean.split(' ').filter(Boolean);
      if (ep.length === 2) {
        const tv = ES_TENS[ep[0]], ov = ES_ONES[ep[1]];
        if (tv !== undefined && ov !== undefined) return tv + ov;
      }
      if ((ep[0] === 'ciento' || ep[0] === 'cien') && ep[1]) {
        const rest = parseNumber(ep.slice(1).join(' '));
        if (rest !== null) return 100 + rest;
      }
    }

    // "twenty four", "forty eight"
    const parts = clean.split(' ').filter(Boolean);
    if (parts.length === 2) {
      const a = map[parts[0]], b = map[parts[1]];
      if (a !== undefined && b !== undefined) {
        if (a >= 20 && b > 0 && b < 10) return a + b;
        if (a === 100 && b > 0) return 100 + b;
      }
    }

    // "one hundred [and] forty four"
    const hundredIdx = parts.indexOf('hundred');
    if (hundredIdx !== -1) {
      const before = parts.slice(0, hundredIdx).join(' ');
      const after  = parts.slice(hundredIdx + 1).filter(p => p !== 'and' && p !== 'und').join(' ');
      const bVal = map[before] ?? WORD_MAP_EN[before] ?? parseInt(before, 10);
      const aVal = after ? parseNumber(after) : 0;
      if (!isNaN(bVal) && bVal > 0 && aVal !== null) return bVal * 100 + (aVal ?? 0);
    }

    // Last resort: try again after stripping noise words
    const denoised = stripNoise(clean);
    if (denoised && denoised !== clean) return parseNumber(denoised);

    return null;
  }

  // ---- Navigation + fire commands per language ----
  const NAV_COMMANDS = {
    en: {
      next:     ['next', 'next one', 'next question', 'forward'],
      previous: ['previous', 'prev', 'back', 'previous one', 'go back', 'last'],
      clear:    ['clear', 'delete', 'reset', 'cancel', 'erase'],
      fire:     ['fire', 'shoot', 'submit', 'go', 'enter', 'yes', 'yeah', 'done'],
    },
    de: {
      next:     ['weiter', 'nächste', 'vor', 'vorwärts', 'next'],
      previous: ['zurück', 'vorherige', 'vorige', 'back'],
      clear:    ['löschen', 'zurücksetzen', 'abbrechen', 'clear'],
      fire:     ['feuer', 'schießen', 'abschicken', 'fertig', 'ja', 'fire'],
    },
    es: {
      next:     ['siguiente', 'adelante', 'próxima', 'next'],
      previous: ['anterior', 'atrás', 'volver', 'back'],
      clear:    ['borrar', 'limpiar', 'cancelar', 'clear'],
      fire:     ['fuego', 'disparar', 'enviar', 'listo', 'sí', 'fire'],
    },
  };

  // ---- Final transcript handling ----
  function handleTranscript(alternatives, confidences) {
    if (resultsMuted) return;
    // Belt-and-suspenders: if TTS is still playing (onend fired early on some
    // platforms), treat it the same as resultsMuted.
    if (window.speechSynthesis?.speaking) return;
    const lang = (typeof I18n !== 'undefined') ? I18n.getLang() : 'en';
    const cmds = NAV_COMMANDS[lang] || NAV_COMMANDS.en;

    const texts = alternatives
      .map(r => r.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
      .filter(t => t.length > 0);

    if (!texts.length) return;

    // Commands: highest-confidence (first) match wins
    for (const text of texts) {
      if (cmds.fire.includes(text))     { console.log('[Voice] cmd: fire');     callbacks.onFire?.();     callbacks.onResultDone?.(); return; }
      if (cmds.next.includes(text))     { console.log('[Voice] cmd: next');     callbacks.onNext?.();     callbacks.onResultDone?.(); return; }
      if (cmds.previous.includes(text)) { console.log('[Voice] cmd: previous'); callbacks.onPrevious?.(); callbacks.onResultDone?.(); return; }
      if (cmds.clear.includes(text))    { console.log('[Voice] cmd: clear');    callbacks.onClear?.();    callbacks.onResultDone?.(); return; }
    }

    // Confidence floor: discard results that are unusually low confidence.
    // (Only applied when the engine actually reports non-zero scores — Chrome
    // on Firefox reports 0 for everything so we skip the check there.)
    const maxConf = confidences?.reduce((m, c) => Math.max(m, c), 0) ?? 0;
    if (maxConf > 0 && maxConf < 0.45) {
      console.log('[Voice] low confidence, discarding:', maxConf, alternatives);
      callbacks.onResultDone?.();
      return;
    }

    // Numbers: confidence-weighted voting across all alternatives.
    // Falls back to position-based weight (1/rank) when confidence scores are
    // all zero (common on some engines/platforms).
    const votes = {};
    texts.forEach((text, idx) => {
      const conf = (confidences?.[idx] > 0) ? confidences[idx] : (1 / (idx + 1));
      // Try raw text first, then noise-stripped
      const candidates = [text, stripNoise(text)].filter((t, i, arr) => t && arr.indexOf(t) === i);
      for (const t of candidates) {
        const n = parseNumber(t);
        if (n !== null && n >= 0 && n <= 200) {
          votes[n] = (votes[n] || 0) + conf;
          break; // only count this alternative once
        }
      }
    });

    const entries = Object.entries(votes);
    if (!entries.length) {
      console.log('[Voice] no match for:', alternatives);
      callbacks.onResultDone?.();
      return;
    }

    const maxWeight = Math.max(...entries.map(([, w]) => w));
    const topTier   = new Set(entries.filter(([, w]) => w >= maxWeight - 0.001).map(([n]) => Number(n)));

    // Among tied top candidates, prefer the one from the highest-confidence alternative
    let winner = null;
    for (const text of texts) {
      const n = parseNumber(text) ?? parseNumber(stripNoise(text));
      if (n !== null && topTier.has(n)) { winner = n; break; }
    }
    if (winner === null) winner = Number(entries[0][0]);

    // Echo-tail filter: reject if this number was in the last TTS utterance
    // and we're still within the acoustic-echo grace window.
    if (Date.now() < _echoGraceUntil && _echoNums.has(winner)) {
      console.log(`[Voice] echo filter: ${winner} matches TTS token, discarding`);
      callbacks.onResultDone?.();
      return;
    }

    // Debounce: ignore identical answer within DEBOUNCE_MS
    const now = Date.now();
    if (winner === lastFiredNum && now - lastFiredTime < DEBOUNCE_MS) {
      console.log(`[Voice] dedup skip ${winner}`);
      return;
    }
    lastFiredNum  = winner;
    lastFiredTime = now;

    console.log(`[Voice] → ${winner} | weights ${JSON.stringify(votes)} | alts`, alternatives);
    callbacks.onNumber?.(winner);
    callbacks.onResultDone?.();
  }

  // ---- Interim result handler ----
  // Shows the partially-recognised number in the input field while the user
  // is still speaking, giving immediate visual feedback.
  function handleInterim(transcript) {
    if (resultsMuted) return;
    if (window.speechSynthesis?.speaking) return;
    const text = transcript.trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const n = parseNumber(text) ?? parseNumber(stripNoise(text));
    if (n !== null && n >= 0 && n <= 200) callbacks.onInterim?.(n);
  }

  // ---- Watchdog ----
  // Uses abort() so any buffered/pending audio is discarded rather than
  // delivered as a stale result in the new session.
  const WATCHDOG_MS = 8000;
  function resetWatchdog() {
    clearTimeout(watchdogTimer);
    if (shouldRestart && listening) {
      watchdogTimer = setTimeout(() => {
        if (shouldRestart && listening) {
          console.log('[Voice] watchdog abort+restart');
          try { recognition.abort(); } catch (_) {}
        }
      }, WATCHDOG_MS);
    }
  }

  function scheduleRestart() {
    clearTimeout(restartTimer);
    restartTimer = setTimeout(() => {
      if (!shouldRestart || !listening) return;
      recognition.lang = recognitionLang();
      try {
        recognition.start();
        resetWatchdog();
      } catch (e) {
        if (e.name !== 'InvalidStateError') setTimeout(scheduleRestart, 200);
      }
    }, 80);
  }

  // ---- Core recognition setup ----
  function init(cbs) {
    if (!supported) return;
    callbacks = cbs;

    recognition = new SpeechRecognition();
    recognition.continuous     = true;
    recognition.interimResults = true;   // live input-field population
    recognition.maxAlternatives = 5;

    recognition.onstart = () => {
      resetWatchdog();
      callbacks.onStatusChange?.(true);
    };

    // Sound/speech lifecycle — drives the 4-state mic button UI
    recognition.onsoundstart  = () => callbacks.onSoundStart?.();
    recognition.onsoundend    = () => callbacks.onSoundEnd?.();
    recognition.onspeechstart = () => callbacks.onSpeechStart?.();
    // onspeechend fires when the engine stops detecting speech but before
    // the final result arrives — this is the "I heard you, thinking..." gap
    recognition.onspeechend   = () => callbacks.onSpeechEnd?.();

    recognition.onresult = e => {
      resetWatchdog();
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        if (result.isFinal) {
          const alts  = [];
          const confs = [];
          for (let j = 0; j < result.length; j++) {
            alts.push(result[j].transcript);
            confs.push(result[j].confidence);
          }
          console.log('[Voice] final:', alts, '| conf:', confs);
          handleTranscript(alts, confs);
        } else {
          // Interim: pre-populate input field
          handleInterim(result[0].transcript);
        }
      }
    };

    recognition.onend = () => {
      clearTimeout(watchdogTimer);
      if (shouldRestart && listening) scheduleRestart();
    };

    recognition.onerror = e => {
      console.log('[Voice] error:', e.error);
      if (e.error === 'no-speech') return;   // onend fires → restart
      if (e.error === 'aborted')   return;   // our own abort()
      if (e.error === 'network')   return;   // transient → onend fires → restart
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        listening = shouldRestart = false;
        clearTimeout(restartTimer);
        clearTimeout(watchdogTimer);
        callbacks.onStatusChange?.(false, 'denied');
      }
    };
  }

  function start() {
    if (!supported || !recognition) return;
    _primeMic();           // prime AEC before SR opens mic (no-op after first call)
    resultsMuted  = false; // clear any stale mute from previous TTS
    listening = shouldRestart = true;
    lastFiredNum  = null;  // reset debounce on new game session
    lastFiredTime = 0;
    recognition.lang = recognitionLang();
    // NOTE: do NOT call onStatusChange(true) here — SR is not yet capturing.
    // recognition.onstart fires when the engine is actually listening; that's
    // the sole place we signal "ready" so the mic icon reflects reality.
    try { recognition.start(); resetWatchdog(); } catch (_) {}
  }

  function stop() {
    if (!supported || !recognition) return;
    listening = shouldRestart = false;
    clearTimeout(restartTimer);
    clearTimeout(watchdogTimer);
    try { recognition.stop(); } catch (_) {}
    callbacks.onStatusChange?.(false);
  }

  function muteResults(v) { resultsMuted = v; }

  return { supported, init, start, stop, muteResults, setTTSEchoFilter, parseNumber };
})();
