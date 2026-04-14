/* Legacy service worker compatibility shim.
 * If a browser still has an old registration, this file removes it cleanly.
 */
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map((key) => caches.delete(key)));
      } catch (_) {
        // Ignore cache cleanup errors.
      }

      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of clients) {
        client.navigate(client.url);
      }
    })(),
  );
});

self.addEventListener('fetch', () => {
  // No-op on purpose. Current app version does not use a service worker.
});
