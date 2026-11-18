/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Fadhil.dev Progressive Web App Service Worker (Updated: November 17, 2026)
 */

const CACHE_NAME = 'fadhil-pwa-v20261117b';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/404.html',
  '/app/styles.css',
  '/app/main.js',
  '/app/boot.js',
  '/app/responsive.js',
  '/app/audio.js',
  '/app/theme.js',
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
  '/assets/images/portfolio-banner.avif',
  '/assets/images/portfolio-banner.webp',
  '/assets/images/portfolio-banner.jpg',
  '/assets/images/theme.avif',
  '/assets/images/theme.webp',
  '/assets/images/theme.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        Promise.allSettled(
          PRECACHE_ASSETS.map((assetUrl) => cache.add(assetUrl))
        )
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
            return Promise.resolve();
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (!req.url || !req.url.startsWith('http')) return;

  const url = new URL(req.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isGoogleFonts = url.hostname === 'fonts.gstatic.com' || url.hostname === 'fonts.googleapis.com';

  // Never intercept third-party requests (e.g. YouTube embed/API) or Vite dev internals
  if (
    req.method !== 'GET' ||
    (!isSameOrigin && !isGoogleFonts) ||
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/node_modules')
  ) {
    return;
  }

  // 1. Navigation requests (HTML): Network first, falling back to cache, then /index.html
  if (req.mode === 'navigate' && isSameOrigin) {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200 && networkRes.type === 'basic') {
            const resClone = networkRes.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(req, resClone))
              .catch(() => {});
          }
          return networkRes;
        })
        .catch(() =>
          caches.match(req, { ignoreSearch: true }).then((cachedRes) => cachedRes || caches.match('/index.html'))
        )
    );
    return;
  }

  // 2. Static Assets (Same-origin CSS, JS, Images, Manifest & Google Fonts): Stale-While-Revalidate
  const isStatic =
    isSameOrigin &&
    /\.(?:css|js|mjs|webp|avif|png|jpg|jpeg|svg|ico|woff2|woff|ttf|webmanifest)$/i.test(url.pathname);
  if (isStatic || isGoogleFonts) {
    event.respondWith(
      caches.match(req, { ignoreSearch: true }).then((cachedRes) => {
        const fetchPromise = fetch(req)
          .then((networkRes) => {
            if (
              networkRes &&
              networkRes.status === 200 &&
              (networkRes.type === 'basic' || networkRes.type === 'cors')
            ) {
              const resClone = networkRes.clone();
              caches
                .open(CACHE_NAME)
                .then((cache) => cache.put(req, resClone))
                .catch(() => {});
            }
            return networkRes;
          })
          .catch(() => cachedRes);

        return cachedRes || fetchPromise;
      })
    );
    return;
  }

  // 3. Default same-origin: Network with cache fallback
  event.respondWith(fetch(req).catch(() => caches.match(req, { ignoreSearch: true })));
});
