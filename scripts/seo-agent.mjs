/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Custom Agent-Model CLI Tool for SEO, Rich Results, Accessibility & Cloudflare Edge Auditing (2026-11-18).
 * Operates completely standalone with zero external SEO APIs or external search indexes.
 */

import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
  readImageDimensionsFromBytes,
  evaluateCloudflareHeaders,
  evaluateSiteSnapshot,
} from '../tools/seo-engine-2026.js';
import { resolveRouteDecision } from '../vite.config.js';

const execFileAsync = promisify(execFile);

const args = new Set(process.argv.slice(2));
const isStrict = args.has('--strict');
const isStaticOnly = args.has('--static-only');
const isJson = args.has('--json');

const cwd = process.cwd();

function readIfExists(relPath) {
  const full = path.resolve(cwd, relPath);
  return fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : null;
}

function collectProjectInventory() {
  const files = {};
  for (const name of [
    'index.html',
    '404.html',
    'robots.txt',
    'sitemap.xml',
    '_headers',
    '_redirects',
    'site.webmanifest',
    'sw.js',
    'dist/index.html',
    'dist/404.html',
  ]) {
    const content = readIfExists(name);
    if (content !== null) files[name] = content;
  }

  const existingFiles = new Set();
  const disallowedCodeFiles = [];
  const usedAssets = new Set();
  const diskAssetPaths = [];

  function walk(dirRel) {
    const abs = dirRel ? path.resolve(cwd, dirRel) : cwd;
    for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
      if (['node_modules', '.git', 'dist', '.playwright-cli', '.aistudio'].includes(entry.name)) continue;
      const rel = dirRel ? `${dirRel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        walk(rel);
      } else {
        existingFiles.add(rel);
        if (/\.(ts|tsx|jsx)$/.test(entry.name)) {
          disallowedCodeFiles.push(rel);
        }
        if (
          /\.(html|css|js|webmanifest)$/.test(entry.name) &&
          !rel.startsWith('tests/') &&
          !rel.startsWith('scripts/') &&
          !rel.startsWith('tools/')
        ) {
          const text = fs.readFileSync(path.resolve(cwd, rel), 'utf8');
          const regex = /["'(](\/[a-zA-Z0-9_\-./]+\.(?:avif|webp|png|jpg|jpeg|svg|ico|webmanifest|mp3|wav|ogg))/g;
          let m;
          while ((m = regex.exec(text)) !== null) {
            usedAssets.add(m[1].replace(/^\/fadhil\//, '/'));
          }
        }
      }
    }
  }
  walk('');

  function walkAssets(dirRel) {
    const abs = path.resolve(cwd, dirRel);
    if (!fs.existsSync(abs)) return;
    for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
      const rel = `${dirRel}/${entry.name}`;
      if (entry.isDirectory()) walkAssets(rel);
      else diskAssetPaths.push('/' + rel);
    }
  }
  walkAssets('assets');

  const appJsFiles = {};
  for (const dir of ['app', 'tools']) {
    const absDir = path.resolve(cwd, dir);
    if (!fs.existsSync(absDir)) continue;
    for (const entry of fs.readdirSync(absDir)) {
      if (entry.endsWith('.js')) {
        appJsFiles[`${dir}/${entry}`] = fs.readFileSync(path.join(absDir, entry), 'utf8');
      }
    }
  }

  const imageDimensions = {};
  const imageTargets = [
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
  for (const imgRel of imageTargets) {
    const abs = path.resolve(cwd, imgRel);
    if (fs.existsSync(abs)) {
      const bytes = fs.readFileSync(abs);
      const dims = readImageDimensionsFromBytes(bytes);
      if (dims) imageDimensions[imgRel] = dims;
    }
  }

  return {
    files,
    existingFiles,
    diskAssetPaths,
    referencedAssets: usedAssets,
    disallowedCodeFiles,
    appJsFiles,
    imageDimensions,
  };
}

function startSimulatedCloudflareServer(serveRoot, headersTxt) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlObj = new URL(req.url || '/', 'http://127.0.0.1');
      const decision = resolveRouteDecision({
        pathname: urlObj.pathname,
        search: urlObj.search,
        method: req.method,
        cwd: serveRoot,
      });

      const cfHeaders = evaluateCloudflareHeaders(headersTxt, urlObj.pathname).headers;
      for (const [k, v] of Object.entries(cfHeaders)) {
        res.setHeader(k, v);
      }

      if (decision.action === 'redirect') {
        res.writeHead(decision.status, { Location: decision.location });
        res.end();
        return;
      }
      if (decision.action === '404') {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('X-Robots-Tag', 'noindex, follow');
        fs.createReadStream(decision.filePath).pipe(res);
        return;
      }
      if (decision.action === 'static') {
        res.setHeader('Content-Type', decision.mimeType);
        res.setHeader('Content-Length', decision.size);
        fs.createReadStream(decision.filePath).pipe(res);
        return;
      }
      const targetHtml = path.resolve(serveRoot, urlObj.pathname === '/404.html' ? '404.html' : 'index.html');
      if (fs.existsSync(targetHtml)) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        fs.createReadStream(targetHtml).pipe(res);
        return;
      }
      res.statusCode = 404;
      res.end('Not found');
    });
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      resolve({ server, port: addr.port, baseUrl: `http://127.0.0.1:${addr.port}` });
    });
  });
}

