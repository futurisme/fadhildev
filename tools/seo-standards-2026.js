/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Declarative 2026-11-18 Top-Tier Search Eligibility & Site Configuration Knowledge Base.
 * Zero external SEO APIs or external index dependencies.
 */

export const SEO_DATABASE_META = {
  version: '2026-11-18',
  targetDateISO: '2026-11-18',
  engineName: 'FadhilDev Custom Agent-Model SEO & Edge Auditor',
  canonicalOrigin: 'https://fadhil.dev',
  canonicalRootUrl: 'https://fadhil.dev/',
};

export const SEVERITY_PENALTY = {
  CRITICAL: 15,
  HIGH: 8,
  MEDIUM: 4,
  LOW: 2,
};

export const CATEGORY_DEFINITIONS = [
  { id: 'CRAWL', label: 'Crawlability & Indexing', weight: 16 },
  { id: 'META', label: 'Metadata, Freshness & Social', weight: 15 },
  { id: 'SCHEMA', label: 'Structured Data (2026 Rich Results)', weight: 18 },
  { id: 'EDGE', label: 'Cloudflare Edge & Routing', weight: 15 },
  { id: 'CWV', label: 'Core Web Vitals & Media', weight: 14 },
  { id: 'A11Y', label: 'Accessibility & Semantics', weight: 10 },
  { id: 'PWA', label: 'PWA Manifest & Service Worker', weight: 6 },
  { id: 'SECURITY', label: 'Security & Code Hygiene', weight: 6 },
];

