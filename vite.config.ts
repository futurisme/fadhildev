import path from 'path';
import fs from 'fs';
import {defineConfig, Plugin} from 'vite';

function fadhilRouterPlugin(): Plugin {
  return {
    name: 'fadhil-router-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url) return next();
        const urlObj = new URL(req.url, 'http://localhost:3000');
        const pathname = urlObj.pathname;
        const search = urlObj.search;

        // Redirect /fadhil/mobile or /fadhil/mobile/ -> /mobile/
        if (pathname === '/fadhil/mobile' || pathname === '/fadhil/mobile/') {
          res.writeHead(301, { Location: `/mobile/${search}` });
          res.end();
          return;
        }

        // Redirect /fadhil or /fadhil/ -> /
        if (pathname === '/fadhil' || pathname === '/fadhil/') {
          res.writeHead(301, { Location: `/${search}` });
          res.end();
          return;
        }

        // Normalize /mobile to /mobile/
        if (pathname === '/mobile') {
          res.writeHead(301, { Location: `/mobile/${search}` });
          res.end();
          return;
        }

        // Rewrite any /fadhil/* asset / resource requests to /*
        if (pathname.startsWith('/fadhil/')) {
          req.url = pathname.slice('/fadhil'.length) + search;
        }

        next();
      });
    },
    closeBundle() {
      const distDir = path.resolve(__dirname, 'dist');
      if (fs.existsSync(distDir)) {
        // 1. Copy root static files to dist/
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
        ];
        for (const file of rootFiles) {
          const srcPath = path.resolve(__dirname, file);
          const destPath = path.resolve(distDir, file);
          if (fs.existsSync(srcPath)) {
            fs.copyFileSync(srcPath, destPath);
          }
        }

        // 2. Unconditionally copy app/ and assets/ to dist/
        const srcApp = path.resolve(__dirname, 'app');
        const destApp = path.resolve(distDir, 'app');
        if (fs.existsSync(srcApp)) {
          fs.cpSync(srcApp, destApp, { recursive: true, force: true });
        }

        const srcAssets = path.resolve(__dirname, 'assets');
        const destAssets = path.resolve(distDir, 'assets');
        if (fs.existsSync(srcAssets)) {
          fs.cpSync(srcAssets, destAssets, { recursive: true, force: true });
        }

        // 3. Mirror everything inside dist/fadhil/ for /fadhil/* path resilience
        const distFadhil = path.resolve(distDir, 'fadhil');
        fs.mkdirSync(distFadhil, { recursive: true });

        if (fs.existsSync(srcApp)) {
          fs.cpSync(srcApp, path.resolve(distFadhil, 'app'), { recursive: true, force: true });
        }
        if (fs.existsSync(srcAssets)) {
          fs.cpSync(srcAssets, path.resolve(distFadhil, 'assets'), { recursive: true, force: true });
        }

        const distIndex = path.resolve(distDir, 'index.html');
        if (fs.existsSync(distIndex)) {
          fs.copyFileSync(distIndex, path.resolve(distFadhil, 'index.html'));
        }

        const distMobile = path.resolve(distDir, 'mobile/index.html');
        const distFadhilMobile = path.resolve(distFadhil, 'mobile');
        fs.mkdirSync(distFadhilMobile, { recursive: true });
        if (fs.existsSync(distMobile)) {
          fs.copyFileSync(distMobile, path.resolve(distFadhilMobile, 'index.html'));
        }

        for (const file of rootFiles) {
          const srcPath = path.resolve(__dirname, file);
          if (fs.existsSync(srcPath)) {
            fs.copyFileSync(srcPath, path.resolve(distFadhil, file));
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
        '@': path.resolve(__dirname, '.'),
        '/fadhil/app': path.resolve(__dirname, 'app'),
        '/fadhil/assets': path.resolve(__dirname, 'assets'),
      },
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          mobile: path.resolve(__dirname, 'mobile/index.html'),
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
