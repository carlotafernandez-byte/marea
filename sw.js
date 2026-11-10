// Funciona sin conexión: guarda la app en caché. Tus datos nunca pasan por aquí (están en localStorage).
const CACHE = 'marea-v5';
const FILES = [
  './', 'index.html', 'css/styles.css', 'js/app.js', 'js/cycle.js', 'js/content.js', 'js/store.js', 'js/assistant.js', 'js/contraception.js',
  'manifest.webmanifest', 'manifest-discreto.webmanifest', 'icons/discreto.svg', 'icons/discreto-192.png', 'icons/discreto-512.png', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Red primero (para recibir actualizaciones), caché si no hay conexión.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match('index.html'))),
  );
});
