const CACHE = 'vencimientos-v27';

const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// Instala la nueva versión
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activa la nueva versión y elimina cachés antiguas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => {
        return Promise.all(
          keys
            .filter(key => key !== CACHE)
            .map(key => caches.delete(key))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Las peticiones de la página siempre intentan obtener
// primero la versión actual de Internet.
self.addEventListener('fetch', event => {

  // Nunca guardar ni servir sw.js desde caché
  if (new URL(event.request.url).pathname.endsWith('/sw.js')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Para HTML: red primero, caché como respaldo
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copy = response.clone();

          caches.open(CACHE).then(cache => {
            cache.put('./index.html', copy);
          });

          return response;
        })
        .catch(() => caches.match('./index.html'))
    );

    return;
  }

  // Para los demás archivos:
  // intenta Internet y usa caché si no hay conexión.
  event.respondWith(
    fetch(event.request)
      .then(response => {
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
