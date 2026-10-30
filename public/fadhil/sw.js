/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Fadhil.dev Progressive Web App Service Worker (2026 Edition)
 */

const CACHE_NAME = 'fadhil-pwa-v20261030';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/404.html',
  '/app/styles.css',
  '/app/main.js',
  '/app/theme.js',
  '/app/audio.js',
  '/app/youtube.js',
  '/app/lang.js',
  '/app/interactive.js',
  '/app/pwa.js',
  '/favicon.svg',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/site.webmanifest',
  '/assets/images/portfolio-banner.webp',
  '/assets/images/portfolio-banner.jpg',
  '/assets/images/theme.webp',
  '/assets/images/theme.avif'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Ignore non-GET requests and internal Vite dev requests
  if (req.method !== 'GET' || url.pathname.startsWith('/@') || url.pathname.startsWith('/node_modules')) {
    return;
  }

  // 1. Navigation requests (HTML): Network first, falling back to cache, then /index.html
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const resClone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          }
          return networkRes;
        })
        .catch(() => {
          return caches.match(req).then((cachedRes) => {
            return cachedRes || caches.match('/index.html');
          });
        })
    );
    return;
  }

  // 2. Static Assets (CSS, JS, Images, Fonts): Cache first with Stale-While-Revalidate
  const isStatic = /\.(?:css|js|mjs|webp|avif|png|jpg|jpeg|svg|ico|woff2|woff|ttf)$/i.test(url.pathname);
  if (isStatic || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.match(req).then((cachedRes) => {
        const fetchPromise = fetch(req)
          .then((networkRes) => {
            if (networkRes && networkRes.status === 200) {
              const resClone = networkRes.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
            }
            return networkRes;
          })
          .catch(() => cachedRes);

        return cachedRes || fetchPromise;
      })
    );
    return;
  }

  // Default: Network with cache fallback
  event.respondWith(
    fetch(req).catch(() => caches.match(req))
  );
});
