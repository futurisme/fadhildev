import test from 'node:test';
import assert from 'node:assert/strict';

const MIME_TYPES: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.avif': 'image/avif',
  '.webp': 'image/webp',
};

function resolveCleanPath(pathname: string): string {
  const raw = pathname.replace(/^\//, '');
  return raw.startsWith('fadhil/') ? raw.slice('fadhil/'.length) : raw;
}

function shouldRedirect(pathname: string, ext: string): boolean {
  const inDevRoutes = [
    '/shareideas', '/shareideas/',
    '/mindmapmaker', '/mindmapmaker/',
    '/Flag-Maker', '/Flag-Maker/',
    '/wikipediaindonesia', '/wikipediaindonesia/',
    '/cloud', '/cloud/',
    '/en', '/en/',
    '/id', '/id/',
    '/jp', '/jp/',
    '/mobile', '/mobile/',
    '/fadhil', '/fadhil/',
    '/fadhil/index.html',
    '/fadhil/mobile', '/fadhil/mobile/'
  ];
  return inDevRoutes.includes(pathname) || (!ext && pathname.startsWith('/fadhil/'));
}

function is404Route(pathname: string, knownRoutes: string[]): boolean {
  if (pathname === '/404' || pathname === '/404.html') return true;
  return !knownRoutes.includes(pathname);
}

test('resolves asset paths with /fadhil/ prefix cleanly', () => {
  assert.equal(resolveCleanPath('/fadhil/app/styles.css'), 'app/styles.css');
  assert.equal(resolveCleanPath('/fadhil/assets/images/portfolio-banner.jpg'), 'assets/images/portfolio-banner.jpg');
  assert.equal(resolveCleanPath('/app/styles.css'), 'app/styles.css');
});

test('identifies CSS mime type correctly', () => {
  assert.equal(MIME_TYPES['.css'], 'text/css; charset=utf-8');
  assert.equal(MIME_TYPES['.webp'], 'image/webp');
  assert.equal(MIME_TYPES['.avif'], 'image/avif');
});

test('redirects legacy page routes while allowing asset extensions', () => {
  assert.equal(shouldRedirect('/fadhil', ''), true);
  assert.equal(shouldRedirect('/fadhil/', ''), true);
  assert.equal(shouldRedirect('/shareideas', ''), true);
  // Assets with extensions must NOT be redirected
  assert.equal(shouldRedirect('/fadhil/app/styles.css', '.css'), false);
  assert.equal(shouldRedirect('/fadhil/assets/images/theme.avif', '.avif'), false);
});

test('identifies 404 routes accurately', () => {
  const known = ['/', '/index.html'];
  assert.equal(is404Route('/404', known), true);
  assert.equal(is404Route('/404.html', known), true);
  assert.equal(is404Route('/random-missing-page', known), true);
  assert.equal(is404Route('/', known), false);
});
