// Frequent Workouts: works offline in the gym after the first visit. Network first for the page, cache first for
// versioned files. Only this app's cache is touched.
const CACHE = 'frequent-workouts-3';
const FILES = ['./', 'index.html', 'style.css?v=3', 'weigh.js?v=3', 'app.js?v=3', 'lib/xlsx.full.min.js', 'icon.svg', 'icon-180.png', 'icon-192.png', 'manifest.webmanifest'];
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).catch(() => {})); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('frequent-workouts-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  if (e.request.mode === 'navigate' || u.pathname.endsWith('/') || u.pathname.endsWith('/index.html')) {
    e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put('index.html', c)); return r; })
      .catch(() => caches.match('index.html')));
    return;
  }
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); } return r; })));
});
