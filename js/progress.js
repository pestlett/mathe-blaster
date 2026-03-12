// progress.js - localStorage persistence: per-question stats + sessions

const Progress = (() => {
  const STORAGE_KEY = 'multiblaster_v1';

  function load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { player: {}, stats: {}, sessions: [] };
    } catch {
      return { player: {}, stats: {}, sessions: [] };
    }
  }

  function save(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {}
  }

  function getAll() {
    return load();
  }

  function saveName(name) {
    const d = load();
    d.player.name = name;
    save(d);
  }

  // Record an attempt for a question key like "7x8"
  function recordAttempt(key, correct, timeMs) {
    const d = load();
    if (!d.stats[key]) d.stats[key] = { attempts: 0, correct: 0, totalTimeMs: 0, lastSeen: 0 };
    const s = d.stats[key];
    s.attempts++;
    if (correct) s.correct++;
    s.totalTimeMs += timeMs;
    s.lastSeen = Date.now();
    save(d);
  }

  // Get per-question stats map
  function getStats() {
    return load().stats;
  }

  // Save a completed session
  function saveSession(session) {
    const d = load();
    d.sessions.push({ ...session, date: new Date().toISOString() });
    save(d);
  }

  function getSessions() {
    return load().sessions;
  }

  // Check "most improved" badge: last session accuracy >= prev by 10%
  function isMostImproved() {
    const sessions = getSessions();
    if (sessions.length < 2) return false;
    const last = sessions[sessions.length - 1];
    const prev = sessions[sessions.length - 2];
    return (last.accuracy - prev.accuracy) >= 0.10;
  }

  return { getAll, saveName, recordAttempt, getStats, saveSession, getSessions, isMostImproved };
})();