async function runPlaywrightEval(session, expression) {
  const { stdout: out } = await execFileAsync('playwright-cli', [`-s=${session}`, 'eval', expression], {
    cwd,
    encoding: 'utf8',
    timeout: 20000,
  });
  const marker = '### Result\n';
  const idx = out.indexOf(marker);
  if (idx === -1) return null;
  const after = out.slice(idx + marker.length).split('\n### ')[0].trim();
  const parsedStr = JSON.parse(after);
  return typeof parsedStr === 'string' ? JSON.parse(parsedStr) : parsedStr;
}

async function runLiveProbes(inventory) {
  const serveRoot = fs.existsSync(path.resolve(cwd, 'dist/index.html')) ? path.resolve(cwd, 'dist') : cwd;
  const headersTxt = inventory.files['_headers'] || '';
  const { server, baseUrl } = await startSimulatedCloudflareServer(serveRoot, headersTxt);
  const session = `seoagent${process.pid}`;

  try {
    const probeRoute = async (route) => {
      const res = await fetch(`${baseUrl}${route}`, { redirect: 'manual' });
      return {
        status: res.status,
        location: res.headers.get('location'),
        xRobotsTag: res.headers.get('x-robots-tag'),
        link: res.headers.get('link'),
        swAllowed: res.headers.get('service-worker-allowed'),
        contentType: res.headers.get('content-type'),
      };
    };

    const routes = {
      root: await probeRoute('/'),
      notFound: await probeRoute('/404'),
      redirectEn: await probeRoute('/en'),
      redirectInDev: await probeRoute('/shareideas'),
      sw: await probeRoute('/sw.js'),
      robots: await probeRoute('/robots.txt'),
      sitemap: await probeRoute('/sitemap.xml'),
    };

    let desktop = null;
    let mobile = null;
    let consoleErrors = [];
    const failedRequests = [];

    try {
      await execFileAsync('playwright-cli', [`-s=${session}`, 'open', '--browser=chromium', baseUrl], {
        cwd,
        encoding: 'utf8',
        timeout: 25000,
      });

      await execFileAsync('playwright-cli', [`-s=${session}`, 'resize', '1440', '900'], {
        cwd,
        encoding: 'utf8',
        timeout: 10000,
      });

      desktop = await runPlaywrightEval(
        session,
        `() => JSON.stringify({
          overflowPx: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
          brokenImages: Array.from(document.querySelectorAll('img')).filter(i => i.loading === 'eager' && (!i.complete || i.naturalWidth === 0)).map(i => i.src)
        })`
      );

      await execFileAsync('playwright-cli', [`-s=${session}`, 'resize', '390', '844'], {
        cwd,
        encoding: 'utf8',
        timeout: 10000,
      });

      mobile = await runPlaywrightEval(
        session,
        `() => {
          const selectors = ['.hero-banner-frame','.about-cyber-frame','.socials-cyber-frame','.tools-cyber-frame','.skills-cyber-frame','.portfolios-section'];
          const cardOrder = selectors
            .map(s => ({ s, top: document.querySelector(s)?.getBoundingClientRect().top ?? 999999 }))
            .sort((a, b) => a.top - b.top)
            .map(x => x.s);
          return JSON.stringify({
            overflowPx: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
            cardOrder,
            brokenImages: Array.from(document.querySelectorAll('img')).filter(i => i.loading === 'eager' && (!i.complete || i.naturalWidth === 0)).map(i => i.src)
          });
        }`
      );

      const { stdout: consoleOut } = await execFileAsync('playwright-cli', [`-s=${session}`, 'console', 'error'], {
        cwd,
        encoding: 'utf8',
        timeout: 10000,
      });
      if (!/\bErrors:\s*0\b/.test(consoleOut) && !/Returning 0 messages for level "error"/.test(consoleOut)) {
        consoleErrors = [consoleOut.trim()];
      }
    } finally {
      try {
        await execFileAsync('playwright-cli', [`-s=${session}`, 'close'], { cwd, encoding: 'utf8', timeout: 8000 });
      } catch (_) {}
    }

    return { routes, desktop, mobile, consoleErrors, failedRequests };
  } finally {
    await new Promise((r) => server.close(r));
  }
}

