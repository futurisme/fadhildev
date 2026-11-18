import fs from 'fs';
import path from 'path';
import { defineConfig } from 'vite';

export const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.avif': 'image/avif',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

export const PERMANENT_REDIRECTS = new Set([
  '/en', '/en/',
  '/id', '/id/',
  '/jp', '/jp/',
  '/mobile', '/mobile/',
  '/fadhil', '/fadhil/',
  '/fadhil/index.html',
  '/fadhil/mobile', '/fadhil/mobile/',
]);

export const IN_DEV_REDIRECTS = new Set([
  '/shareideas', '/shareideas/',
  '/mindmapmaker', '/mindmapmaker/',
  '/Flag-Maker', '/Flag-Maker/',
  '/wikipediaindonesia', '/wikipediaindonesia/',
  '/cloud', '/cloud/',
]);

export function resolveRouteDecision({
  pathname,
  search = '',
  method = 'GET',
  cwd = process.cwd(),
  existsSync = fs.existsSync,
  statSync = fs.statSync,
}) {
  if (pathname.startsWith('/@') || pathname.startsWith('/node_modules')) {
    return { action: 'next' };
  }

  const rawCleanPath = pathname.replace(/^\//, '');
  const cleanPath = rawCleanPath.startsWith('fadhil/')
    ? rawCleanPath.slice('fadhil/'.length)
    : rawCleanPath;
  const ext = path.extname(cleanPath).toLowerCase();

  // 1. Canonical permanent & in-development route consolidation (runs before static match so /fadhil/index.html redirects 301)
  if (PERMANENT_REDIRECTS.has(pathname) || (!ext && pathname.startsWith('/fadhil/'))) {
    return { action: 'redirect', status: 301, location: `/${search}` };
  }
  if (IN_DEV_REDIRECTS.has(pathname)) {
    return { action: 'redirect', status: 302, location: `/${search}` };
  }

  // 2. Explicit 404 handling for /404 and /404.html (must return HTTP 404 + noindex, never 200)
  if (pathname === '/404' || pathname === '/404.html') {
    const notFoundPath = path.resolve(cwd, '404.html');
    if (existsSync(notFoundPath)) {
      return { action: '404', filePath: notFoundPath };
    }
  }

  // 3. Static asset handling with automatic /fadhil/ legacy rewrite support
  if (ext && MIME_TYPES[ext]) {
    const candidatePaths = [
      path.resolve(cwd, cleanPath),
      path.resolve(cwd, rawCleanPath),
    ];
    for (const cand of candidatePaths) {
      if (!cand.startsWith(cwd + path.sep)) continue;
      if (existsSync(cand)) {
        try {
          const stat = statSync(cand);
          if (stat.isFile()) {
            return {
              action: 'static',
              filePath: cand,
              mimeType: MIME_TYPES[ext],
              size: stat.size,
              isServiceWorker: cleanPath === 'sw.js',
            };
          }
        } catch (_) {}
      }
    }
  }

  if ((method === 'GET' || method === 'HEAD') && pathname !== '/' && pathname !== '/index.html') {
    const isViteInternal =
      pathname.startsWith('/@') ||
      pathname.startsWith('/node_modules/') ||
      pathname.includes('?import');
    if (!isViteInternal) {
      const diskFile = path.resolve(cwd, cleanPath);
      if (!diskFile.startsWith(cwd + path.sep) || !existsSync(diskFile)) {
        const notFoundPath = path.resolve(cwd, '404.html');
        if (existsSync(notFoundPath)) {
          return { action: '404', filePath: notFoundPath };
        }
      }
    }
  }

  return { action: 'next' };
}

function createRouterMiddleware(rootDir) {
  return (req, res, next) => {
    if (!req.url) return next();

    const urlObj = new URL(req.url, 'http://localhost:3000');
    const decision = resolveRouteDecision({
      pathname: urlObj.pathname,
      search: urlObj.search,
      method: req.method,
      cwd: rootDir,
    });

    if (decision.action === 'static') {
      res.setHeader('Content-Type', decision.mimeType);
      res.setHeader('Content-Length', decision.size);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      if (decision.isServiceWorker) {
        res.setHeader('Service-Worker-Allowed', '/');
      }
      if (req.method === 'HEAD') {
        res.end();
      } else {
        fs.createReadStream(decision.filePath).pipe(res);
      }
      return;
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
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
      if (req.method === 'HEAD') {
        res.end();
      } else {
        fs.createReadStream(decision.filePath).pipe(res);
      }
      return;
    }

    next();
  };
}

function fadhilRouterPlugin() {
  return {
    name: 'fadhil-router-plugin',
    configureServer(server) {
      server.middlewares.use(createRouterMiddleware(process.cwd()));
    },
    configurePreviewServer(server) {
      const distDir = path.resolve(process.cwd(), 'dist');
      server.middlewares.use(createRouterMiddleware(distDir));
    },
    closeBundle() {
      const cwd = process.cwd();
      const distDir = path.resolve(cwd, 'dist');
      if (!fs.existsSync(distDir)) return;

      // Remove Rollup-emitted hashed assets so dist/assets matches canonical static paths cleanly
      const distAssetsDir = path.resolve(distDir, 'assets');
      if (fs.existsSync(distAssetsDir)) {
        fs.rmSync(distAssetsDir, { recursive: true, force: true });
      }

      // Preserve pristine HTML entrypoints, root SEO/PWA/Cloudflare files, and unhashed assets
      const rootFiles = [
        'index.html',
        '404.html',
        'apple-touch-icon.png',
        'fadhil-512x512.png',
        'fadhil.svg',
        'favicon.ico',
        'favicon.svg',
        'favicon.png',
        'site.webmanifest',
        'sw.js',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'pwa-maskable-512x512.png',
        '_redirects',
        '_headers',
        'robots.txt',
        'sitemap.xml',
      ];

      for (const file of rootFiles) {
        const srcPath = path.resolve(cwd, file);
        const destPath = path.resolve(distDir, file);
        if (fs.existsSync(srcPath)) {
          fs.copyFileSync(srcPath, destPath);
        }
      }

      const copyDirs = ['app', 'assets'];
      for (const dir of copyDirs) {
        const srcDir = path.resolve(cwd, dir);
        const destDir = path.resolve(distDir, dir);
        if (fs.existsSync(srcDir)) {
          fs.cpSync(srcDir, destDir, { recursive: true, force: true });
        }
      }
    },
  };
}

export default defineConfig(() => {
  return {
    publicDir: false,
    plugins: [fadhilRouterPlugin()],
    build: {
      assetsInlineLimit: 0,
      modulePreload: false,
      rollupOptions: {
        external: [/^\/app\//],
        input: {
          main: path.resolve(process.cwd(), 'index.html'),
          notfound: path.resolve(process.cwd(), '404.html'),
        },
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
