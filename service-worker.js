// Dawarly Service Worker v1.0
const CACHE_NAME = 'dawarly-v1.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/services.html',
  '/features.html',
  '/how-it-works.html',
  '/request.html',
  '/contact.html',
  '/style.css'
];

// تثبيت Service Worker
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching files');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// تفعيل Service Worker
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// استراتيجية التخزين المؤقت: Network First مع Fallback للـ Cache
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // احفظ نسخة في الـ Cache
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // إذا فشل الاتصال، استخدم النسخة المحفوظة
        return caches.match(event.request)
          .then(response => {
            if (response) {
              return response;
            }
            // إذا لم تكن موجودة، أرجع صفحة offline
            return caches.match('/index.html');
          });
      })
  );
});
