// Can Çerez 1978 - Service Worker
const CACHE_NAME = 'can-cerez-v15';
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
            console.log('[SW] Eski önbellek siliniyor:', k);
            return caches.delete(k);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = e.request.url;

  // 1. API veya harici bulut veritabanı istekleri daima doğrudan ağ üzerinden yapılsın
  if (url.includes('/api/') || 
      url.includes('extendsclass.com') || 
      url.includes('firebaseio.com') || 
      url.includes('firebasedatabase.app')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  // 2. HTML / Navigasyon istekleri (personel.html, yonetici.html, index.html):
  // DAİMA NETWORK-FIRST (Önce internetten en güncel kodu al, internet yoksa çevrimdışı önbellekten aç)
  const isHtml = e.request.mode === 'navigate' || 
                 (e.request.method === 'GET' && e.request.headers.get('accept') && e.request.headers.get('accept').includes('text/html'));

  if (isHtml) {
    e.respondWith(
      fetch(e.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, copy));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(e.request);
        })
    );
    return;
  }

  // 3. Statik dosyalar (logo, ikonlar vb.): Cache-first fallback to network
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
