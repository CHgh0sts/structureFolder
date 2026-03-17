const CACHE_NAME = "file-organizer-v1";
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Ignorer les erreurs de cache pour les assets non critiques
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ne pas intercepter les API routes
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // Stratégie network-first pour les pages
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Mettre en cache les réponses réussies
        if (response.ok && request.method === "GET") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => {
        // Fallback sur le cache si pas de réseau
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          // Retourner la page d'accueil en offline
          return caches.match("/");
        });
      })
  );
});
