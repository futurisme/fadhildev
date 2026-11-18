# fadhil.dev — Fadhil Akbar Cariearsa Developer Portfolio

Official developer portfolio for **Fadhil Akbar Cariearsa** (`https://fadhil.dev`), built exclusively with HTML5, CSS3, and modular ES2022 JavaScript, bundled cleanly for Cloudflare Pages with Vite.

## Features
- **Cyber Manga & Light Manga Dual Theme**: Instant dark/light palette switching (`localStorage` persisted, zero FOUC).
- **Multilingual About Section**: Instant client-side switching (`EN`, `ID`, `JP`) with persisted state.
- **Privacy-Enhanced Video Facade**: Zero-overhead YouTube (`youtube-nocookie.com`) banner facade with synchronized Web Audio sound feedback.
- **Responsive Bento & Mobile Card Hierarchy**: Two-column desktop Bento layout (`> 1200px`) and dedicated mobile vertical hierarchy (`Video Banner → About Me → Social Profiles → Tools & Platforms → Skills → Featured Learning Portfolios`).
- **PWA & Offline Support**: Web App Manifest (`site.webmanifest`) and origin-scoped Service Worker (`sw.js`).
- **Cloudflare Pages Ready**: Custom edge headers (`_headers`), canonical route consolidation (`_redirects`), XML sitemap (`sitemap.xml`), `robots.txt`, and HTTP 404 page (`404.html`).

## Development & Build

```bash
npm install
npm run dev      # Start local dev server on port 3000
npm run build    # Build production static output into dist/
npm run preview  # Preview dist/ with Cloudflare-compatible routing
npm run lint     # Validate HTML/CSS/JS stack, assets, JSON-LD, and dist/
npm test         # Run Node unit test suite
```
