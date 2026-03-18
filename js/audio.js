// audio.js - Web Audio API: synthesised music + SFX per theme

const Audio = (() => {
  let ctx = null;
  let musicNodes = [];
  let musicTimeout = null;
  let currentTheme = 'space';
  let muted = false;

  // ---- Adaptive music state ----
  let currentMusicState  = 'calm';
  let pendingMusicState  = null;
  let _preSpecialState   = 'calm';
  let _levelTempoMult    = 1.0;
  let _runModeActive     = false;
  let layerGains         = {};   // { melody, bass, harmony, boss, run } → GainNode
  let masterGain         = null;
  let _hopefulTimeout    = null;
  let _streakEnergyActive = false;

  const STATE_TEMPO_MULT = {
    calm:    1.0,
    tense:   1.1,
    urgent:  1.25,
    boss:    1.35,
    freeze:  0.55,
    hopeful: 1.0,
  };

  const STATE_LAYERS = {
    calm:    { melody: 1,   bass: 0,   harmony: 0, boss: 0, run: 0 },
    tense:   { melody: 1,   bass: 1,   harmony: 0, boss: 0, run: 0 },
    urgent:  { melody: 1,   bass: 1,   harmony: 1, boss: 0, run: 0 },
    boss:    { melody: 0,   bass: 0.7, harmony: 0, boss: 1, run: 0 },
    freeze:  { melody: 0.5, bass: 0.5, harmony: 0, boss: 0, run: 0 },
    hopeful: { melody: 1,   bass: 0,   harmony: 1, boss: 0, run: 0 },
  };

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // ---- Utility ----
  function noteToFreq(note) {
    // note: midi number, A4 = 69 = 440Hz
    return 440 * Math.pow(2, (note - 69) / 12);
  }

  function playTone(freq, type, startTime, duration, gain = 0.15, destination = null, attack = 0.02) {
    const c = getCtx();
    const osc = c.createOscillator();
    const env = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    env.gain.setValueAtTime(0, startTime);
    env.gain.linearRampToValueAtTime(gain, startTime + attack);
    env.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.connect(env);
    env.connect(destination || c.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
    musicNodes.push(osc);
    return osc;
  }

  function playNoise(startTime, duration, freq = 800, gain = 0.08) {
    const c = getCtx();
    const bufLen = Math.ceil(c.sampleRate * duration);
    const buf = c.createBuffer(1, bufLen, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf;
    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq, startTime);
    const env = c.createGain();
    env.gain.setValueAtTime(gain, startTime);
    env.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    src.connect(filter);
    filter.connect(env);
    env.connect(c.destination);
    src.start(startTime);
    src.stop(startTime + duration + 0.05);
  }

  // ---- Music sequences ----
  // Each theme has 6 layers: melody, bass, harmony, boss, hopeful, run
  // Melody loops are 15–21 s long so listeners don't pick up the repeat.
  // Loop durations: space 17.6 s | ocean 21.3 s | sky 15.4 s | cats 20.2 s
  const SEQUENCES = {
    space: {
      // A natural minor (A B C D E F G), sawtooth — lone, haunting, vast.
      // 80 notes × 0.22 s = 17.6 s. Four 20-note phrases; ends on D (unresolved
      // 4th) so the loop restart lands as release rather than a hard reset.
      melody: {
        notes: [
          // Phrase 1 — cautious exploration, establish home
          57,60,62,60,57,59,60,64, 62,60,57,55,57,60,64,65, 64,62,60,57,
          // Phrase 2 — rising tension, venture higher
          60,64,67,64,60,62,64,67, 69,67,65,64,62,60,62,65, 64,62,59,60,
          // Phrase 3 — dark descent into the lower register
          55,57,60,57,55,52,55,57, 60,62,60,57,55,52,50,52, 55,57,60,62,
          // Phrase 4 — reach up, end suspended on D
          64,67,69,72,69,67,65,64, 67,69,71,69,67,65,64,62, 60,62,64,62,
        ],
        tempo: 0.22, type: 'sawtooth', gain: 0.06,
      },
      bass:    { notes: [45,45,52,52,48,50,52,55, 45,43,48,50,45,52,50,45], tempo: 0.44, type: 'sine',     gain: 0.04 },
      harmony: { notes: [69,72,71,69,67,69,72,74, 72,71,69,72,74,72,69,71], tempo: 0.22, type: 'sawtooth', gain: 0.04 },
      boss:    { notes: [64,62,60,57,55,57,60,55,52,55,57,52],              tempo: 0.18, type: 'sawtooth', gain: 0.07 },
      hopeful: { notes: [57,60,64,69],                                       tempo: 0.22, type: 'sawtooth', gain: 0.08 },
      run:     { notes: [45,52,45,52,43,50,43,50],                           tempo: 0.44, type: 'sine',     gain: 0.03 },
    },
    ocean: {
      // C major pentatonic (C D E G A), sine — gentle, flowing, wave-like.
      // 56 notes × 0.38 s = 21.3 s. Four 14-note phrases; each phrase is a wave
      // that rises a little higher than the last, then recedes. Ends on D (open).
      melody: {
        notes: [
          // Phrase 1 — low swell
          60,64,67,64,60,62,64,67, 69,67,64,62,60,64,
          // Phrase 2 — mid swell, reaching the octave
          67,69,72,69,67,64,67,72, 74,72,69,67,64,67,
          // Phrase 3 — high crest
          72,74,76,74,72,69,72,76, 79,76,74,72,69,67,
          // Phrase 4 — recede to calm; ends open on D
          64,62,60,62,64,67,64,60, 62,67,69,67,64,62,
        ],
        tempo: 0.38, type: 'sine', gain: 0.08,
      },
      bass:    { notes: [36,36,43,43,36,38,40,36, 33,33,40,38,36,43,38,36], tempo: 0.76, type: 'sine', gain: 0.05 },
      harmony: { notes: [72,74,76,79,76,74,72,69, 72,76,79,76,74,72,74,76], tempo: 0.38, type: 'sine', gain: 0.05 },
      boss:    { notes: [60,67,64,60,67,72,67,64,60,62,64,67],              tempo: 0.30, type: 'sine', gain: 0.08 },
      hopeful: { notes: [60,64,67,72],                                       tempo: 0.38, type: 'sine', gain: 0.09 },
      run:     { notes: [36,43,36,43,36,38,40,36],                           tempo: 0.76, type: 'sine', gain: 0.04 },
    },
    sky: {
      // C major (all 7 notes), triangle — bright, nimble, birds-in-flight.
      // 96 notes × 0.16 s = 15.4 s. Four 24-note sections. Ends on B (leading
      // tone) so the loop restart on C feels like a natural resolution.
      melody: {
        notes: [
          // Section 1 — bright opening run
          60,64,67,72,71,69,67,65, 64,67,69,71,72,74,72,71, 69,67,65,64,62,64,67,69,
          // Section 2 — soar into the upper register
          71,72,74,76,74,72,71,69, 72,74,76,79,76,74,72,71, 74,76,79,76,74,72,71,69,
          // Section 3 — lyrical middle, warmer and lower
          67,65,64,62,64,65,67,69, 71,69,67,65,64,65,67,71, 72,71,69,67,65,64,62,60,
          // Section 4 — final ascent; end on B (leading tone)
          62,64,67,71,74,76,79,76, 74,72,71,69,71,72,74,76, 74,72,71,72,74,71,69,71,
        ],
        tempo: 0.16, type: 'triangle', gain: 0.09,
      },
      bass:    { notes: [48,48,55,55,53,53,55,48, 50,52,53,55,53,52,50,48], tempo: 0.32, type: 'triangle', gain: 0.05 },
      harmony: { notes: [76,79,81,84,83,81,79,76, 79,81,83,84,83,81,76,74, 72,74,76,79,81,79,76,74], tempo: 0.16, type: 'triangle', gain: 0.05 },
      boss:    { notes: [60,62,63,65,63,62,60,58,57,58,60,62],              tempo: 0.13, type: 'triangle', gain: 0.09 },
      hopeful: { notes: [67,72,76,84],                                       tempo: 0.16, type: 'triangle', gain: 0.10 },
      run:     { notes: [48,55,48,55,53,60,53,48],                           tempo: 0.32, type: 'triangle', gain: 0.04 },
    },
    cats: {
      // E minor pentatonic (E G A B D), triangle — playful, mischievous, curious.
      // 72 notes × 0.28 s = 20.2 s. Nine 8-note phrases that span the full range,
      // dip into the low register for mystery, and end on G (open minor 3rd).
      melody: {
        notes: [
          // Phrase 1 — perky opening statement
          64,67,71,69,67,71,74,71,
          // Phrase 2 — leap high, ears pricked
          76,74,71,69,71,74,76,79,
          // Phrase 3 — playful swoop back down
          76,74,71,74,71,67,64,67,
          // Phrase 4 — mid-range dance
          71,74,76,74,71,69,71,74,
          // Phrase 5 — low, sneaking
          62,64,67,64,62,59,62,64,
          // Phrase 6 — build back up with intent
          67,69,71,74,71,74,76,74,
          // Phrase 7 — confident middle-range flourish
          71,69,67,71,74,71,69,67,
          // Phrase 8 — dip to lowest (mysterious)
          64,62,59,57,59,62,64,67,
          // Phrase 9 — settle, end open on G
          71,74,71,67,64,67,71,67,
        ],
        tempo: 0.28, type: 'triangle', gain: 0.07,
      },
      bass:    { notes: [40,43,40,47,43,40,47,43, 40,35,40,43,47,43,40,47], tempo: 0.56, type: 'triangle', gain: 0.04 },
      harmony: { notes: [76,79,81,83,81,79,76,79, 81,83,81,79,76,74,76,79], tempo: 0.28, type: 'triangle', gain: 0.04 },
      boss:    { notes: [64,67,69,71,69,67,64,62,60,62,64,67],              tempo: 0.22, type: 'triangle', gain: 0.08 },
      hopeful: { notes: [64,67,71,76],                                       tempo: 0.28, type: 'triangle', gain: 0.08 },
      run:     { notes: [40,47,40,47,40,43,47,40],                           tempo: 0.56, type: 'triangle', gain: 0.03 },
    },
  };

  function resolveLayerGain(layer) {
    const stateWeight = (STATE_LAYERS[currentMusicState] || STATE_LAYERS.calm)[layer] || 0;
    if (layer === 'run') return _runModeActive ? 1 : 0;
    return stateWeight;
  }

  function getMusicState() {
    return pendingMusicState || currentMusicState;
  }

  function fadeLayerTo(gainNode, target, duration) {
    const c = getCtx();
    gainNode.gain.cancelScheduledValues(c.currentTime);
    gainNode.gain.setValueAtTime(gainNode.gain.value, c.currentTime);
    gainNode.gain.linearRampToValueAtTime(target, c.currentTime + duration);
  }

  function stopMusic() {
    if (musicTimeout) clearTimeout(musicTimeout);
    musicTimeout = null;
    if (_hopefulTimeout) { clearTimeout(_hopefulTimeout); _hopefulTimeout = null; }
    musicNodes.forEach(n => { try { n.stop(); } catch {} });
    musicNodes = [];
    Object.values(layerGains).forEach(g => { try { g.disconnect(); } catch {} });
    layerGains = {};
    if (masterGain) { try { masterGain.disconnect(); } catch {} masterGain = null; }
  }

  function playMusic(theme) {
    if (muted) return;
    stopMusic();
    currentTheme = theme;
    currentMusicState = 'calm';
    pendingMusicState = null;
    _levelTempoMult   = 1.0;
    const seq = SEQUENCES[theme];
    if (!seq) return;

    const c = getCtx();
    masterGain = c.createGain();
    masterGain.gain.setValueAtTime(1, c.currentTime);
    masterGain.connect(c.destination);

    for (const layer of ['melody', 'bass', 'harmony', 'boss', 'run']) {
      const g = c.createGain();
      g.gain.setValueAtTime(0, c.currentTime);
      g.connect(masterGain);
      layerGains[layer] = g;
    }

    scheduleLoop(0);
  }

  function scheduleLoop(offset) {
    const c = getCtx();
    const seq = SEQUENCES[currentTheme];
    if (!seq) return;

    const stateMult   = STATE_TEMPO_MULT[currentMusicState] || 1.0;
    const levelMult   = (currentMusicState === 'freeze') ? 1.0 : _levelTempoMult;
    const effectiveMult = stateMult * levelMult;

    // Fade each layer to its target gain
    for (const layer of ['melody', 'bass', 'harmony', 'boss', 'run']) {
      if (layerGains[layer]) {
        fadeLayerTo(layerGains[layer], resolveLayerGain(layer), 0.5);
      }
    }

    const streakBurst = _streakEnergyActive;
    _streakEnergyActive = false;

    // Schedule notes for all layers
    let maxDuration = 0;
    for (const layer of ['melody', 'bass', 'harmony', 'boss', 'run']) {
      const layerSeq = seq[layer];
      if (!layerSeq || !layerGains[layer]) continue;

      // Divide base tempo by effectiveMult: higher mult = faster = shorter per-note interval
      const adjustedTempo = layerSeq.tempo / effectiveMult;
      const loopDuration = layerSeq.notes.length * adjustedTempo;
      if (loopDuration > maxDuration) maxDuration = loopDuration;

      const start = c.currentTime + offset;
      layerSeq.notes.forEach((midi, i) => {
        const t = start + i * adjustedTempo;
        const gainVal = streakBurst ? layerSeq.gain * 1.3 : layerSeq.gain;
        const attack  = streakBurst ? 0.005 : 0.02;
        playTone(noteToFreq(midi), layerSeq.type, t, adjustedTempo * 0.75, gainVal, layerGains[layer], attack);
      });
    }

    if (maxDuration === 0) {
      const adjustedTempo = seq.melody.tempo / effectiveMult;
      maxDuration = seq.melody.notes.length * adjustedTempo;
    }

    musicTimeout = setTimeout(() => {
      if (!muted) scheduleLoop(0);
    }, maxDuration * 1000 - 100);
  }

  // ---- Public adaptive music controls ----

  function applyMusicStateNow(newState, duration = 0.5) {
    currentMusicState = newState;
    pendingMusicState = null;
    for (const layer of ['melody', 'bass', 'harmony', 'boss', 'run']) {
      if (layerGains[layer]) {
        fadeLayerTo(layerGains[layer], resolveLayerGain(layer), duration);
      }
    }
  }

  function setMusicState(newState, onRevert) {
    if (!newState) return;
    const activeState = getMusicState();
    if (newState === activeState && newState !== 'hopeful') return;

    if (newState === 'boss' || newState === 'freeze') {
      // Save pre-special state (don't overwrite if already in a special state)
      if (currentMusicState !== 'boss' && currentMusicState !== 'freeze' && currentMusicState !== 'hopeful') {
        _preSpecialState = currentMusicState;
      }
      applyMusicStateNow(newState, 0.35);
    } else if (newState === 'hopeful') {
      if (_hopefulTimeout) clearTimeout(_hopefulTimeout);
      applyMusicStateNow('hopeful', 0.25);
      _hopefulTimeout = setTimeout(() => {
        _hopefulTimeout = null;
        if (onRevert) onRevert();
        else setMusicState(_preSpecialState);
      }, 4000);
    } else {
      applyMusicStateNow(newState, 0.45);
    }
  }

  function notifyStreak(/* n */) {
    _streakEnergyActive = true;
  }

  function notifyLevel(level) {
    _levelTempoMult = Math.min(1.25, 1.0 + (level - 1) * 0.02);
  }

  function setRunMode(bool) {
    _runModeActive = bool;
    if (layerGains.run) {
      fadeLayerTo(layerGains.run, bool ? 1 : 0, 0.5);
    }
  }

  // ---- Sound Effects ----
  const SFX = {
    space: {
      fire() {
        const c = getCtx(); const t = c.currentTime;
        const osc = c.createOscillator(); const env = c.createGain();
        osc.type = 'square'; osc.frequency.setValueAtTime(880, t);
        env.gain.setValueAtTime(0.12, t); env.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        osc.connect(env); env.connect(c.destination); osc.start(t); osc.stop(t + 0.13);
        const osc2 = c.createOscillator(); const env2 = c.createGain();
        osc2.type = 'square'; osc2.frequency.setValueAtTime(440, t + 0.06);
        env2.gain.setValueAtTime(0.08, t + 0.06); env2.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
        osc2.connect(env2); env2.connect(c.destination); osc2.start(t + 0.06); osc2.stop(t + 0.21);
      },
      correct() {
        const c = getCtx(); const t = c.currentTime;
        [880, 1100, 1320].forEach((f, i) => {
          const osc = c.createOscillator(); const env = c.createGain();
          osc.type = 'sawtooth'; osc.frequency.setValueAtTime(f, t + i * 0.06);
          env.gain.setValueAtTime(0.1, t + i * 0.06); env.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.12);
          osc.connect(env); env.connect(c.destination); osc.start(t + i * 0.06); osc.stop(t + i * 0.06 + 0.17);
        });
      },
      wrong() {
        const c = getCtx(); const t = c.currentTime;
        const osc = c.createOscillator(); const env = c.createGain();
        osc.type = 'square'; osc.frequency.setValueAtTime(180, t);
        env.gain.setValueAtTime(0.12, t); env.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        osc.connect(env); env.connect(c.destination); osc.start(t); osc.stop(t + 0.30);
      },
      lifeLost() {
        const c = getCtx(); const t = c.currentTime;
        [300, 220, 150, 100].forEach((f, i) => {
          const osc = c.createOscillator(); const env = c.createGain();
          osc.type = 'sawtooth'; osc.frequency.setValueAtTime(f, t + i * 0.1);
          env.gain.setValueAtTime(0.15, t + i * 0.1); env.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.15);
          osc.connect(env); env.connect(c.destination); osc.start(t + i * 0.1); osc.stop(t + i * 0.1 + 0.20);
        });
      },
      levelUp() {
        const c = getCtx(); const t = c.currentTime;
        [523, 659, 784, 1047].forEach((f, i) => {
          const osc = c.createOscillator(); const env = c.createGain();
          osc.type = 'triangle'; osc.frequency.setValueAtTime(f, t + i * 0.1);
          env.gain.setValueAtTime(0.12, t + i * 0.1); env.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.15);
          osc.connect(env); env.connect(c.destination); osc.start(t + i * 0.1); osc.stop(t + i * 0.1 + 0.20);
        });
      },
      freeze() {
        const c = getCtx(); const t = c.currentTime;
        [1200, 1000, 800, 1400].forEach((f, i) => {
          const osc = c.createOscillator(); const env = c.createGain();
          osc.type = 'sine'; osc.frequency.setValueAtTime(f, t + i * 0.06);
          env.gain.setValueAtTime(0.1, t + i * 0.06); env.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.1);
          osc.connect(env); env.connect(c.destination); osc.start(t + i * 0.06); osc.stop(t + i * 0.06 + 0.15);
        });
      },
      runLose() {
        // Wah-wah-wah-waaaaah (sad trombone, sawtooth for that brass buzz)
        const c = getCtx(); const t = c.currentTime;
        [466, 415, 370].forEach((f, i) => {
          const osc = c.createOscillator(); const env = c.createGain();
          osc.type = 'sawtooth'; osc.frequency.setValueAtTime(f, t + i * 0.32);
          osc.frequency.linearRampToValueAtTime(f * 0.88, t + i * 0.32 + 0.26);
          env.gain.setValueAtTime(0.18, t + i * 0.32); env.gain.exponentialRampToValueAtTime(0.001, t + i * 0.32 + 0.28);
          osc.connect(env); env.connect(c.destination); osc.start(t + i * 0.32); osc.stop(t + i * 0.32 + 0.33);
        });
        const osc4 = c.createOscillator(); const env4 = c.createGain();
        osc4.type = 'sawtooth'; osc4.frequency.setValueAtTime(311, t + 0.96);
        osc4.frequency.exponentialRampToValueAtTime(88, t + 0.96 + 1.0);
        env4.gain.setValueAtTime(0.18, t + 0.96); env4.gain.exponentialRampToValueAtTime(0.001, t + 0.96 + 1.1);
        osc4.connect(env4); env4.connect(c.destination); osc4.start(t + 0.96); osc4.stop(t + 0.96 + 1.2);
      }
    },
    ocean: {
      fire() {
        const c = getCtx(); const t = c.currentTime;
        const osc = c.createOscillator();
        const env = c.createGain();
        osc.type = 'sine'; osc.frequency.setValueAtTime(800, t);
        osc.frequency.exponentialRampToValueAtTime(200, t + 0.3);
        env.gain.setValueAtTime(0.15, t);
        env.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.connect(env); env.connect(c.destination);
        osc.start(t); osc.stop(t + 0.35);
      },
      correct() {
        const c = getCtx(); const t = c.currentTime;
        [400, 600, 800, 600, 400].forEach((f, i) => {
          const osc = c.createOscillator(); const env = c.createGain();
          osc.type = 'sine'; osc.frequency.setValueAtTime(f, t + i * 0.07);
          env.gain.setValueAtTime(0.1, t + i * 0.07); env.gain.exponentialRampToValueAtTime(0.001, t + i * 0.07 + 0.1);
          osc.connect(env); env.connect(c.destination); osc.start(t + i * 0.07); osc.stop(t + i * 0.07 + 0.15);
        });
      },
      wrong() {
        const c = getCtx(); const t = c.currentTime;
        const osc = c.createOscillator(); const env = c.createGain();
        osc.type = 'sine'; osc.frequency.setValueAtTime(120, t);
        env.gain.setValueAtTime(0.15, t); env.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        osc.connect(env); env.connect(c.destination); osc.start(t); osc.stop(t + 0.45);
      },
      lifeLost() {
        const c = getCtx(); const t = c.currentTime;
        [200, 160, 120, 80].forEach((f, i) => {
          const osc = c.createOscillator(); const env = c.createGain();
          osc.type = 'sine'; osc.frequency.setValueAtTime(f, t + i * 0.12);
          env.gain.setValueAtTime(0.18, t + i * 0.12); env.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.18);
          osc.connect(env); env.connect(c.destination); osc.start(t + i * 0.12); osc.stop(t + i * 0.12 + 0.23);
        });
      },
      levelUp() {
        const c = getCtx(); const t = c.currentTime;
        [300, 400, 500, 600, 700].forEach((f, i) => {
          const osc = c.createOscillator(); const env = c.createGain();
          osc.type = 'sine'; osc.frequency.setValueAtTime(f, t + i * 0.1);
          env.gain.setValueAtTime(0.1, t + i * 0.1); env.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.12);
          osc.connect(env); env.connect(c.destination); osc.start(t + i * 0.1); osc.stop(t + i * 0.1 + 0.17);
        });
      },
      freeze() {
        const c = getCtx(); const t = c.currentTime;
        [1000, 800, 600, 1200].forEach((f, i) => {
          const osc = c.createOscillator(); const env = c.createGain();
          osc.type = 'sine'; osc.frequency.setValueAtTime(f, t + i * 0.07);
          env.gain.setValueAtTime(0.1, t + i * 0.07); env.gain.exponentialRampToValueAtTime(0.001, t + i * 0.07 + 0.1);
          osc.connect(env); env.connect(c.destination); osc.start(t + i * 0.07); osc.stop(t + i * 0.07 + 0.15);
        });
      },
      runLose() {
        // Wah-wah-wah-waaaaah (smooth foghorn descend, sine for the ocean)
        const c = getCtx(); const t = c.currentTime;
        [466, 415, 370].forEach((f, i) => {
          const osc = c.createOscillator(); const env = c.createGain();
          osc.type = 'sine'; osc.frequency.setValueAtTime(f, t + i * 0.34);
          osc.frequency.linearRampToValueAtTime(f * 0.88, t + i * 0.34 + 0.28);
          env.gain.setValueAtTime(0.2, t + i * 0.34); env.gain.exponentialRampToValueAtTime(0.001, t + i * 0.34 + 0.30);
          osc.connect(env); env.connect(c.destination); osc.start(t + i * 0.34); osc.stop(t + i * 0.34 + 0.35);
        });
        const osc4 = c.createOscillator(); const env4 = c.createGain();
        osc4.type = 'sine'; osc4.frequency.setValueAtTime(311, t + 1.02);
        osc4.frequency.exponentialRampToValueAtTime(88, t + 1.02 + 1.1);
        env4.gain.setValueAtTime(0.2, t + 1.02); env4.gain.exponentialRampToValueAtTime(0.001, t + 1.02 + 1.2);
        osc4.connect(env4); env4.connect(c.destination); osc4.start(t + 1.02); osc4.stop(t + 1.02 + 1.3);
      }
    },
    sky: {
      fire() {
        const c = getCtx(); const t = c.currentTime;
        playNoise(t, 0.18, 600, 0.1);
      },
      correct() {
        const c = getCtx(); const t = c.currentTime;
        [523, 659, 784, 1047].forEach((f, i) => {
          const osc = c.createOscillator(); const env = c.createGain();
          osc.type = 'triangle'; osc.frequency.setValueAtTime(f, t + i * 0.07);
          env.gain.setValueAtTime(0.1, t + i * 0.07); env.gain.exponentialRampToValueAtTime(0.001, t + i * 0.07 + 0.12);
          osc.connect(env); env.connect(c.destination); osc.start(t + i * 0.07); osc.stop(t + i * 0.07 + 0.17);
        });
      },
      wrong() {
        const c = getCtx(); const t = c.currentTime;
        const osc = c.createOscillator();
        const env = c.createGain();
        osc.type = 'sine'; osc.frequency.setValueAtTime(400, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.4);
        env.gain.setValueAtTime(0.12, t);
        env.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        osc.connect(env); env.connect(c.destination);
        osc.start(t); osc.stop(t + 0.45);
      },
      lifeLost() {
        const c = getCtx(); const t = c.currentTime;
        [500, 400, 350, 300, 200].forEach((f, i) => {
          const osc = c.createOscillator(); const env = c.createGain();
          osc.type = 'triangle'; osc.frequency.setValueAtTime(f, t + i * 0.1);
          env.gain.setValueAtTime(0.12, t + i * 0.1); env.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.15);
          osc.connect(env); env.connect(c.destination); osc.start(t + i * 0.1); osc.stop(t + i * 0.1 + 0.20);
        });
      },
      levelUp() {
        const c = getCtx(); const t = c.currentTime;
        [659, 784, 880, 1047, 1319].forEach((f, i) => {
          const osc = c.createOscillator(); const env = c.createGain();
          osc.type = 'triangle'; osc.frequency.setValueAtTime(f, t + i * 0.09);
          env.gain.setValueAtTime(0.1, t + i * 0.09); env.gain.exponentialRampToValueAtTime(0.001, t + i * 0.09 + 0.12);
          osc.connect(env); env.connect(c.destination); osc.start(t + i * 0.09); osc.stop(t + i * 0.09 + 0.17);
        });
      },
      freeze() {
        const c = getCtx(); const t = c.currentTime;
        [1200, 1000, 800, 1400].forEach((f, i) => {
          const osc = c.createOscillator(); const env = c.createGain();
          osc.type = 'triangle'; osc.frequency.setValueAtTime(f, t + i * 0.06);
          env.gain.setValueAtTime(0.1, t + i * 0.06); env.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.1);
          osc.connect(env); env.connect(c.destination); osc.start(t + i * 0.06); osc.stop(t + i * 0.06 + 0.15);
        });
      },
      runLose() {
        // Wah-wah-wah-waaaaah (airy flute descend, triangle)
        const c = getCtx(); const t = c.currentTime;
        [466, 415, 370].forEach((f, i) => {
          const osc = c.createOscillator(); const env = c.createGain();
          osc.type = 'triangle'; osc.frequency.setValueAtTime(f, t + i * 0.32);
          osc.frequency.linearRampToValueAtTime(f * 0.88, t + i * 0.32 + 0.26);
          env.gain.setValueAtTime(0.16, t + i * 0.32); env.gain.exponentialRampToValueAtTime(0.001, t + i * 0.32 + 0.28);
          osc.connect(env); env.connect(c.destination); osc.start(t + i * 0.32); osc.stop(t + i * 0.32 + 0.33);
        });
        const osc4 = c.createOscillator(); const env4 = c.createGain();
        osc4.type = 'triangle'; osc4.frequency.setValueAtTime(311, t + 0.96);
        osc4.frequency.exponentialRampToValueAtTime(88, t + 0.96 + 1.0);
        env4.gain.setValueAtTime(0.16, t + 0.96); env4.gain.exponentialRampToValueAtTime(0.001, t + 0.96 + 1.1);
        osc4.connect(env4); env4.connect(c.destination); osc4.start(t + 0.96); osc4.stop(t + 0.96 + 1.2);
      }
    },
    cats: {
      fire() {
        const c = getCtx(); const t = c.currentTime;
        // Quick paw swipe sound
        const osc = c.createOscillator(); const env = c.createGain();
        osc.type = 'triangle'; osc.frequency.setValueAtTime(600, t);
        env.gain.setValueAtTime(0.1, t); env.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        osc.connect(env); env.connect(c.destination); osc.start(t); osc.stop(t + 0.10);
        const osc2 = c.createOscillator(); const env2 = c.createGain();
        osc2.type = 'triangle'; osc2.frequency.setValueAtTime(900, t + 0.04);
        env2.gain.setValueAtTime(0.08, t + 0.04); env2.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        osc2.connect(env2); env2.connect(c.destination); osc2.start(t + 0.04); osc2.stop(t + 0.17);
      },
      correct() {
        const c = getCtx(); const t = c.currentTime;
        // Happy purring tones
        [523, 659, 784, 1047].forEach((f, i) => {
          const osc = c.createOscillator(); const env = c.createGain();
          osc.type = 'triangle'; osc.frequency.setValueAtTime(f, t + i * 0.07);
          env.gain.setValueAtTime(0.09, t + i * 0.07); env.gain.exponentialRampToValueAtTime(0.001, t + i * 0.07 + 0.12);
          osc.connect(env); env.connect(c.destination); osc.start(t + i * 0.07); osc.stop(t + i * 0.07 + 0.17);
        });
      },
      wrong() {
        const c = getCtx(); const t = c.currentTime;
        // Cat hiss
        playNoise(t, 0.25, 3000, 0.08);
        const osc = c.createOscillator(); const env = c.createGain();
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(250, t + 0.05);
        env.gain.setValueAtTime(0.07, t + 0.05); env.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        osc.connect(env); env.connect(c.destination); osc.start(t + 0.05); osc.stop(t + 0.40);
      },
      lifeLost() {
        const c = getCtx(); const t = c.currentTime;
        [400, 330, 280, 220, 180].forEach((f, i) => {
          const osc = c.createOscillator(); const env = c.createGain();
          osc.type = 'triangle'; osc.frequency.setValueAtTime(f, t + i * 0.1);
          env.gain.setValueAtTime(0.12, t + i * 0.1); env.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.14);
          osc.connect(env); env.connect(c.destination); osc.start(t + i * 0.1); osc.stop(t + i * 0.1 + 0.19);
        });
      },
      levelUp() {
        const c = getCtx(); const t = c.currentTime;
        [523, 659, 784, 1047, 1319].forEach((f, i) => {
          const osc = c.createOscillator(); const env = c.createGain();
          osc.type = 'triangle'; osc.frequency.setValueAtTime(f, t + i * 0.08);
          env.gain.setValueAtTime(0.09, t + i * 0.08); env.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.12);
          osc.connect(env); env.connect(c.destination); osc.start(t + i * 0.08); osc.stop(t + i * 0.08 + 0.17);
        });
      },
      freeze() {
        const c = getCtx(); const t = c.currentTime;
        [1400, 1100, 900, 1600].forEach((f, i) => {
          const osc = c.createOscillator(); const env = c.createGain();
          osc.type = 'triangle'; osc.frequency.setValueAtTime(f, t + i * 0.06);
          env.gain.setValueAtTime(0.09, t + i * 0.06); env.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.1);
          osc.connect(env); env.connect(c.destination); osc.start(t + i * 0.06); osc.stop(t + i * 0.06 + 0.15);
        });
      },
      runLose() {
        // Three sad meows sliding down, then a long sorry meow
        const c = getCtx(); const t = c.currentTime;
        [600, 500, 420].forEach((f, i) => {
          const osc = c.createOscillator(); const env = c.createGain();
          osc.type = 'triangle'; osc.frequency.setValueAtTime(f, t + i * 0.34);
          osc.frequency.exponentialRampToValueAtTime(f * 0.75, t + i * 0.34 + 0.28);
          env.gain.setValueAtTime(0.15, t + i * 0.34); env.gain.exponentialRampToValueAtTime(0.001, t + i * 0.34 + 0.32);
          osc.connect(env); env.connect(c.destination); osc.start(t + i * 0.34); osc.stop(t + i * 0.34 + 0.37);
        });
        const osc4 = c.createOscillator(); const env4 = c.createGain();
        osc4.type = 'triangle'; osc4.frequency.setValueAtTime(380, t + 1.02);
        osc4.frequency.exponentialRampToValueAtTime(110, t + 1.02 + 1.0);
        env4.gain.setValueAtTime(0.15, t + 1.02); env4.gain.exponentialRampToValueAtTime(0.001, t + 1.02 + 1.1);
        osc4.connect(env4); env4.connect(c.destination); osc4.start(t + 1.02); osc4.stop(t + 1.02 + 1.2);
      }
    }
  };

  function play(event) {
    if (muted) return;
    try { SFX[currentTheme]?.[event]?.(); } catch {}
  }

  function setTheme(theme) {
    currentTheme = theme;
  }

  function setMuted(val) {
    muted = val;
    if (muted) stopMusic();
  }

  return { playMusic, stopMusic, play, setTheme, setMuted, getCtx,
           setMusicState, getMusicState, notifyStreak, notifyLevel, setRunMode };
})();
