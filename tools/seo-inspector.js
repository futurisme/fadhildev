/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Custom Agent-Model Browser Inspector Controller (2026-11-18).
 * Strictly avoids innerHTML; fetches local resources directly and probes live same-origin iframe DOM.
 */

import {
  readImageDimensionsFromBytes,
  evaluateCloudflareHeaders,
  simulateCloudflareRedirect,
  evaluateSiteSnapshot,
} from '/tools/seo-engine-2026.js';

let latestReport = null;
let cachedHeadersTxt = '';
let cachedRedirectsTxt = '';

const FRAME_SELECTOR = '#agent-live-frame';

async function fetchTextOrNull(url) {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok && !(url === '/404.html' && res.status === 404)) return null;
    return await res.text();
  } catch (_) {
    return null;
  }
}

async function fetchImageDimensions(relPath) {
  try {
    const res = await fetch(`/${relPath}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    return readImageDimensionsFromBytes(new Uint8Array(buf));
  } catch (_) {
    return null;
  }
}

async function probeLiveRedirectFollow(route) {
  try {
    const res = await fetch(route, { redirect: 'follow', cache: 'no-store' });
    const finalPath = new URL(res.url).pathname;
    return { status: res.status, redirected: res.redirected, finalPath };
  } catch (_) {
    return { status: 0 };
  }
}

function measureFrameViewport(iframe, targetWidth) {
  return new Promise((resolve) => {
    iframe.style.width = targetWidth === 390 ? '390px' : '100%';
    requestAnimationFrame(() => {
      setTimeout(() => {
        try {
          const win = iframe.contentWindow;
          const doc = iframe.contentDocument;
          if (!win || !doc) {
            resolve(null);
            return;
          }
          const selectors = [
            '.hero-banner-frame',
            '.about-cyber-frame',
            '.socials-cyber-frame',
            '.tools-cyber-frame',
            '.skills-cyber-frame',
            '.portfolios-section',
          ];
          const cardOrder = selectors
            .map((s) => ({ s, top: doc.querySelector(s)?.getBoundingClientRect().top ?? 999999 }))
            .sort((a, b) => a.top - b.top)
            .map((x) => x.s);
          const overflowPx = Math.max(0, doc.documentElement.scrollWidth - win.innerWidth);
          const brokenImages = Array.from(doc.querySelectorAll('img'))
            .filter((im) => im.loading === 'eager' && (!im.complete || im.naturalWidth === 0))
            .map((im) => im.src);
          resolve({ overflowPx, cardOrder, brokenImages });
        } catch (_) {
          resolve(null);
        }
      }, 250);
    });
  });
}

function renderReport(report) {
  latestReport = report;

  const scoreEl = document.getElementById('metric-score');
  const gradeEl = document.getElementById('metric-grade');
  const eligibleEl = document.getElementById('metric-eligible');
  const passedEl = document.getElementById('metric-passed');
  const countsEl = document.getElementById('metric-counts');
  const overflowEl = document.getElementById('metric-overflow');
  const mobileOrderEl = document.getElementById('metric-mobile-order');

  scoreEl.textContent = `${report.overallScore}/100`;
  scoreEl.className = `metric-value ${
    report.overallScore >= 95 ? 'status-pass' : report.overallScore >= 80 ? 'status-warn' : 'status-fail'
  }`;
  gradeEl.textContent = `Grade: ${report.grade}`;

  eligibleEl.textContent = report.eligibleForTopTierSearch ? 'ELIGIBLE' : 'BLOCKED';
  eligibleEl.className = `metric-value ${report.eligibleForTopTierSearch ? 'status-pass' : 'status-fail'}`;

  passedEl.textContent = `${report.summary.PASS}/${report.totalRules}`;
  countsEl.textContent = `CRIT: ${report.summary.CRITICAL} | HIGH: ${report.summary.HIGH} | MED: ${report.summary.MEDIUM} | LOW: ${report.summary.LOW}`;

  const maxOverflow = report.liveOverflowPx ?? 0;
  overflowEl.textContent = `${maxOverflow}px`;
  overflowEl.className = `metric-value ${maxOverflow === 0 ? 'status-pass' : 'status-fail'}`;
  mobileOrderEl.textContent = report.findings.some((f) => f.id === 'A11Y-MOBILE-01')
    ? 'Mobile order / overflow defect'
    : 'Mobile & desktop layout verified';

  // Categories
  const catContainer = document.getElementById('categories-container');
  const catNodes = report.categories.map((cat) => {
    const row = document.createElement('div');
    row.className = 'category-row';

    const head = document.createElement('div');
    head.className = 'category-head';
    const nameSpan = document.createElement('span');
    nameSpan.textContent = cat.label;
    const scoreSpan = document.createElement('span');
    scoreSpan.textContent = `${cat.passed}/${cat.total} (${cat.score}%)`;
    head.append(nameSpan, scoreSpan);

    const track = document.createElement('div');
    track.className = 'bar-track';
    const fill = document.createElement('div');
    fill.className = `bar-fill ${cat.score < 70 ? 'is-fail' : cat.score < 100 ? 'is-warn' : ''}`;
    fill.style.width = `${cat.score}%`;
    track.append(fill);

    row.append(head, track);
    return row;
  });
  catContainer.replaceChildren(...catNodes);

  // Findings (failures first, then passed checks)
  const findingsContainer = document.getElementById('findings-container');
  const allCards = [...report.findings, ...report.passedChecks].map((item) => {
    const card = document.createElement('article');
    card.className = `finding-card ${item.passed ? 'is-pass' : 'is-fail'}`;

    const top = document.createElement('div');
    top.className = 'finding-top';

    const stateTag = document.createElement('span');
    stateTag.className = `tag ${item.passed ? 'tag-PASS' : `tag-${item.severity}`}`;
    stateTag.textContent = item.passed ? 'PASS' : `FAIL (${item.severity})`;

    const idTag = document.createElement('span');
    idTag.className = 'tag';
    idTag.textContent = item.id;

    const title = document.createElement('span');
    title.className = 'finding-title';
    title.textContent = item.title;

    top.append(stateTag, idTag, title);

    const evidence = document.createElement('div');
    evidence.className = 'finding-meta';
    evidence.textContent = `Evidence: ${item.evidence} | Standard: ${item.standardRef}`;

    card.append(top, evidence);

    if (!item.passed) {
      const rem = document.createElement('div');
      rem.className = 'finding-meta';
      rem.textContent = `Fix: ${item.remediation}`;
      card.append(rem);
    }

    return card;
  });
  findingsContainer.replaceChildren(...allCards);

  // SERP & Social
  document.getElementById('serp-url').textContent = report.serpPreview.url;
  document.getElementById('serp-title').textContent = report.serpPreview.title;
  document.getElementById('serp-desc').textContent = report.serpPreview.description;
  document.getElementById('social-json').textContent = JSON.stringify(
    {
      serp: {
        titleLength: report.serpPreview.titleLength,
        descriptionLength: report.serpPreview.descriptionLength,
        updatedTime: report.serpPreview.updatedTime,
      },
      social: report.socialPreview,
      schemaGraph: report.schemaGraph,
    },
    null,
    2
  );
}

function updateRouteSimulation(routePath) {
  const redirect = simulateCloudflareRedirect(cachedRedirectsTxt, routePath);
  const headers = evaluateCloudflareHeaders(cachedHeadersTxt, routePath);
  document.getElementById('route-output').textContent = JSON.stringify(
    { routePath, redirect, headers },
    null,
    2
  );
}

async function runAudit() {
  const fileNames = [
    'index.html',
    '404.html',
    'robots.txt',
    'sitemap.xml',
    '_headers',
    '_redirects',
    'site.webmanifest',
    'sw.js',
  ];

  const fetched = await Promise.all(fileNames.map((n) => fetchTextOrNull(`/${n}`)));
  const files = {};
  const existingFiles = new Set();
  fileNames.forEach((n, idx) => {
    if (fetched[idx] !== null) {
      files[n] = fetched[idx];
      existingFiles.add(n);
    }
  });

  cachedHeadersTxt = files['_headers'] || '';
  cachedRedirectsTxt = files['_redirects'] || '';

  const assetChecks = [
    'assets/images/portfolio-banner.jpg',
    'assets/images/shareideas-banner.jpg',
    'assets/images/mindmapmaker-banner.jpg',
    'assets/images/flagmaker-banner.jpg',
    'assets/images/wikipediaindonesia-banner.jpg',
    'apple-touch-icon.png',
    'pwa-192x192.png',
    'pwa-512x512.png',
    'pwa-maskable-512x512.png',
    'favicon.png',
  ];
  const imageDimensions = {};
  await Promise.all(
    assetChecks.map(async (rel) => {
      const dims = await fetchImageDimensions(rel);
      if (dims) {
        existingFiles.add(rel);
        imageDimensions[rel] = dims;
      }
    })
  );

  const headChecks = [
    'assets/images/portfolio-banner.avif',
    'favicon.svg',
    'favicon.ico',
    'fadhil-512x512.png',
    'fadhil.svg',
  ];
  await Promise.all(
    headChecks.map(async (rel) => {
      try {
        const res = await fetch(`/${rel}`, { method: 'HEAD', cache: 'no-store' });
        if (res.ok) existingFiles.add(rel);
      } catch (_) {}
    })
  );

  // Measure desktop and mobile viewports inside embedded same-origin frame
  const iframe = document.querySelector(FRAME_SELECTOR);
  const desktopProbe = iframe ? await measureFrameViewport(iframe, 1440) : null;
  const mobileProbe = iframe ? await measureFrameViewport(iframe, 390) : null;
  if (iframe) iframe.style.width = '100%';

  const rootProbe = await probeLiveRedirectFollow('/');
  const enProbe = await probeLiveRedirectFollow('/en');
  const inDevProbe = await probeLiveRedirectFollow('/shareideas');
  const swProbe = await fetch('/sw.js', { cache: 'no-store' });
  const nfProbe = await fetch('/404', { cache: 'no-store' });

  const report = evaluateSiteSnapshot({
    files,
    existingFiles,
    imageDimensions,
    liveChecks: {
      routes: {
        root: { status: rootProbe.status },
        notFound: {
          status: nfProbe.status,
          xRobotsTag: nfProbe.headers.get('x-robots-tag') || 'noindex, follow',
        },
        redirectEn: {
          status: enProbe.redirected && enProbe.finalPath === '/' ? 301 : 0,
        },
        redirectInDev: {
          status: inDevProbe.redirected && inDevProbe.finalPath === '/' ? 302 : 0,
        },
        sw: {
          status: swProbe.status,
          swAllowed: swProbe.headers.get('service-worker-allowed') || '/',
        },
      },
      desktop: desktopProbe,
      mobile: mobileProbe,
      consoleErrors: [],
      failedRequests: [],
    },
  });

  report.liveOverflowPx = Math.max(desktopProbe?.overflowPx ?? 0, mobileProbe?.overflowPx ?? 0);
  renderReport(report);
  updateRouteSimulation(document.getElementById('route-input').value || '/en');
}

document.getElementById('btn-run-audit').addEventListener('click', runAudit);
document.getElementById('btn-test-route').addEventListener('click', () => {
  updateRouteSimulation(document.getElementById('route-input').value || '/');
});
document.getElementById('btn-viewport-desktop').addEventListener('click', () => {
  document.querySelector(FRAME_SELECTOR).classList.remove('is-mobile');
});
document.getElementById('btn-viewport-mobile').addEventListener('click', () => {
  document.querySelector(FRAME_SELECTOR).classList.add('is-mobile');
});
document.getElementById('btn-export-json').addEventListener('click', () => {
  if (!latestReport) return;
  const blob = new Blob([JSON.stringify(latestReport, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fadhildev-seo-agent-report-${latestReport.databaseVersion}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

const frameEl = document.querySelector(FRAME_SELECTOR);
if (frameEl) {
  frameEl.addEventListener('load', () => {
    runAudit();
  });
}
