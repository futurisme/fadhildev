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

        // In-development & legacy paths redirected to single completed root (fadhil.dev/)
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
          '/fadhil/mobile', '/fadhil/mobile/'
        ];

        if (inDevRoutes.includes(pathname) || pathname.startsWith('/fadhil/')) {
          res.writeHead(302, { Location: `/${search}` });
          res.end();
          return;
        }

        const cleanPath = pathname.replace(/^\//, '');
        const ext = path.extname(cleanPath).toLowerCase();
        if (ext && MIME_TYPES[ext]) {
          const candidatePaths = [
            path.resolve(process.cwd(), cleanPath),
            path.resolve(process.cwd(), 'public', cleanPath),
          ];

          for (const cand of candidatePaths) {
            if (fs.existsSync(cand)) {
              try {
                const stat = fs.statSync(cand);
                if (stat.isFile()) {
                  res.setHeader('Content-Type', MIME_TYPES[ext]);
                  res.setHeader('Content-Length', stat.size);
                  res.setHeader('Cache-Control', 'no-cache');
                  fs.createReadStream(cand).pipe(res);
                  return;
                }
              } catch (_) {}
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
          'site.webmanifest',
          '_redirects',
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

        const copyDirs = ['app', 'assets'];
        for (const dir of copyDirs) {
          const srcDir = path.resolve(process.cwd(), dir);
          const destDir = path.resolve(distDir, dir);
          if (fs.existsSync(srcDir)) {
            fs.cpSync(srcDir, destDir, { recursive: true, force: true });
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
        '@': path.resolve(process.cwd(), '.'),
        '/fadhil/app': path.resolve(process.cwd(), 'app'),
        '/fadhil/assets': path.resolve(process.cwd(), 'assets'),
      },
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(process.cwd(), 'index.html'),
          notfound: path.resolve(process.cwd(), '404.html'),
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
