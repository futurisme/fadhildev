import path from 'path';
import fs from 'fs';
import { defineConfig, Plugin } from 'vite';

const MIME_TYPES: Record<string, string> = {
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

function fadhilRouterPlugin(): Plugin {
  return {
    name: 'fadhil-router-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url) return next();
        const urlObj = new URL(req.url, 'http://localhost:3000');
        const pathname = urlObj.pathname;
        const search = urlObj.search;

        // Never intercept Vite internal modules or transforms
        if (pathname.startsWith('/@') || pathname.startsWith('/node_modules')) {
          return next();
        }

        // 1. Static asset handling: check FIRST with automatic /fadhil/ strip
        const rawCleanPath = pathname.replace(/^\//, '');
        const cleanPath = rawCleanPath.startsWith('fadhil/')
          ? rawCleanPath.slice('fadhil/'.length)
          : rawCleanPath;
        const ext = path.extname(cleanPath).toLowerCase();

        if (ext && MIME_TYPES[ext]) {
          const candidatePaths = [
            path.resolve(process.cwd(), cleanPath),
            path.resolve(process.cwd(), rawCleanPath),
            path.resolve(process.cwd(), 'public', cleanPath),
            path.resolve(process.cwd(), 'public', rawCleanPath),
            path.resolve(process.cwd(), 'assets', cleanPath),
            path.resolve(process.cwd(), 'app', cleanPath),
            path.resolve(process.cwd(), 'assets/images', cleanPath),
            path.resolve(process.cwd(), 'assets/images/social', path.basename(cleanPath)),
            path.resolve(process.cwd(), 'assets/images/platform-icons', path.basename(cleanPath)),
          ];

          for (const cand of candidatePaths) {
            if (fs.existsSync(cand)) {
              try {
                const stat = fs.statSync(cand);
                if (stat.isFile()) {
                  res.setHeader('Content-Type', MIME_TYPES[ext]);
                  res.setHeader('Content-Length', stat.size);
                  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
                  res.setHeader('X-Content-Type-Options', 'nosniff');
                  fs.createReadStream(cand).pipe(res);
                  return;
                }
              } catch (_) {}
            }
          }
        }

        // 2. In-development & legacy page routes redirected to authoritative root
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

        if (inDevRoutes.includes(pathname) || (!ext && pathname.startsWith('/fadhil/'))) {
          res.writeHead(302, { Location: `/${search}` });
          res.end();
          return;
        }

        // 3. Custom 404 handling for /404 and unmapped non-file routes
        if (pathname === '/404' || pathname === '/404.html') {
          const notFoundPath = path.resolve(process.cwd(), '404.html');
          if (fs.existsSync(notFoundPath)) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('X-Robots-Tag', 'noindex, follow');
            fs.createReadStream(notFoundPath).pipe(res);
            return;
          }
        }

        if (req.method === 'GET' && pathname !== '/' && pathname !== '/index.html') {
          const isViteInternal = pathname.startsWith('/@') || pathname.startsWith('/node_modules/') || pathname.includes('?import');
          if (!isViteInternal) {
            const diskFile1 = path.resolve(process.cwd(), cleanPath);
            const diskFile2 = path.resolve(process.cwd(), 'public', cleanPath);
            if (!fs.existsSync(diskFile1) && !fs.existsSync(diskFile2)) {
              const notFoundPath = path.resolve(process.cwd(), '404.html');
              if (fs.existsSync(notFoundPath)) {
                res.statusCode = 404;
                res.setHeader('Content-Type', 'text/html; charset=utf-8');
                res.setHeader('X-Robots-Tag', 'noindex, follow');
                fs.createReadStream(notFoundPath).pipe(res);
                return;
              }
            }
          }
        }

        next();
      });
    },
    closeBundle() {
      const distDir = path.resolve(process.cwd(), 'dist');
      if (fs.existsSync(distDir)) {
        const rootFiles = [
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
          '404.html',
        ];

        for (const file of rootFiles) {
          const srcPath = path.resolve(process.cwd(), file);
          const destPath = path.resolve(distDir, file);
          if (fs.existsSync(srcPath)) {
            fs.copyFileSync(srcPath, destPath);
          }
        }

        // Copy directories
        const copyDirs = ['app', 'assets'];
        for (const dir of copyDirs) {
          const srcDir = path.resolve(process.cwd(), dir);
          const destDir = path.resolve(distDir, dir);
          if (fs.existsSync(srcDir)) {
            fs.cpSync(srcDir, destDir, { recursive: true, force: true });
          }
        }

        // Mirror backward-compatible /fadhil/ directories in dist
        const fadhilDist = path.resolve(distDir, 'fadhil');
        fs.mkdirSync(fadhilDist, { recursive: true });
        for (const dir of copyDirs) {
          const srcDir = path.resolve(process.cwd(), dir);
          const destDir = path.resolve(fadhilDist, dir);
          if (fs.existsSync(srcDir)) {
            fs.cpSync(srcDir, destDir, { recursive: true, force: true });
          }
        }
        for (const file of rootFiles) {
          const srcPath = path.resolve(process.cwd(), file);
          const destPath = path.resolve(fadhilDist, file);
          if (fs.existsSync(srcPath)) {
            fs.copyFileSync(srcPath, destPath);
          }
        }
      }
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [fadhilRouterPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(import.meta.dirname, 'index.html'),
          notfound: path.resolve(import.meta.dirname, '404.html'),
        },
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
