const CACHE_VERSION = 'kratom-calc-v5.2.0';
const PRECACHE_URLS = ['./', './index.html', './manifest.json'];

self.addEventListener('install', e => {
    self.skipWaiting();
    e.waitUntil(caches.open(CACHE_VERSION).then(c => c.addAll(PRECACHE_URLS).catch(() => {})));
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('message', e => {
    if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', e => {
    if (e.request.method !== 'GET') return;
    const url = new URL(e.request.url);
    if (e.request.mode === 'navigate' || url.pathname.endsWith('.html')) {
        e.respondWith(
            fetch(e.request).then(res => {
                const copy = res.clone();
                caches.open(CACHE_VERSION).then(c => c.put(e.request, copy));
                return res;
            }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
        );
        return;
    }
    e.respondWith(
        caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
            if (res.ok && res.type === 'basic') {
                const copy = res.clone();
                caches.open(CACHE_VERSION).then(c => c.put(e.request, copy));
            }
            return res;
        }).catch(() => cached))
    );
});