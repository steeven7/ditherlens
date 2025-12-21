const STATIC_CACHE = 'ditherlens-static-v3';
const DYNAMIC_CACHE = 'ditherlens-dynamic-v3';
const BASE = '/ditherlens';

const STATIC_ASSETS = [
  `${BASE}/`,
  `${BASE}/index.html`,
  `${BASE}/assets/index-BxMmaYE-.css`,
  `${BASE}/assets/index-C16FXxMU.js`,
  `${BASE}/manifest.webmanifest`
];

// INSTALL
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ACTIVATE
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

// FETCH
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // API → network-first
  if (url.pathname.startsWith('/api')) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // Static → cache-first
  event.respondWith(cacheFirst(event.request));
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
