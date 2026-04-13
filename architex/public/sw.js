// ── Architex Service Worker ──────────────────────────────────────
// Version-based cache management with multiple caching strategies.

const SW_VERSION = '1.0.0';

const CACHE_PREFIX = 'architex';
const SHELL_CACHE = `${CACHE_PREFIX}-shell-v${SW_VERSION}`;
const API_CACHE = `${CACHE_PREFIX}-api-v${SW_VERSION}`;
const FONT_CACHE = `${CACHE_PREFIX}-fonts-v${SW_VERSION}`;
const IMAGE_CACHE = `${CACHE_PREFIX}-images-v${SW_VERSION}`;

const ALL_CACHES = [SHELL_CACHE, API_CACHE, FONT_CACHE, IMAGE_CACHE];

// App shell resources to precache on install
const SHELL_URLS = [
  '/',
  '/offline.html',
];

// Max entries for the image cache to prevent unbounded growth
const IMAGE_CACHE_LIMIT = 60;

// ── Install ─────────────────────────────────────────────────────
// Precache the app shell so the core UI loads offline.

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_URLS))
  );
});

// ── Activate ────────────────────────────────────────────────────
// Remove old versioned caches so stale assets don't persist.

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && !ALL_CACHES.includes(key))
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch ───────────────────────────────────────────────────────
// Route requests to the appropriate caching strategy.

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and non-http(s) requests
  if (!url.protocol.startsWith('http')) return;

  // Font requests -- cache-first (long-lived, rarely change)
  if (isFontRequest(url)) {
    event.respondWith(cacheFirst(request, FONT_CACHE));
    return;
  }

  // Image requests -- cache-first with size limit
  if (isImageRequest(url)) {
    event.respondWith(cacheFirstWithLimit(request, IMAGE_CACHE, IMAGE_CACHE_LIMIT));
    return;
  }

  // API / data requests -- network-first with cache fallback
  if (isApiRequest(url)) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  // Navigation requests -- network-first, offline fallback to cached page
  if (request.mode === 'navigate') {
    event.respondWith(navigationHandler(request));
    return;
  }

  // All other static assets (JS, CSS bundles) -- stale-while-revalidate
  event.respondWith(staleWhileRevalidate(request, SHELL_CACHE));
});

// ── Push Notifications ──────────────────────────────────────────

self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: data.icon || '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        url: data.url || '/',
      },
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';
  event.waitUntil(clients.openWindow(targetUrl));
});

// ── Skip Waiting Message ────────────────────────────────────────
// Allow the UpdateToast to force activation of a new SW version.

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ── Request classifiers ─────────────────────────────────────────

function isFontRequest(url) {
  // Google Fonts, self-hosted Geist fonts, or any woff/woff2/ttf/otf
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    return true;
  }
  return /\.(woff2?|ttf|otf|eot)(\?.*)?$/.test(url.pathname);
}

function isImageRequest(url) {
  return /\.(png|jpe?g|gif|webp|avif|svg|ico)(\?.*)?$/.test(url.pathname);
}

function isApiRequest(url) {
  return url.pathname.startsWith('/api/');
}

// ── Caching strategies ──────────────────────────────────────────

/** Cache-first: return cached response, fall back to network. */
function cacheFirst(request, cacheName) {
  return caches.open(cacheName).then((cache) =>
    cache.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok) {
          cache.put(request, response.clone());
        }
        return response;
      });
    })
  );
}

/** Cache-first with an eviction limit on the number of entries. */
function cacheFirstWithLimit(request, cacheName, limit) {
  return caches.open(cacheName).then((cache) =>
    cache.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok) {
          cache.put(request, response.clone());
          trimCache(cacheName, limit);
        }
        return response;
      });
    })
  );
}

/** Network-first: try network, fall back to cache. */
function networkFirst(request, cacheName) {
  return caches.open(cacheName).then((cache) =>
    fetch(request)
      .then((response) => {
        if (response.ok) {
          cache.put(request, response.clone());
        }
        return response;
      })
      .catch(() => cache.match(request))
  );
}

/** Stale-while-revalidate: return cache immediately, update in background. */
function staleWhileRevalidate(request, cacheName) {
  return caches.open(cacheName).then((cache) =>
    cache.match(request).then((cached) => {
      const networkFetch = fetch(request).then((response) => {
        if (response.ok) {
          cache.put(request, response.clone());
        }
        return response;
      });
      return cached || networkFetch;
    })
  );
}

/** Navigation handler: network-first with offline fallback page. */
function navigationHandler(request) {
  return fetch(request).catch(() =>
    caches.match('/offline.html').then((offlinePage) =>
      offlinePage || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } })
    )
  );
}

// ── Utilities ───────────────────────────────────────────────────

/** Trim a cache to at most `maxEntries` items (FIFO). */
function trimCache(cacheName, maxEntries) {
  caches.open(cacheName).then((cache) =>
    cache.keys().then((keys) => {
      if (keys.length > maxEntries) {
        cache.delete(keys[0]).then(() => trimCache(cacheName, maxEntries));
      }
    })
  );
}
