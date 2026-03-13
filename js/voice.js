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
  let lastFiredQuestionKey = '';
  let activeQuestionKey = '';

  // Delayed fire for conf=0 streaming partials (Android/Chrome SR behaviour).
  // The engine fires isFinal=true with conf=0 for each growing token chunk:
  //   "2" → "2 *" → "2 * 11" → "2 * 11 22" (conf=0.87, fires immediately)
  // Holding conf=0 results 320ms lets later chunks cancel earlier wrong ones.
  const PARTIAL_DELAY_MS = 320;
  let _pendingFire    = null;
  let _pendingCommand = null;

  let _triggerMode = false;
  let _triggerWord = '';  // user's preferred word (empty = use cmds.fire list)

  function cancelPending() {
    if (_pendingFire) { clearTimeout(_pendingFire.timer); _pendingFire = null; }
  }

  function cancelPendingCommand() {
    if (_pendingCommand) { clearTimeout(_pendingCommand.timer); _pendingCommand = null; }
  }

  function _doFire(winner, votes, alternatives) {
    cancelPendingCommand(); // a number firing supersedes any pending fire command
    lastFiredNum  = winner;
    lastFiredTime = Date.now();
    lastFiredQuestionKey = activeQuestionKey || '';
    console.log(`[Voice] → ${winner} | weights ${JSON.stringify(votes)} | alts`, alternatives);
    _tlog('onNumber', `→ ${winner}`);
    callbacks.onNumber?.(winner);
    callbacks.onResultDone?.();
  }

  // While TTS is speaking, discard all SR results so the mic doesn't
  // hear the speaker output. SR stays running (no restart dead zone).
  let resultsMuted = false;

  // Echo-tail filters:
  // 1) short number guard for raw operand echoes ("7")
  // 2) longer question-pattern guard for phrase echoes ("7 times 8", "78")
  let _echoNums            = new Set();
  let _echoOperandNums     = [];
  let _echoConcatNums      = new Set();
  let _echoNumberGuardUntil = 0;
  let _echoPhraseGuardUntil = 0;
  let _echoOperatorWords    = new Set(['times', 'x']);

  const OPERATOR_WORDS = {
    en: ['times', 'x'],
    de: ['mal', 'x'],
    es: ['por', 'x'],
  };

  function setTTSEchoFilter(config, legacyGraceMs) {
    const lang = (typeof I18n !== 'undefined') ? I18n.getLang() : 'en';
    let nums = [];
    let operands = [];
    let numberGraceMs = 0;
    let phraseGraceMs = 0;
    let opLang = lang;

    if (Array.isArray(config)) {
      nums = config;
      operands = config;
      numberGraceMs = legacyGraceMs || 0;
      phraseGraceMs = legacyGraceMs || 0;
    } else {
      nums = config?.nums || [];
      operands = config?.operands || nums;
      numberGraceMs = config?.numberGraceMs ?? config?.graceMs ?? legacyGraceMs ?? 0;
      phraseGraceMs = config?.phraseGraceMs ?? config?.graceMs ?? legacyGraceMs ?? 0;
      opLang = config?.lang || lang;
    }

    _echoNums = new Set(
      nums.map(n => Number(n)).filter(n => Number.isInteger(n) && n >= 0 && n <= 200)
    );
    _echoOperandNums = [...new Set(
      operands.map(n => Number(n)).filter(n => Number.isInteger(n) && n >= 0 && n <= 200)
    )];
    _echoConcatNums = new Set();
    if (_echoOperandNums.length >= 2) {
      const [a, b] = _echoOperandNums;
      _echoConcatNums.add(Number(`${a}${b}`));
      _echoConcatNums.add(Number(`${b}${a}`));
    }
    _echoOperatorWords = new Set(OPERATOR_WORDS[opLang] || OPERATOR_WORDS.en);
    const now = Date.now();
    _echoNumberGuardUntil = now + Math.max(0, numberGraceMs);
    _echoPhraseGuardUntil = now + Math.max(0, phraseGraceMs);
  }

  // NOTE: getUserMedia priming was removed — holding a stream open with
  // getUserMedia locks the mic on mobile (iOS/Android exclusive access),
  // preventing SpeechRecognition from starting. The other echo-suppression
  // layers (adaptive unmute delay and echo-tail filtering) are
  // sufficient without it.

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

  function normalizeSpeechText(text) {
    return text.trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9 \-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function parseAtomicToken(token) {
    if (!token) return null;
    if (/^\d+$/.test(token)) return Number(token);
    const map = getWordMap();
    if (map[token] !== undefined) return map[token];
    if (WORD_MAP_EN[token] !== undefined) return WORD_MAP_EN[token];
    return null;
  }

  function looksLikeQuestionEcho(text) {
    if (_echoOperandNums.length < 2) return false;
    const normalized = normalizeSpeechText(text);
    if (!normalized) return false;

    const tokens = normalized.split(' ').filter(Boolean);
    const atomNums = tokens.map(parseAtomicToken).filter(n => n !== null);
    const atomSet = new Set(atomNums);
    const hasBothOperands = _echoOperandNums.every(n => atomSet.has(n));
    const hasOperatorWord = tokens.some(t => _echoOperatorWords.has(t));

    if (hasBothOperands && (hasOperatorWord || atomNums.length >= 2)) return true;

    const compact = normalized.replace(/\s+/g, '');
    if (/^\d+$/.test(compact) && _echoConcatNums.has(Number(compact))) return true;

    return false;
  }

  // Content-based echo filter (no time limit).
  // Blocks results that are purely the question being read back, identified by:
  //   - contains an explicit multiplication operator word (times, x, mal, por…)
  //   - all parseable numeric tokens match the question operands (no extra answer digit)
  // Without an operator word we can't distinguish "eight" (answer) from echo.
  function looksLikePureEcho(text) {
    if (_echoOperandNums.length < 2) return false;
    const normalized = normalizeSpeechText(text);
    if (!normalized) return false;
    const tokens = normalized.split(' ').filter(Boolean);
    const hasOperator = tokens.some(t => _echoOperatorWords.has(t) || t === '*');
    if (!hasOperator) return false;
    const numTokens = tokens.map(parseAtomicToken).filter(n => n !== null);
    // If there are more numeric tokens than operands the user added the answer too — not a pure echo.
    if (numTokens.length > _echoOperandNums.length) return false;
    const operandSet = new Set(_echoOperandNums);
    return numTokens.every(n => operandSet.has(n));
  }

  // ---- Number parser ----
  function parseNumber(text) {
    text = normalizeSpeechText(text);
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

  function setTriggerMode(enabled, word) {
    _triggerMode = !!enabled;
    _triggerWord = (word || '').trim().toLowerCase();
  }

  // ---- Final transcript handling ----
  function handleTranscript(alternatives, confidences) {
    if (resultsMuted) return;
    // Every new result supersedes any pending conf=0 partial from before.
    cancelPending();
    cancelPendingCommand();
    const lang = (typeof I18n !== 'undefined') ? I18n.getLang() : 'en';
    const cmds = NAV_COMMANDS[lang] || NAV_COMMANDS.en;

    const texts = alternatives
      .map(r => r.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
      .filter(t => t.length > 0);

    if (!texts.length) return;

    // Compute confidence up front — needed by tryCommand for fire delay.
    const primaryConf = confidences?.[0] ?? 0;

    // Commands: try exact match first, then last-word fallback.
    // The last-word fallback handles SR picking up ambient audio before
    // the command word, e.g. "tea fire" → "fire", "here fire" → "fire".
    // "fire" with conf=0 is held briefly (same as number partials) so that
    // a corrected result ("fire 39" → number 39) can cancel it first.
    function tryCommand(text) {
      if (cmds.fire.includes(text)) {
        if (primaryConf > 0) {
          console.log('[Voice] cmd: fire');
          callbacks.onFire?.();
          callbacks.onResultDone?.();
        } else {
          _pendingCommand = { timer: setTimeout(() => {
            _pendingCommand = null;
            console.log('[Voice] cmd: fire (delayed)');
            callbacks.onFire?.();
            callbacks.onResultDone?.();
          }, PARTIAL_DELAY_MS) };
        }
        return true;
      }
      if (cmds.next.includes(text))     { console.log('[Voice] cmd: next');     callbacks.onNext?.();     callbacks.onResultDone?.(); return true; }
      if (cmds.previous.includes(text)) { console.log('[Voice] cmd: previous'); callbacks.onPrevious?.(); callbacks.onResultDone?.(); return true; }
      if (cmds.clear.includes(text))    { console.log('[Voice] cmd: clear');    callbacks.onClear?.();    callbacks.onResultDone?.(); return true; }
      return false;
    }
    for (const text of texts) {
      if (tryCommand(text)) return;
      const lastWord = text.split(/\s+/).pop();
      if (lastWord && lastWord !== text && tryCommand(lastWord)) return;
    }

    // In trigger-word mode: only proceed to number voting if a fire-cmd word
    // appears in the transcript. "fire 39" fires 39; "39" alone is ignored.
    if (_triggerMode) {
      const trigWords = _triggerWord ? [_triggerWord, ...cmds.fire] : cmds.fire;
      const hasTrigger = texts.some(t => t.split(/\s+/).some(w => trigWords.includes(w)));
      if (!hasTrigger) {
        callbacks.onResultDone?.();
        return;
      }
    }

    // Numbers: confidence-weighted voting across all alternatives.
    // Falls back to position-based weight (1/rank) when confidence scores are
    // all zero (common on some engines/platforms).
    const allCmdWords = new Set(Object.values(cmds).flat());
    const votes = {};
    texts.forEach((text, idx) => {
      const conf = (confidences?.[idx] > 0) ? confidences[idx] : (1 / (idx + 1));
      // Candidate order (tried in sequence, first successful parse wins):
      //   1. raw text
      //   2. noise-stripped text
      //   3. command-words-stripped text — fixes "fire forty eight" → "forty eight" → 48
      //   4. first non-command parseable token — fixes "44 fire for" → 44 (vs lastToken "for"→4)
      //   5. last token — catches "here six" → 6, "2 x 9 18" → 18
      const lastToken = text.split(/\s+/).filter(Boolean).pop() || '';
      const firstNumNonCmd = text.split(/\s+/).filter(t => t && !allCmdWords.has(t) && parseAtomicToken(t) !== null)[0] || '';
      // Strip any command words from the text so "fire forty eight" → "forty eight" → 48.
      // Build a regex from all command words in this language.
      const allCmdList = Object.values(cmds).flat();
      const allCmdRe   = new RegExp(
        `\\b(${allCmdList.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'gi'
      );
      const textNoCmd  = text.replace(allCmdRe, '').replace(/\s+/g, ' ').trim();
      const candidates = [text, stripNoise(text), textNoCmd, firstNumNonCmd, lastToken]
        .filter((t, i, arr) => t && arr.indexOf(t) === i);
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

    const now = Date.now();

    // Question-pattern echo filter: catches read-back variants like
    // "6 times 8", "six eight", or "68" right after TTS.
    if (now < _echoPhraseGuardUntil && texts.some(looksLikeQuestionEcho)) {
      console.log('[Voice] echo filter: question phrase match, discarding', alternatives);
      callbacks.onResultDone?.();
      return;
    }

    // Content-based echo filter (no time limit): blocks "2 times 2", "2 x 2" etc.
    // even when TTS guard has already expired.
    if (texts.some(looksLikePureEcho)) {
      console.log('[Voice] echo filter: pure question echo, discarding', alternatives);
      callbacks.onResultDone?.();
      return;
    }

    // Operand-only fallback: keep this short to avoid blocking valid fast
    // answers on facts like 1×7 where the answer equals a spoken operand.
    if (now < _echoNumberGuardUntil && _echoNums.has(winner)) {
      console.log(`[Voice] echo filter: ${winner} matches TTS token, discarding`);
      callbacks.onResultDone?.();
      return;
    }

    // Debounce within the same active question only.
    const sameQuestion = !!activeQuestionKey && activeQuestionKey === lastFiredQuestionKey;
    if (sameQuestion && winner === lastFiredNum && now - lastFiredTime < DEBOUNCE_MS) {
      console.log(`[Voice] dedup skip ${winner}`);
      callbacks.onResultDone?.();
      return;
    }
    if (primaryConf > 0) {
      // Confident result — fire immediately.
      _doFire(winner, votes, alternatives);
    } else {
      // conf=0 streaming partial — hold briefly so the engine can extend it.
      // If a better result arrives within PARTIAL_DELAY_MS it cancels this one.
      const snap = { winner, votes, alternatives };
      _pendingFire = { winner, timer: setTimeout(() => {
        _pendingFire = null;
        _doFire(snap.winner, snap.votes, snap.alternatives);
      }, PARTIAL_DELAY_MS) };
    }
  }

  // ---- Interim result handler ----
  // Shows the partially-recognised number in the input field while the user
  // is still speaking, giving immediate visual feedback.
  function handleInterim(transcript) {
    if (resultsMuted) return;
    const text = normalizeSpeechText(transcript);
    const n = parseNumber(text) ?? parseNumber(stripNoise(text));
    if (n !== null && n >= 0 && n <= 200) callbacks.onInterim?.(n);
  }

  // ---- Timing trace (leave enabled — helps diagnose voice lag on mobile) ----
  const _perf = (typeof performance !== 'undefined') ? performance : { now: () => Date.now() };
  let _t = {};
  function _tlog(label, extra = '') {
    const now = _perf.now();
    const abs = Math.round(now);
    if (!_t.sound) {
      console.log(`[Voice:t] ${label} @${abs}ms${extra ? ' ' + extra : ''}`);
      return;
    }
    const fromSound   = Math.round(now - _t.sound);
    const fromPrev    = _t.prev ? Math.round(now - _t.prev) : 0;
    const prevLabel   = _t.prevLabel || '?';
    console.log(`[Voice:t] ${label} | +${fromPrev}ms since ${prevLabel} | ${fromSound}ms since sound${extra ? ' | ' + extra : ''}`);
    _t.prev = now;
    _t.prevLabel = label;
  }
  function _tmark(label) {
    const now = _perf.now();
    _t[label] = now;
    _t.prev = now;
    _t.prevLabel = label;
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
    recognition.onsoundstart  = () => { _t = {}; _tmark('sound'); _tlog('soundstart'); callbacks.onSoundStart?.(); };
    recognition.onsoundend    = () => { _tlog('soundend'); callbacks.onSoundEnd?.(); };
    recognition.onspeechstart = () => { _tmark('speech'); _tlog('speechstart'); callbacks.onSpeechStart?.(); };
    // onspeechend fires when the engine stops detecting speech but before
    // the final result arrives — this is the "I heard you, thinking..." gap
    recognition.onspeechend   = () => { _tmark('speechend'); _tlog('speechend'); callbacks.onSpeechEnd?.(); };

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
          // Skip empty results (common SR noise on continuous mode)
          if (!alts[0]?.trim()) break;
          _tlog('final', `"${alts[0]?.trim()}" conf=${confs[0]?.toFixed(2)}`);
          console.log('[Voice] final:', alts, '| conf:', confs);
          handleTranscript(alts, confs);
        } else {
          // Interim: pre-populate input field
          if (!_t.firstInterim) {
            _t.firstInterim = true;
            _tlog('interim', `"${result[0].transcript.trim()}"`);
          }
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
    resultsMuted  = false; // clear any stale mute from previous TTS
    listening = shouldRestart = true;
    cancelPending();
    cancelPendingCommand();
    lastFiredNum  = null;  // reset debounce on new game session
    lastFiredTime = 0;
    lastFiredQuestionKey = '';
    recognition.lang = recognitionLang();
    // NOTE: do NOT call onStatusChange(true) here — SR is not yet capturing.
    // recognition.onstart fires when the engine is actually listening; that's
    // the sole place we signal "ready" so the mic icon reflects reality.
    try { recognition.start(); resetWatchdog(); } catch (_) {}
  }

  function stop() {
    if (!supported || !recognition) return;
    listening = shouldRestart = false;
    cancelPending();
    cancelPendingCommand();
    clearTimeout(restartTimer);
    clearTimeout(watchdogTimer);
    try { recognition.stop(); } catch (_) {}
    callbacks.onStatusChange?.(false);
  }

  function setActiveQuestion(questionKey) {
    activeQuestionKey = questionKey || '';
  }

  function muteResults(v) { resultsMuted = v; }

  return { supported, init, start, stop, muteResults, setTTSEchoFilter, setActiveQuestion, parseNumber, setTriggerMode };
})();