export const RULES_DATABASE_2026 = [
  // 1. CRAWLABILITY & INDEXING
  {
    id: 'CRAWL-ROBOTS-01',
    category: 'CRAWL',
    severity: 'CRITICAL',
    title: 'robots.txt permits full crawling with authoritative Sitemap directive',
    standardRef: 'Search Indexing Essentials (2026-11-18)',
    remediation: 'Ensure robots.txt allows "/", excludes only internal Cloudflare "/cdn-cgi/", never blocks /404, and declares Sitemap: https://fadhil.dev/sitemap.xml.',
  },
  {
    id: 'CRAWL-SITEMAP-01',
    category: 'CRAWL',
    severity: 'CRITICAL',
    title: 'sitemap.xml valid XML, canonical <loc>, synchronized ISO-8601 <lastmod>, and verified <image:loc> assets',
    standardRef: 'XML Sitemaps & Image Extension Protocol (2026-11-18)',
    remediation: 'Use valid XML namespaces (sitemap 0.9, xhtml, image 1.1), set <loc> to https://fadhil.dev/, sync <lastmod> to 2026-11-18 with timezone, and verify every <image:loc> exists on disk.',
  },
  {
    id: 'CRAWL-CANONICAL-01',
    category: 'CRAWL',
    severity: 'CRITICAL',
    title: 'Single authoritative self-referencing canonical URL and sitemap discovery link',
    standardRef: 'Canonical Consolidation Spec (2026-11-18)',
    remediation: 'Keep exactly one <link rel="canonical" href="https://fadhil.dev/" /> and <link rel="sitemap" type="application/xml" href="/sitemap.xml" /> on index.html.',
  },
  {
    id: 'CRAWL-ROBOTSMETA-01',
    category: 'CRAWL',
    severity: 'HIGH',
    title: 'index.html enables full rich snippet & large image indexing for robots and googlebot',
    standardRef: 'Robots Meta Tag Spec (2026-11-18)',
    remediation: 'Set robots and googlebot meta content to "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1".',
  },
  {
    id: 'CRAWL-404-01',
    category: 'CRAWL',
    severity: 'HIGH',
    title: '404.html enforces noindex, follow and omits self-referencing canonical',
    standardRef: 'Error Page Indexing Policy (2026-11-18)',
    remediation: 'Include noindex, follow on 404.html and remove any rel="canonical" from error templates.',
  },
  {
    id: 'CRAWL-HREFLANG-01',
    category: 'CRAWL',
    severity: 'MEDIUM',
    title: 'Hreflang links are consistent and do not reference redirected language paths',
    standardRef: 'Internationalization & Hreflang Best Practices (2026-11-18)',
    remediation: 'Declare x-default and en hreflang pointing to https://fadhil.dev/ without referencing 301-redirected /id or /jp paths.',
  },

  // 2. METADATA, FRESHNESS & SOCIAL CARDS
  {
    id: 'META-TITLE-01',
    category: 'META',
    severity: 'HIGH',
    title: 'Page <title> is branded, unique, and within 30–60 character snippet window',
    standardRef: 'Title Link Quality Guidelines (2026-11-18)',
    remediation: 'Keep <title> descriptive and between 30 and 60 characters.',
  },
  {
    id: 'META-DESC-01',
    category: 'META',
    severity: 'HIGH',
    title: 'Meta description is compelling and within 120–160 character optimal range',
    standardRef: 'Meta Snippet Guidelines (2026-11-18)',
    remediation: 'Write a 120–160 character description summarizing the portfolio.',
  },
  {
    id: 'META-FRESHNESS-01',
    category: 'META',
    severity: 'HIGH',
    title: 'All update timestamps are synchronized across metadata, JSON-LD, and sitemap for 2026-11-18',
    standardRef: 'Content Freshness & Lastmod Alignment (2026-11-18)',
    remediation: 'Synchronize og:updated_time, WebSite.dateModified, ProfilePage.dateModified, and sitemap.xml <lastmod> to identical 2026-11-18 ISO-8601 timestamps.',
  },
  {
    id: 'META-SOCIAL-01',
    category: 'META',
    severity: 'HIGH',
    title: 'OpenGraph & X/Twitter cards complete with verified image dimensions matching disk binary',
    standardRef: 'OpenGraph Profile & Twitter Card Spec (2026-11-18)',
    remediation: 'Ensure og:image exists on disk and og:image:width / og:image:height match the actual binary dimensions of portfolio-banner.jpg.',
  },
  {
    id: 'META-DEPRECATED-01',
    category: 'META',
    severity: 'MEDIUM',
    title: 'Zero deprecated HTML meta tags or obsolete head directives',
    standardRef: 'HTML Living Standard (2026-11-18)',
    remediation: 'Remove apple-mobile-web-app-capable (prefer mobile-web-app-capable), meta keywords, and X-UA-Compatible.',
  },

  // 3. STRUCTURED DATA (SCHEMA.ORG 2026)
  {
    id: 'SCHEMA-SYNTAX-01',
    category: 'SCHEMA',
    severity: 'CRITICAL',
    title: 'JSON-LD parses cleanly with https://schema.org context and zero dangling @id links',
    standardRef: 'Schema.org JSON-LD Graph Integrity (2026-11-18)',
    remediation: 'Ensure valid JSON-LD and verify every { "@id": "..." } reference resolves to an entity in @graph.',
  },
  {
    id: 'SCHEMA-RICHGATE-01',
    category: 'SCHEMA',
    severity: 'CRITICAL',
    title: 'Zero invalid SoftwareApplication/WebApplication items missing offers or ratings/reviews',
    standardRef: 'Google Rich Results Software App Validation (2026-11-18)',
    remediation: 'Use CreativeWork for preview/in-development showcases without pricing/reviews, or provide valid offers + aggregateRating/review.',
  },
  {
    id: 'SCHEMA-PROFILE-01',
    category: 'SCHEMA',
    severity: 'HIGH',
    title: 'ProfilePage + Person Knowledge Graph complete with verified ImageObject dimensions & clean sameAs URLs',
    standardRef: 'Google ProfilePage Structured Data (2026-11-18)',
    remediation: 'Ensure ProfilePage links mainEntity/about/hasPart, Person includes accurate ImageObject dimensions matching disk, and sameAs URLs have no tracking query parameters.',
  },
  {
    id: 'SCHEMA-ITEMLIST-01',
    category: 'SCHEMA',
    severity: 'HIGH',
    title: 'ItemList has accurate count, unique fragment URLs matching DOM ids, and complete CreativeWork properties',
    standardRef: 'Google Carousel & ItemList Spec (2026-11-18)',
    remediation: 'Ensure ItemList numberOfItems matches itemListElement.length and every CreativeWork URL resolves to a unique DOM anchor id.',
  },

  // 4. CLOUDFLARE EDGE & ROUTING
  {
    id: 'EDGE-HEADERS-01',
    category: 'EDGE',
    severity: 'CRITICAL',
    title: 'Cloudflare _headers enforces unencumbered crawling, HSTS preload, canonical Link, and /sw.js precedence',
    standardRef: 'Cloudflare Pages _headers Spec (2026-11-18)',
    remediation: 'Avoid X-Frame-Options, keep index/follow X-Robots-Tag globally, set noindex on /404 and /sitemap.xml, keep /app/* non-immutable, and place /sw.js last.',
  },
  {
    id: 'EDGE-REDIRECTS-01',
    category: 'EDGE',
    severity: 'CRITICAL',
    title: 'Cloudflare _redirects avoids soft-404s, redirect loops, and verifies all rewrite targets exist',
    standardRef: 'Cloudflare Pages _redirects Spec (2026-11-18)',
    remediation: 'Remove /404 200 soft-404 rewrites, consolidate canonical paths with 301, use 302 for in-dev routes, and verify every 200 rewrite destination exists.',
  },
  {
    id: 'EDGE-LIVE-01',
    category: 'EDGE',
    severity: 'HIGH',
    title: 'Live HTTP route simulation confirms accurate 200/301/302/404 statuses and headers',
    standardRef: 'HTTP Status & Crawler Routing Compliance (2026-11-18)',
    remediation: 'Verify /, /404, /en, /shareideas, /sw.js, /robots.txt, and /sitemap.xml return exact expected status codes and headers.',
  },

  // 5. CORE WEB VITALS & MEDIA
  {
    id: 'CWV-MEDIA-01',
    category: 'CWV',
    severity: 'HIGH',
    title: 'All images declare accurate width/height aspect ratio, modern AVIF/WebP fallback, and exist on disk',
    standardRef: 'Core Web Vitals CLS & LCP Media Spec (2026-11-18)',
    remediation: 'Match hero <img> width/height to 1588x900 actual image size, keep preload fetchpriority="high", and ensure zero unreferenced or broken assets.',
  },
  {
    id: 'CWV-SCRIPTS-01',
    category: 'CWV',
    severity: 'HIGH',
    title: 'No broken/dead inline probes (e.g. canvas AVIF probe) and CSS cache-buster synced with build',
    standardRef: 'Critical Rendering Path Efficiency (2026-11-18)',
    remediation: 'Remove broken canvas.toDataURL("image/avif") inline probe that falsely flags Chromium as no-avif; sync CSS ?v=20261118.',
  },
  {
    id: 'CWV-DIST-01',
    category: 'CWV',
    severity: 'CRITICAL',
    title: 'Production dist/ bundle preserves uncorrupted CSS links, sitemap links, and unhashed assets',
    standardRef: 'Production Build Artifact Integrity (2026-11-18)',
    remediation: 'Run vite build and verify dist/index.html and dist/404.html preserve /app/styles.css?v=20261118 and clean dist/assets/images/.',
  },

  // 6. ACCESSIBILITY & SEMANTICS
  {
    id: 'A11Y-HEADINGS-01',
    category: 'A11Y',
    severity: 'HIGH',
    title: 'Single <h1>, logical heading hierarchy without skipped levels, and accessible skip-to-content link',
    standardRef: 'WCAG 2.2 AA & Semantic HTML5 (2026-11-18)',
    remediation: 'Maintain one <h1> per page, sequential h1->h2->h3 order without skipping levels, and add a focusable skip link targeting #main-content.',
  },
  {
    id: 'A11Y-CONTROLS-01',
    category: 'A11Y',
    severity: 'HIGH',
    title: 'Native <button>/<a> controls, no role="button" divs/lis, valid alt text, and noopener external links',
    standardRef: 'WCAG 2.2 Interactive Accessibility (2026-11-18)',
    remediation: 'Use native buttons/anchors with accessible names, avoid redundant landmark roles, and add rel="noopener noreferrer" to all target="_blank" links.',
  },
  {
    id: 'A11Y-MOBILE-01',
    category: 'A11Y',
    severity: 'HIGH',
    title: 'Live browser check confirms zero horizontal overflow and exact mobile/desktop card ordering',
    standardRef: 'Mobile-First Indexing Layout Standard (2026-11-18)',
    remediation: 'Verify 390x844 mobile order (Banner -> About Me -> Socials -> Tools -> Skills -> Portfolios) and 1440x900 desktop bento layout with 0 overflow.',
  },

  // 7. PWA MANIFEST & SERVICE WORKER
  {
    id: 'PWA-MANIFEST-01',
    category: 'PWA',
    severity: 'MEDIUM',
    title: 'site.webmanifest valid with matching icon files/dimensions and consistent favicon links',
    standardRef: 'Web App Manifest & Icon Accuracy Spec (2026-11-18)',
    remediation: 'Link 32x32 /favicon.png, match apple-touch-icon attributes to actual 512x512 file (or omit wrong sizes), and verify all manifest icons exist.',
  },
  {
    id: 'PWA-SW-01',
    category: 'PWA',
    severity: 'MEDIUM',
    title: 'Service worker scopes caching strictly to same-origin + Google Fonts with updated cache version',
    standardRef: 'Service Worker Network Isolation Spec (2026-11-18)',
    remediation: 'Ensure sw.js ignores third-party scripts (YouTube) and updates CACHE_NAME to fadhil-pwa-v20261118.',
  },

  // 8. SECURITY & CODE HYGIENE
  {
    id: 'SEC-HYGIENE-01',
    category: 'SECURITY',
    severity: 'HIGH',
    title: 'Pure HTML/CSS/JS codebase, zero innerHTML mutations, zero console errors, zero leaked tokens',
    standardRef: 'Modern Secure Frontend Standards (2026-11-18)',
    remediation: 'Keep zero .ts/.tsx/.jsx files, avoid innerHTML =, and ensure zero console/network errors in live browser execution.',
  },
];