function formatTerminalReport(report) {
  const lines = [];
  lines.push('================================================================================');
  lines.push(`  ${report.engineName}`);
  lines.push(`  Standards Database: ${report.databaseVersion} | Evaluated: ${report.evaluatedAt}`);
  lines.push('================================================================================');
  lines.push(
    `  OVERALL SCORE: ${report.overallScore}/100  |  GRADE: ${report.grade}  |  TOP-TIER SEARCH ELIGIBLE: ${report.eligibleForTopTierSearch ? 'YES' : 'NO'}`
  );
  lines.push(
    `  SUMMARY: PASS=${report.summary.PASS}/${report.totalRules} | CRITICAL=${report.summary.CRITICAL} | HIGH=${report.summary.HIGH} | MEDIUM=${report.summary.MEDIUM} | LOW=${report.summary.LOW}`
  );
  lines.push('--------------------------------------------------------------------------------');
  lines.push('  CATEGORY BREAKDOWN:');
  for (const cat of report.categories) {
    lines.push(`    - ${cat.label.padEnd(36)} ${String(cat.passed).padStart(2)}/${cat.total} (${cat.score}%)`);
  }

  if (report.findings.length > 0) {
    lines.push('--------------------------------------------------------------------------------');
    lines.push(`  STRICT DEFECT REPORT (${report.findings.length} ISSUE(S) DETECTED):`);
    for (const f of report.findings) {
      lines.push(`  [FAIL][${f.severity}] ${f.id} — ${f.title}`);
      lines.push(`      Evidence   : ${f.evidence}`);
      lines.push(`      Standard   : ${f.standardRef}`);
      lines.push(`      Remediation: ${f.remediation}`);
    }
  } else {
    lines.push('--------------------------------------------------------------------------------');
    lines.push('  ✓ ZERO DEFECTS DETECTED — 100% STRICT COMPLIANCE ACHIEVED.');
  }

  lines.push('--------------------------------------------------------------------------------');
  lines.push('  SERP SNIPPET PREVIEW:');
  lines.push(`    URL  : ${report.serpPreview.url}`);
  lines.push(`    Title: ${report.serpPreview.title} (${report.serpPreview.titleLength} chars)`);
  lines.push(`    Desc : ${report.serpPreview.description} (${report.serpPreview.descriptionLength} chars)`);
  lines.push(`    Stamp: ${report.serpPreview.updatedTime}`);
  lines.push('================================================================================');
  return lines.join('\n');
}

async function main() {
  const inventory = collectProjectInventory();
  const liveChecks = isStaticOnly ? null : await runLiveProbes(inventory);
  const report = evaluateSiteSnapshot({ ...inventory, liveChecks });

  if (isJson) {
    process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  } else {
    process.stdout.write(formatTerminalReport(report) + '\n');
  }

  if (isStrict && (!report.eligibleForTopTierSearch || report.findings.length > 0)) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Agent audit failed:', err);
  process.exit(1);
});
