var CACHE_NAME = 'pwa-task-manager';
var urlsToCache = [
  '/',
  '/send',
  '/receive',
  '/settings',
];

// Install a service worker
self.addEventListener('install', event => {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Cache and return requests
// self.addEventListener('fetch', event => {
//   event.respondWith(
//     fetch(event.request).catch(function() {
//         return caches.match(event.request)
//     })
//   )
// });

// Update a service worker
self.addEventListener('activate', event => {
  var cacheWhitelist = ['pwa-task-manager'];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});