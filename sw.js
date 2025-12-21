const STATIC_CACHE = 'ditherlens-static-v1';
const DYNAMIC_CACHE = 'ditherlens-dynamic-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/assets/index-BxMmaYE-.css',
  '/assets/index-C16FXxMU.js'
];

// Install → cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate → cleanup old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => ![STATIC_CACHE, DYNAMIC_CACHE].includes(k))
          .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // API → network-first
  if (url.pathname.startsWith('/api')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Static → cache-first
  event.respondWith(cacheFirst(request));
});

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  return cached || fetchAndCache(request);
}

async function networkFirst(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  try {
    const fresh = await fetch(request);
    cache.put(request, fresh.clone());
    return fresh;
  } catch {
    return cache.match(request);
  }
}

async function fetchAndCache(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const response = await fetch(request);
  cache.put(request, response.clone());
  return response;
}
