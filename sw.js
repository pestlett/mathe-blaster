// Service Worker — cache-first strategy for offline play
const CACHE = 'multiblaster-v0.10.2';

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
  './js/numberline.js',
  './js/labs/lab-host.js',
  './js/labs/placevalue.js',
  './js/labs/neighbors.js',
  './js/labs/rounding.js',
  './js/labs/area.js',
  './js/labs/written-addsub.js',
  './js/labs/written-mul.js',
  './js/labs/written-div.js',
  './js/labs/units.js',
  './js/labs/geometry.js',
  './js/labs/charts.js',
  './js/labs/lab-hub.js',
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
