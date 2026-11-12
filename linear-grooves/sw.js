// Offline cache for the app shell. Bump VERSION when shipping changes.
// Only "grooves-" caches are ours: the other apps in ../ share this origin.
const VERSION = 'grooves-v35';
const SHELL = ['./', 'index.html', 'sticking.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png'];

// cache: 'reload' skips the browser's HTTP cache, so a new version never mixes in old files.
// The build gives JS/CSS hashed names (and splits off chunks the pages load later); assets/files.json lists them all.
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then(async (c) => {
    await c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' })));
    const files = await (await fetch('assets/files.json', { cache: 'reload' })).json();
    await c.addAll(files);
  }).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k.startsWith('grooves-') && k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Stale-while-revalidate: answer from cache, refresh in the background.
// Covers Google Fonts too, so the typefaces keep working offline after the first visit.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.open(VERSION).then(async (cache) => {
    const hit = await cache.match(e.request, { ignoreSearch: true });
    const net = fetch(e.request).then((res) => {
      if (res && (res.ok || res.type === 'opaque')) cache.put(e.request, res.clone());
      return res;
    }).catch(() => hit);
    return hit || net;
  }));
});
