import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Service worker scopes static asset interception to same-origin and Google Fonts only', () => {
  const sw = fs.readFileSync('sw.js', 'utf8');
  assert.match(sw, /req\.url\.startsWith\('http'\)/);
  assert.match(sw, /const isSameOrigin = url\.origin === self\.location\.origin;/);
  assert.match(sw, /isSameOrigin\s*&&/);
  assert.match(sw, /\.catch\(\(\) => \{\}\)/);
});

test('Application JS modules contain zero innerHTML mutations and guard keydown/audio states', () => {
  const jsFiles = fs.readdirSync('app').filter((f) => f.endsWith('.js'));
  for (const file of jsFiles) {
    const code = fs.readFileSync(path.join('app', file), 'utf8');
    assert.doesNotMatch(code, /\.innerHTML\s*=/, `${file} must not use innerHTML`);
  }

  const audio = fs.readFileSync('app/audio.js', 'utf8');
  assert.match(audio, /ctx\.state !== 'running'/);
  assert.match(audio, /lastHoverSoundAt/);

  const youtube = fs.readFileSync('app/youtube.js', 'utf8');
  assert.match(youtube, /heroTrigger\.classList\.add\('is-playing'\)/);
  assert.match(youtube, /heroTrigger\.classList\.remove\('is-playing'\)/);
  assert.match(youtube, /navigator\.onLine === false/);
  assert.match(youtube, /target\.isContentEditable/);

  const interactive = fs.readFileSync('app/interactive.js', 'utf8');
  assert.match(interactive, /new WeakMap\(\)/);
  assert.match(interactive, /target\.isContentEditable/);
});

import { getResponsiveOrderMode, MOBILE_CARD_SELECTORS } from '../app/responsive.js';

test('dist/ build output preserves stylesheet link, sitemap link, and unhashed assets', () => {
  if (!fs.existsSync('dist/index.html')) return;

  for (const file of ['dist/index.html', 'dist/404.html']) {
    const html = fs.readFileSync(file, 'utf8');
    assert.match(html, /<link rel="stylesheet" href="\/app\/styles\.css\?v=20261118" \/>/);
    assert.doesNotMatch(html, /<script[^>]+src="\/app\/styles\.css/);
    assert.doesNotMatch(html, /data:text\/xml;base64/i);
  }

  const distIndex = fs.readFileSync('dist/index.html', 'utf8');
  assert.match(distIndex, /<link rel="sitemap" type="application\/xml" title="Sitemap" href="\/sitemap\.xml" \/>/);
  assert.match(distIndex, /href="\/site\.webmanifest"/);

  const distAssets = fs.readdirSync('dist/assets');
  assert.deepEqual(distAssets, ['images']);
});

test('app/styles.css reorders stacked mobile cards strictly within @media (max-width: 1200px)', () => {
  const css = fs.readFileSync('app/styles.css', 'utf8');
  const mobileBlockMatch = css.match(/@media\s*\(max-width:\s*1200px\)\s*\{([\s\S]*?)\.portfolios-grid-4/);
  assert.ok(mobileBlockMatch, 'Expected @media (max-width: 1200px) responsive rule');
  const block = mobileBlockMatch[1];
  assert.match(block, /display:\s*flex;\s*flex-direction:\s*column/);
  assert.match(block, /\.hero-column,\s*\.profile-column\s*\{[^}]*display:\s*contents/);
  assert.match(block, /\.hero-banner-frame\s*\{[^}]*order:\s*1/);
  assert.match(block, /\.about-cyber-frame\s*\{[^}]*order:\s*2/);
  assert.match(block, /\.socials-cyber-frame\s*\{[^}]*order:\s*3/);
  assert.match(block, /\.tools-cyber-frame\s*\{[^}]*order:\s*4/);
  assert.match(block, /\.skills-cyber-frame\s*\{[^}]*order:\s*5/);
  assert.match(block, /\.portfolios-section\s*\{[^}]*order:\s*6/);
});

test('app/responsive.js defines deterministic mobile card sequence and breakpoint helper', () => {
  assert.deepEqual(MOBILE_CARD_SELECTORS, [
    '.hero-banner-frame',
    '.about-cyber-frame',
    '.socials-cyber-frame',
    '.tools-cyber-frame',
    '.skills-cyber-frame',
    '.portfolios-section',
  ]);
  assert.equal(getResponsiveOrderMode(390), 'mobile');
  assert.equal(getResponsiveOrderMode(1200), 'mobile');
  assert.equal(getResponsiveOrderMode(1201), 'desktop');
  assert.equal(getResponsiveOrderMode(1440), 'desktop');
});
