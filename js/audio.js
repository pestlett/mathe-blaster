// audio.js - Web Audio API: synthesised music + SFX per theme

const Audio = (() => {
  let ctx = null;
  let musicNodes = [];
  let musicTimeout = null;
  let currentTheme = 'space';
  let muted = false;

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

  function playTone(freq, type, startTime, duration, gain = 0.15, destination = null) {
    const c = getCtx();
    const osc = c.createOscillator();
    const env = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    env.gain.setValueAtTime(0, startTime);
    env.gain.linearRampToValueAtTime(gain, startTime + 0.02);
    env.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.connect(env);
    env.connect(destination || c.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
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
  const SEQUENCES = {
    space: {
      notes: [57, 60, 62, 64, 57, 60, 64, 60, 55, 57, 60, 55], // Am arpeggio
      tempo: 0.22,
      type: 'sawtooth',
      gain: 0.06
    },
    ocean: {
      notes: [60, 62, 64, 67, 69, 67, 64, 62, 60, 64, 67, 64], // C major pentatonic
      tempo: 0.38,
      type: 'sine',
      gain: 0.08
    },
    sky: {
      notes: [60, 64, 67, 72, 67, 64, 65, 69, 72, 67, 64, 60], // C major bright
      tempo: 0.16,
      type: 'triangle',
      gain: 0.09
    }
  };

  function stopMusic() {
    if (musicTimeout) clearTimeout(musicTimeout);
    musicTimeout = null;
    musicNodes.forEach(n => { try { n.stop(); } catch {} });
    musicNodes = [];
  }

  function playMusic(theme) {
    if (muted) return;
    stopMusic();
    currentTheme = theme;
    const seq = SEQUENCES[theme];
    if (!seq) return;
    scheduleLoop(seq, 0);
  }

  function scheduleLoop(seq, offset) {
    const c = getCtx();
    const start = c.currentTime + offset;
    const totalDuration = seq.notes.length * seq.tempo;
    seq.notes.forEach((midi, i) => {
      const t = start + i * seq.tempo;
      playTone(noteToFreq(midi), seq.type, t, seq.tempo * 0.75, seq.gain);
      // Add bass for space
      if (currentTheme === 'space') {
        playTone(noteToFreq(midi - 12), 'sine', t, seq.tempo * 0.9, 0.04);
      }
    });
    // Schedule next loop
    musicTimeout = setTimeout(() => {
      if (!muted) scheduleLoop(seq, 0);
    }, totalDuration * 1000 - 100);
  }

  // ---- Sound Effects ----
  const SFX = {
    space: {
      fire() {
        const c = getCtx(); const t = c.currentTime;
        playTone(880, 'square', t, 0.08, 0.12);
        playTone(440, 'square', t + 0.06, 0.1, 0.08);
      },
      correct() {
        const c = getCtx(); const t = c.currentTime;
        [880, 1100, 1320].forEach((f, i) => playTone(f, 'sawtooth', t + i * 0.06, 0.12, 0.1));
      },
      wrong() {
        const c = getCtx(); const t = c.currentTime;
        playTone(180, 'square', t, 0.25, 0.12);
      },
      lifeLost() {
        const c = getCtx(); const t = c.currentTime;
        [300, 220, 150, 100].forEach((f, i) => playTone(f, 'sawtooth', t + i * 0.1, 0.15, 0.15));
      },
      levelUp() {
        const c = getCtx(); const t = c.currentTime;
        [523, 659, 784, 1047].forEach((f, i) => playTone(f, 'triangle', t + i * 0.1, 0.15, 0.12));
      },
      freeze() {
        const c = getCtx(); const t = c.currentTime;
        [1200, 1000, 800, 1400].forEach((f, i) => playTone(f, 'sine', t + i * 0.06, 0.1, 0.1));
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
        [400, 600, 800, 600, 400].forEach((f, i) => playTone(f, 'sine', t + i * 0.07, 0.1, 0.1));
      },
      wrong() {
        const c = getCtx(); const t = c.currentTime;
        playTone(120, 'sine', t, 0.4, 0.15);
      },
      lifeLost() {
        const c = getCtx(); const t = c.currentTime;
        [200, 160, 120, 80].forEach((f, i) => playTone(f, 'sine', t + i * 0.12, 0.18, 0.18));
      },
      levelUp() {
        const c = getCtx(); const t = c.currentTime;
        [300, 400, 500, 600, 700].forEach((f, i) => playTone(f, 'sine', t + i * 0.1, 0.12, 0.1));
      },
      freeze() {
        const c = getCtx(); const t = c.currentTime;
        [1000, 800, 600, 1200].forEach((f, i) => playTone(f, 'sine', t + i * 0.07, 0.1, 0.1));
      }
    },
    sky: {
      fire() {
        const c = getCtx(); const t = c.currentTime;
        playNoise(t, 0.18, 600, 0.1);
      },
      correct() {
        const c = getCtx(); const t = c.currentTime;
        [523, 659, 784, 1047].forEach((f, i) => playTone(f, 'triangle', t + i * 0.07, 0.12, 0.1));
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
        [500, 400, 350, 300, 200].forEach((f, i) => playTone(f, 'triangle', t + i * 0.1, 0.15, 0.12));
      },
      levelUp() {
        const c = getCtx(); const t = c.currentTime;
        [659, 784, 880, 1047, 1319].forEach((f, i) => playTone(f, 'triangle', t + i * 0.09, 0.12, 0.1));
      },
      freeze() {
        const c = getCtx(); const t = c.currentTime;
        [1200, 1000, 800, 1400].forEach((f, i) => playTone(f, 'triangle', t + i * 0.06, 0.1, 0.1));
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

  return { playMusic, stopMusic, play, setTheme, setMuted, getCtx };
})();
