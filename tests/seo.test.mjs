import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const indexHtml = fs.readFileSync('index.html', 'utf8');
const notFoundHtml = fs.readFileSync('404.html', 'utf8');
const headers = fs.readFileSync('_headers', 'utf8');
const redirects = fs.readFileSync('_redirects', 'utf8');
const robots = fs.readFileSync('robots.txt', 'utf8');
const sitemap = fs.readFileSync('sitemap.xml', 'utf8');
const sw = fs.readFileSync('sw.js', 'utf8');

test('index.html meets Nov 18 2026 SEO, timestamp, deprecation, and accessibility standards', () => {
  assert.match(indexHtml, /<link rel="canonical" href="https:\/\/fadhil\.dev\/" \/>/);
  assert.match(indexHtml, /<meta property="og:updated_time" content="2026-11-18T12:48:00\+07:00" \/>/);
  assert.match(indexHtml, /"dateModified": "2026-11-18T12:48:00\+07:00"/);
  assert.match(indexHtml, /href="\/app\/styles\.css\?v=20261118"/);
  assert.match(indexHtml, /<meta property="og:image:width" content="1588" \/>/);
  assert.match(indexHtml, /<meta property="og:image:height" content="900" \/>/);
  assert.match(indexHtml, /href="#main-content"/);

  // Deprecated & bloated constructs removed
  assert.doesNotMatch(indexHtml, /apple-mobile-web-app-capable/);
  assert.doesNotMatch(indexHtml, /<meta\s+name="keywords"/i);
  assert.doesNotMatch(indexHtml, /id="fadhil-theme-variants"/);
  assert.doesNotMatch(indexHtml, /youtube\.com\/iframe_api/);
  assert.doesNotMatch(indexHtml, /onerror=/);
  assert.doesNotMatch(indexHtml, /vq=hd1080/);

  // Accessibility: interactive controls use native <button>, no nested interactive controls
  assert.match(indexHtml, /id="hero-play-trigger"/);
  assert.doesNotMatch(indexHtml, /class="hero-media-wrap[^"]*"[^>]*role="button"/);
  assert.doesNotMatch(indexHtml, /<li[^>]*role="button"/);
  assert.doesNotMatch(indexHtml, /<div class="skill-pill-item[^>]*role="button"/);
  assert.doesNotMatch(indexHtml, /role="(banner|main|contentinfo)"/);

  // JSON-LD parses cleanly and contains Person + ProfilePage + ItemList
  const ldMatch = indexHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(ldMatch, 'JSON-LD script block must exist');
  const parsed = JSON.parse(ldMatch[1]);
  const types = parsed['@graph'].map((node) => node['@type']);
  assert.deepEqual(types, ['WebSite', 'Person', 'ProfilePage', 'ItemList', 'BreadcrumbList']);
  const itemList = parsed['@graph'].find((node) => node['@type'] === 'ItemList');
  assert.equal(itemList.itemListElement.length, 4);
  const seenUrls = new Set();
  for (const listItem of itemList.itemListElement) {
    assert.equal(listItem.item['@type'], 'CreativeWork');
    assert.ok(listItem.item.name && listItem.item.image && listItem.item.url);
    seenUrls.add(listItem.item.url);
  }
  assert.equal(seenUrls.size, 4);
});

test('404.html enforces noindex without self-canonical', () => {
  assert.match(notFoundHtml, /<meta name="robots" content="noindex, follow" \/>/);
  assert.match(notFoundHtml, /<meta name="googlebot" content="noindex, follow" \/>/);
  assert.doesNotMatch(notFoundHtml, /rel="canonical"/);
  assert.match(notFoundHtml, /href="\/app\/styles\.css\?v=20261118"/);
});

test('Cloudflare _headers and _redirects are unencumbered and properly ordered', () => {
  assert.doesNotMatch(headers, /X-Frame-Options/i);
  assert.match(headers, /X-Robots-Tag: index, follow, max-image-preview:large/);
  assert.match(headers, /\/app\/\*\s+Cache-Control: public, max-age=3600, stale-while-revalidate=86400/);
  assert.ok(headers.indexOf('/sw.js') > headers.indexOf('/*.ico'), '/sw.js rule must come after wildcard asset rules');
  assert.doesNotMatch(redirects, /^\/404\s+\/404\.html\s+200/m);
});

test('robots.txt, sitemap.xml, and sw.js reflect Nov 18 2026 configuration', () => {
  assert.match(robots, /^Allow: \/$/m);
  assert.doesNotMatch(robots, /^Disallow: \/404/m);
  assert.match(robots, /^Sitemap: https:\/\/fadhil\.dev\/sitemap\.xml$/m);
  assert.match(sitemap, /<lastmod>2026-11-18T12:48:00\+07:00<\/lastmod>/);
  assert.match(sw, /const CACHE_NAME = 'fadhil-pwa-v20261118';/);
  assert.match(sw, /ignoreSearch: true/);
});
