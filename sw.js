// Retires the service worker that used to live at the site root (Linear Grooves before it moved to
// linear-grooves/). Its scope covered both apps and made them install as one. Phones that still have it
// fetch this file on their next visit: it deletes the old "lg-" caches, unregisters itself and reloads
// the open pages so they are served fresh from the network.
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('lg-')).map((k) => caches.delete(k)));
    await self.registration.unregister();
    const pages = await self.clients.matchAll({ type: 'window' });
    pages.forEach((c) => c.navigate(c.url));
  })());
});
