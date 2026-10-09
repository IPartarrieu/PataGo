// Service worker de PataGo: app instalable y usable sin conexión.
// - Archivos propios: primero la red (para recibir actualizaciones) y, sin conexión, el caché.
// - Librerías y fuentes (versiones fijas en CDN): primero el caché.
// - Mosaicos del mapa: se guardan los que vas viendo (hasta MAX_MOSAICOS) para abrir el mapa sin señal.
const APP = 'patago-app-v2', MAPA = 'patago-mapa-v1', MAX_MOSAICOS = 1500;
const PRECARGA = [
  './', 'index.html', 'manifest.json', 'data/lugares.geojson', 'icons/icon-180.png', 'icons/favicon-64.png',
  'js/main.js', 'js/scene.js', 'js/avatars.js', 'js/walk.js', 'js/progress.js',
  'https://cdn.jsdelivr.net/npm/maplibre-gl@4.7.1/dist/maplibre-gl.js',
  'https://cdn.jsdelivr.net/npm/maplibre-gl@4.7.1/dist/maplibre-gl.css',
  'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(APP).then(c => Promise.all(PRECARGA.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== APP && k !== MAPA).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

async function guardarMosaico(req, res) {
  const c = await caches.open(MAPA);
  await c.put(req, res);
  const claves = await c.keys();
  for (const k of claves.slice(0, Math.max(0, claves.length - MAX_MOSAICOS))) await c.delete(k); // descarta los más antiguos
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    e.respondWith(fetch(req).then(res => {
      if (res.ok) { const copia = res.clone(); caches.open(APP).then(c => c.put(req, copia)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true })));
  } else if (url.hostname === 'tiles.openfreemap.org') {
    // estilo y mosaicos: red primero (cambian con el tiempo) y caché como respaldo
    e.respondWith(fetch(req).then(res => {
      if (res.ok) { const copia = res.clone(); e.waitUntil(guardarMosaico(req, copia)); }
      return res;
    }).catch(() => caches.match(req)));
  } else {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok || res.type === 'opaque') { const copia = res.clone(); caches.open(APP).then(c => c.put(req, copia)); }
      return res;
    })));
  }
});
