import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { resolveRouteDecision, MIME_TYPES } from '../vite.config.js';

const cwd = process.cwd();

test('resolveRouteDecision returns 301 for canonical language/mobile/fadhil root consolidations', () => {
  for (const pathname of ['/en', '/en/', '/id', '/jp', '/mobile', '/fadhil', '/fadhil/', '/fadhil/index.html', '/fadhil/mobile']) {
    const decision = resolveRouteDecision({ pathname, search: '?ref=test', cwd });
    assert.equal(decision.action, 'redirect', `Expected redirect for ${pathname}`);
    assert.equal(decision.status, 301, `Expected 301 for ${pathname}`);
    assert.equal(decision.location, '/?ref=test');
  }
});

test('resolveRouteDecision returns 302 for in-development project routes', () => {
  for (const pathname of ['/shareideas', '/mindmapmaker', '/Flag-Maker', '/wikipediaindonesia', '/cloud']) {
    const decision = resolveRouteDecision({ pathname, search: '', cwd });
    assert.equal(decision.action, 'redirect');
    assert.equal(decision.status, 302);
    assert.equal(decision.location, '/');
  }
});

test('resolveRouteDecision resolves static assets and rewrites legacy /fadhil/ asset URLs', () => {
  const swDecision = resolveRouteDecision({ pathname: '/sw.js', cwd });
  assert.equal(swDecision.action, 'static');
  assert.equal(swDecision.mimeType, MIME_TYPES['.js']);
  assert.equal(swDecision.isServiceWorker, true);

  const legacyCss = resolveRouteDecision({ pathname: '/fadhil/app/styles.css', cwd });
  assert.equal(legacyCss.action, 'static');
  assert.equal(legacyCss.mimeType, MIME_TYPES['.css']);
  assert.equal(legacyCss.filePath, path.resolve(cwd, 'app/styles.css'));
});

test('resolveRouteDecision returns 404 for /404, /404.html, unknown routes, and blocks path traversal', () => {
  const notFoundDirect = resolveRouteDecision({ pathname: '/404', cwd });
  assert.equal(notFoundDirect.action, '404');

  const notFoundHtml = resolveRouteDecision({ pathname: '/404.html', cwd });
  assert.equal(notFoundHtml.action, '404');

  const missingRoute = resolveRouteDecision({ pathname: '/non-existent-sector', cwd });
  assert.equal(missingRoute.action, '404');

  const missingHead = resolveRouteDecision({ pathname: '/non-existent-sector', method: 'HEAD', cwd });
  assert.equal(missingHead.action, '404');

  const traversal = resolveRouteDecision({ pathname: '/../../etc/passwd', cwd });
  assert.equal(traversal.action, '404');
});
