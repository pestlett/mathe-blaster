// Service Worker — cache-first strategy for offline play
const CACHE = 'multiblaster-v0.7.31';

const ASSETS = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './js/i18n.js',
  './js/voice.js',
  './js/progress.js',
  './js/audio.js',
  './js/questions.js',
  './js/objects.js',
  './js/targeting.js',
  './js/themes.js',
  './js/ui.js',
  './js/engine.js',
  './js/version.js',
  './js/upgrades.js',
  './js/main.js',
  './icons/icon.svg',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
