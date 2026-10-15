// Can Çerez 1978 - Service Worker
const CACHE_NAME = 'can-cerez-v9';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './yonetici.html',
  './personel.html',
  './manifest.json',
  './favicon.svg',
  './logo.svg',
  './icon-192.svg',
  './icon-512.svg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((k) => {
          if (k !== CACHE_NAME) {
            return caches.delete(k);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // API veya harici bulut veritabanı istekleri daima doğrudan ağ üzerinden yapılsın
  if (e.request.url.includes('/api/') || 
      e.request.url.includes('extendsclass.com') || 
      e.request.url.includes('firebaseio.com') || 
      e.request.url.includes('firebasedatabase.app')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  // Statik dosyalar: Cache-first fallback to network
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Arka planda güncelle
        fetch(e.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(e.request);
    })
  );
});
