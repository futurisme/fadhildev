import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  readImageDimensionsFromBytes,
  evaluateCloudflareHeaders,
  simulateCloudflareRedirect,
  evaluateSiteSnapshot,
} from '../tools/seo-engine-2026.js';

test('readImageDimensionsFromBytes extracts real binary dimensions for PNG and JPEG', () => {
  const pngDims = readImageDimensionsFromBytes(fs.readFileSync('pwa-192x192.png'));
  assert.deepEqual(pngDims, { format: 'png', width: 192, height: 192 });

  const jpgDims = readImageDimensionsFromBytes(fs.readFileSync('assets/images/portfolio-banner.jpg'));
  assert.deepEqual(jpgDims, { format: 'jpeg', width: 1588, height: 900 });
});

test('evaluateCloudflareHeaders enforces last-match precedence for /sw.js and /404', () => {
  const headersTxt = fs.readFileSync('_headers', 'utf8');
  const swHeaders = evaluateCloudflareHeaders(headersTxt, '/sw.js').headers;
  assert.equal(swHeaders['Service-Worker-Allowed'], '/');
  assert.equal(swHeaders['Cache-Control'], 'public, max-age=0, must-revalidate');

  const notFoundHeaders = evaluateCloudflareHeaders(headersTxt, '/404').headers;
  assert.equal(notFoundHeaders['X-Robots-Tag'], 'noindex, follow');
});

test('simulateCloudflareRedirect resolves 301 canonicals, 302 in-dev routes, and 200 legacy splats', () => {
  const redirectsTxt = fs.readFileSync('_redirects', 'utf8');
  const r301 = simulateCloudflareRedirect(redirectsTxt, '/en');
  assert.equal(r301.status, 301);
  assert.equal(r301.resolvedTarget, '/');

  const r302 = simulateCloudflareRedirect(redirectsTxt, '/shareideas');
  assert.equal(r302.status, 302);
  assert.equal(r302.resolvedTarget, '/');

  const r200 = simulateCloudflareRedirect(redirectsTxt, '/fadhil/app/styles.css');
  assert.equal(r200.status, 200);
  assert.equal(r200.resolvedTarget, '/app/styles.css');
});

test('evaluateSiteSnapshot flags invalid SoftwareApplication and og:image binary mismatch strictly', () => {
  const brokenIndex = fs
    .readFileSync('index.html', 'utf8')
    .replace('"@type": "CreativeWork"', '"@type": "SoftwareApplication"')
    .replace('<meta property="og:image:width" content="1588" />', '<meta property="og:image:width" content="1200" />');

  const report = evaluateSiteSnapshot({
    files: {
      'index.html': brokenIndex,
      '404.html': fs.readFileSync('404.html', 'utf8'),
      'robots.txt': fs.readFileSync('robots.txt', 'utf8'),
      'sitemap.xml': fs.readFileSync('sitemap.xml', 'utf8'),
      '_headers': fs.readFileSync('_headers', 'utf8'),
      '_redirects': fs.readFileSync('_redirects', 'utf8'),
      'site.webmanifest': fs.readFileSync('site.webmanifest', 'utf8'),
      'sw.js': fs.readFileSync('sw.js', 'utf8'),
    },
    imageDimensions: {
      'assets/images/portfolio-banner.jpg': { format: 'jpeg', width: 1588, height: 900 },
      'apple-touch-icon.png': { format: 'png', width: 512, height: 512 },
    },
    existingFiles: new Set([
      'index.html',
      '404.html',
      'favicon.png',
      'favicon.svg',
      'pwa-192x192.png',
      'pwa-512x512.png',
      'pwa-maskable-512x512.png',
      'apple-touch-icon.png',
      'assets/images/portfolio-banner.avif',
      'assets/images/portfolio-banner.jpg',
      'assets/images/shareideas-banner.jpg',
      'assets/images/mindmapmaker-banner.jpg',
      'assets/images/flagmaker-banner.jpg',
      'assets/images/wikipediaindonesia-banner.jpg',
    ]),
  });

  const failedIds = new Set(report.findings.map((f) => f.id));
  assert.ok(failedIds.has('SCHEMA-RICHGATE-01'), 'Must flag invalid SoftwareApplication');
  assert.ok(failedIds.has('META-SOCIAL-01'), 'Must flag og:image binary dimension mismatch');
  assert.equal(report.eligibleForTopTierSearch, false);
});
