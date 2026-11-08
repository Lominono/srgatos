const CACHE_NAME = 'srgatos-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/images/gato.png',
  '/images/flappy-cat.png',
  '/images/meowl-blep.png',
  '/images/meowl-screaming.png',
  '/images/meowl-propeller.png',
  '/images/meowl-gentleman.png',
  '/images/meowl-wet.png',
  '/images/meowl-wild.png',
  '/images/salchipapas.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Cache-first for images
  if (url.pathname.startsWith('/images/')) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return res;
      }).catch(() => caches.match('/images/gato.png')))
    );
    return;
  }

  // Network-first for other assets with offline cache fallback
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
