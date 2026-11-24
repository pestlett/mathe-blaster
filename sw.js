// Service Worker — cache-first strategy for offline play
const CACHE = 'multiblaster-v0.12.1';

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
  './js/labs/walkthrough-data.js',
  './js/labs/walkthrough-data-2.js',
  './js/labs/walkthrough.js',
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
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  // Network-first with offline cache fallback so deployed updates appear
  // immediately on a single reload while preserving full offline play.
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res && res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
