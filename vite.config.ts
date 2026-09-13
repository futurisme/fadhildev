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
        const copyList = ['app', 'assets', 'apple-touch-icon.png', 'fadhil-512x512.png', 'fadhil.svg', 'favicon.ico', 'favicon.svg', 'site.webmanifest', '_redirects', 'robots.txt', 'sitemap.xml'];
        for (const item of copyList) {
          const srcPath = path.resolve(__dirname, item);
          const destPath = path.resolve(distDir, item);
          if (fs.existsSync(srcPath) && !fs.existsSync(destPath)) {
            fs.cpSync(srcPath, destPath, { recursive: true });
          }
        }
        const distFadhil = path.resolve(distDir, 'fadhil');
        if (!fs.existsSync(distFadhil)) {
          fs.mkdirSync(distFadhil, { recursive: true });
        }
        for (const item of ['app', 'assets']) {
          const srcPath = path.resolve(__dirname, item);
          const destPath = path.resolve(distFadhil, item);
          if (fs.existsSync(srcPath) && !fs.existsSync(destPath)) {
            fs.cpSync(srcPath, destPath, { recursive: true });
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
