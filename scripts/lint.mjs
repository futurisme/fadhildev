import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

let failures = 0;

function fail(msg) {
  console.error(`✗ ${msg}`);
  failures++;
}

function pass(msg) {
  console.log(`✓ ${msg}`);
}

// 1. Verify exclusive HTML/CSS/JS stack (zero TypeScript/JSX files in project)
const disallowedFiles = [];
function scanExtensions(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', 'dist', '.playwright-cli'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) scanExtensions(full);
    else if (/\.(ts|tsx|jsx)$/.test(entry.name)) disallowedFiles.push(full);
  }
}
scanExtensions('.');
if (disallowedFiles.length > 0) {
  fail(`Disallowed TypeScript/JSX files found: ${disallowedFiles.join(', ')}`);
} else {
  pass('Codebase uses exclusively HTML, CSS, and JavaScript');
}

// 2. Syntax check all .js and .mjs files via node --check
const jsFiles = ['vite.config.js', 'sw.js'];
for (const dir of ['app', 'scripts', 'tests']) {
  if (!fs.existsSync(dir)) continue;
  for (const entry of fs.readdirSync(dir)) {
    if (/\.(js|mjs)$/.test(entry)) {
      jsFiles.push(path.join(dir, entry));
    }
  }
}

for (const file of jsFiles) {
  const res = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (res.status !== 0) {
    fail(`JS syntax error in ${file}: ${res.stderr}`);
  }
}
pass(`Syntax checked ${jsFiles.length} JavaScript files`);

// 3. Validate JSON files (site.webmanifest, metadata.json, package.json)
for (const jsonFile of ['site.webmanifest', 'metadata.json', 'package.json']) {
  try {
    JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
    pass(`Valid JSON: ${jsonFile}`);
  } catch (err) {
    fail(`Invalid JSON in ${jsonFile}: ${err.message}`);
  }
}

// 4. Run asset, JSON-LD, and SEO/Cloudflare sanity checks
for (const script of ['scripts/check-assets.mjs', 'scripts/scan-assets.mjs', 'scripts/validate-jsonld.mjs']) {
  const res = spawnSync(process.execPath, [script], { encoding: 'utf8' });
  if (res.status !== 0) {
    fail(`${script} failed:\n${res.stdout}\n${res.stderr}`);
  } else {
    process.stdout.write(res.stdout);
  }
}

// 5. Check _headers and _redirects invariants
const headers = fs.readFileSync('_headers', 'utf8');
if (/X-Frame-Options/i.test(headers)) {
  fail('_headers should not include restrictive X-Frame-Options');
} else {
  pass('_headers free of restrictive X-Frame-Options');
}

if (headers.indexOf('/sw.js') < headers.indexOf('/*\n') || headers.lastIndexOf('/sw.js') < headers.indexOf('/*.svg')) {
  fail('_headers /sw.js rule must appear after wildcard rules so Cloudflare Pages preserves must-revalidate');
} else {
  pass('_headers /sw.js rule precedence verified');
}

const redirects = fs.readFileSync('_redirects', 'utf8');
if (/^\/404\s+\/404\.html\s+200/m.test(redirects)) {
  fail('_redirects contains soft-404 rule (/404 /404.html 200)');
} else {
  pass('_redirects free of soft-404 rules');
}

// 6. Verify app/*.js avoids unsafe innerHTML mutations
const innerHtmlViolations = [];
if (fs.existsSync('app')) {
  for (const entry of fs.readdirSync('app')) {
    if (!entry.endsWith('.js')) continue;
    const content = fs.readFileSync(path.join('app', entry), 'utf8');
    if (/\.innerHTML\s*=/.test(content)) {
      innerHtmlViolations.push(`app/${entry}`);
    }
  }
}
if (innerHtmlViolations.length > 0) {
  fail(`Avoid innerHTML assignment in: ${innerHtmlViolations.join(', ')}`);
} else {
  pass('app/*.js modules free of innerHTML mutations');
}

// 7. If dist/ has been built, verify production HTML & assets were not corrupted by bundler
if (fs.existsSync('dist/index.html') && fs.existsSync('dist/404.html')) {
  for (const distHtmlName of ['dist/index.html', 'dist/404.html']) {
    const distHtml = fs.readFileSync(distHtmlName, 'utf8');
    if (!/<link[^>]+rel="stylesheet"[^>]+href="\/app\/styles\.css\?v=20261117b"/.test(distHtml)) {
      fail(`${distHtmlName} missing <link rel="stylesheet" href="/app/styles.css?v=20261117b">`);
    }
    if (/<script[^>]+src="\/app\/styles\.css/.test(distHtml)) {
      fail(`${distHtmlName} contains broken <script src="/app/styles.css"> rewrite`);
    }
    if (/data:text\/xml;base64/i.test(distHtml)) {
      fail(`${distHtmlName} contains base64-inlined sitemap URI`);
    }
  }
  const distAssetEntries = fs.existsSync('dist/assets') ? fs.readdirSync('dist/assets') : [];
  const strayDistFiles = distAssetEntries.filter((name) => name !== 'images');
  if (strayDistFiles.length > 0) {
    fail(`Unexpected hashed/stray files in dist/assets/: ${strayDistFiles.join(', ')}`);
  }
  pass('dist/ production HTML & asset structure integrity verified');
}

if (failures > 0) {
  console.error(`\nLint failed with ${failures} error(s).`);
  process.exit(1);
}

console.log('\n✓ All lint and standards checks passed.');
