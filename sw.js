const CACHE_NAME = 'sagaradze-atelier-v1';
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

// Установка Service Worker и кэширование файлов
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Перехват запросов и выдача файлов из кэша без интернета
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});
