const CACHE_NAME = 'sagaradze-atelier-v2';
const ASSETS = [
  './index.html',
  './styles.css',
  './salon.js',
  './atelier/portrait.jpg',
  './atelier/hat.jpg',
  './atelier/papakha.jpg',
  './atelier/profile.jpg',
  './atelier/newspapers.jpg',
  './atelier/fireplace.jpg',
  './atelier/chair.jpg',
  './atelier/standing.jpg',
  './atelier/curls.jpg',
  './atelier/lean.jpg',
  './atelier/procession.jpg',
  './atelier/actress.jpg',
  './atelier/actress.mp4',
  './atelier/reclining.jpg',
  './atelier/father.jpg',
  './atelier/family.jpg',
  './atelier/courtyard.jpg',
  './atelier/garden.jpg',
  './atelier/street.jpg',
  './atelier/table.jpg',
  './atelier/crack.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        if (response.ok && event.request.url.startsWith(self.location.origin)) {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
