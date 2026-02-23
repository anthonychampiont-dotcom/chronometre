/* ============================================================
   ChronoClass — Service Worker v1.0
   Cache First : l'app fonctionne hors-ligne après 1er chargement
============================================================ */

const CACHE = 'chronoclass-v1';

const FILES = [
  './',
  './index.html',
  './manifest.json',
  './logo.png',
  './icon-512.png',
  './icon-192.png',
  './icon-180.png',
  './icon-152.png',
  './icon-120.png',
  './icon-76.png'
];

/* ── Installation ─────────────────────────────────────── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache =>
      Promise.allSettled(FILES.map(f => cache.add(f).catch(() => {})))
    ).then(() => self.skipWaiting())
  );
});

/* ── Activation : supprime les vieux caches ───────────── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* ── Fetch : Cache First + revalidation silencieuse ──── */
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) {
        // Sert depuis le cache ET revalide en arrière-plan
        fetch(event.request).then(res => {
          if (res && res.status === 200)
            caches.open(CACHE).then(c => c.put(event.request, res));
        }).catch(() => {});
        return cached;
      }
      // Pas en cache : réseau puis mise en cache
      return fetch(event.request).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(event.request, clone));
        }
        return res;
      }).catch(() => {
        if (event.request.destination === 'document')
          return caches.match('./index.html');
      });
    })
  );
});
