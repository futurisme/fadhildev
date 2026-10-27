import fs from 'fs';
import path from 'path';

const apps = [
  {
    dir: 'shareideas',
    title: 'Share Ideas – Collaborative Brainstorming & Feedback Platform | Fadhil Akbar',
    name: 'Share Ideas',
    type: 'EXPERIMENTAL DYNAMIC WEB APP',
    category: 'Productivity & Idea Sharing',
    desc: 'Share Ideas is an interactive collaborative platform developed by Fadhil Akbar Cariearsa for brainstorming concepts, sharing creative proposals, and gathering community feedback in real-time.',
    bannerBase: 'shareideas-banner',
    url: 'https://fadhil.dev/shareideas',
    features: [
      'Interactive dynamic board for idea sharing and community discussions',
      'Real-time concept submission with tags, ratings, and feedback loops',
      'Full-stack responsive design optimized for mobile and desktop screens',
      'Clean modern interface tailored for rapid prototyping and ideation'
    ],
    tech: ['TypeScript', 'JavaScript', 'CSS3', 'HTML5', 'Vite', 'Cloudflare']
  },
  {
    dir: 'mindmapmaker',
    title: 'Mind Map Maker – Visual Concept & Node Mapping Tool | Fadhil Akbar',
    name: 'Mind Map Maker',
    type: 'EXPERIMENTAL DYNAMIC WEB APP',
    category: 'Visual Organization & Productivity',
    desc: 'Mind Map Maker is a lightweight, responsive web tool developed by Fadhil Akbar Cariearsa for structuring ideas, mind mapping, and creative hierarchy visualization.',
    bannerBase: 'mindmapmaker-banner',
    url: 'https://fadhil.dev/mindmapmaker',
    features: [
      'Interactive node-based canvas for brainstorming and idea structuring',
      'Flexible branching, color-coded node taxonomy, and instant layout adjustments',
      'Responsive touch-friendly navigation across desktop and tablet screens',
      'Export and save mental model hierarchies with high rendering fidelity'
    ],
    tech: ['JavaScript', 'Canvas API', 'CSS3', 'HTML5', 'TypeScript']
  },
  {
    dir: 'Flag-Maker',
    title: 'Flag Maker – Custom Vector & Vexillology Design Tool | Fadhil Akbar',
    name: 'Flag Maker',
    type: 'STATIC CANVAS ENGINE TOOL',
    category: 'Vexillology & Graphic Design',
    desc: 'Flag Maker is an interactive vexillology application created by Fadhil Akbar Cariearsa for designing, customizing, and exporting unique flags.',
    bannerBase: 'flagmaker-banner',
    url: 'https://fadhil.dev/Flag-Maker',
    features: [
      'Custom vector flag canvas engine with customizable stripes and heraldic symbols',
      'Vexillological proportions, aspect ratio presets, and international standard palettes',
      'Real-time SVG and canvas rendering with instant color adjustments',
      'High-resolution PNG and vector asset export capabilities'
    ],
    tech: ['HTML5 Canvas', 'SVG Engine', 'JavaScript', 'CSS3', 'Design Systems']
  },
  {
    dir: 'wikipediaindonesia',
    title: 'Wikipedia Custom Profile – Interactive Wiki Page Emulator | Fadhil Akbar',
    name: 'Wikipedia Custom Profile',
    type: 'CUSTOM HTML, CSS, JS PROFILE',
    category: 'Web Emulation & Interactive Profile',
    desc: 'Custom Wikipedia profile emulator and interactive Indonesian Wikipedia user page demonstration created by Fadhil Akbar Cariearsa.',
    bannerBase: 'wikipediaindonesia-banner',
    url: 'https://fadhil.dev/wikipediaindonesia',
    features: [
      'Faithful emulation of MediaWiki / Wikipedia user profile page typography and styling',
      'Comprehensive biographical timeline, educational milestones, and activity records',
      'Interactive infobox, table of contents navigation, and bilingual references',
      'Lightweight static implementation with fast Core Web Vitals performance'
    ],
    tech: ['HTML5', 'CSS3', 'JavaScript', 'MediaWiki Architecture', 'Semantic UI']
  }
];

function generateSubpageHtml(app) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>${app.title}</title>
    <meta name="description" content="${app.desc}" />
    <meta name="keywords" content="${app.name}, Fadhil Akbar Cariearsa, web portfolio, ${app.category}, ${app.tech.join(', ')}" />
    <meta name="author" content="Fadhil Akbar Cariearsa" />
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
    <meta name="theme-color" content="#05060A" />

    <!-- Canonical and Alternate hreflang -->
    <link rel="canonical" href="${app.url}" />
    <link rel="alternate" hreflang="x-default" href="${app.url}" />
    <link rel="alternate" hreflang="en" href="${app.url}" />

    <!-- Open Graph Metadata -->
    <meta property="og:site_name" content="Fadhil Akbar Cariearsa - Developer Portfolio" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${app.url}" />
    <meta property="og:title" content="${app.title}" />
    <meta property="og:description" content="${app.desc}" />
    <meta property="og:image" content="https://fadhil.dev/assets/images/${app.bannerBase}.jpg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${app.name} Preview Banner" />

    <!-- Twitter / X Cards -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@cariearsa" />
    <meta name="twitter:creator" content="@cariearsa" />
    <meta name="twitter:title" content="${app.title}" />
    <meta name="twitter:description" content="${app.desc}" />
    <meta name="twitter:image" content="https://fadhil.dev/assets/images/${app.bannerBase}.jpg" />

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Bangers&family=Noto+Sans+JP:wght@400;700;900&family=Oswald:wght@500;700;800;900&display=swap" rel="stylesheet" />

    <!-- Favicons -->
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="manifest" href="/site.webmanifest" />

    <!-- Styles -->
    <link rel="stylesheet" href="/app/styles.css" />

    <!-- Inline Theme Check -->
    <script>
      (function() {
        try {
          var t = localStorage.getItem("portfolio-theme");
          if (t === "light") {
            document.documentElement.setAttribute("data-theme", "light");
            if (document.body) document.body.classList.add("light-theme");
          } else {
            document.documentElement.setAttribute("data-theme", "dark");
          }
        } catch(e) {}
      })();
    </script>

    <!-- Structured Data (JSON-LD) -->
    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "WebApplication",
            "@id": "${app.url}#webapp",
            "name": "${app.name}",
            "url": "${app.url}",
            "description": "${app.desc}",
            "applicationCategory": "${app.category}",
            "operatingSystem": "All",
            "browserRequirements": "Requires JavaScript. Requires HTML5.",
            "author": {
              "@type": "Person",
              "name": "Fadhil Akbar Cariearsa",
              "url": "https://fadhil.dev/"
            },
            "screenshot": "https://fadhil.dev/assets/images/${app.bannerBase}.jpg"
          },
          {
            "@type": "BreadcrumbList",
            "@id": "${app.url}#breadcrumb",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://fadhil.dev/"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Portfolios",
                "item": "https://fadhil.dev/#portfolios-section"
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": "${app.name}",
                "item": "${app.url}"
              }
            ]
          }
        ]
      }
    </script>
    <style>
      .app-detail-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 24px 16px 80px;
      }
      .app-detail-card {
        background: #090B12;
        border: 2px solid #FFE600;
        box-shadow: 6px 6px 0px #FF003C;
        border-radius: 8px;
        overflow: hidden;
      }
      .light-theme .app-detail-card {
        background: #FFFFFF;
        border-color: #240308;
        box-shadow: 6px 6px 0px #BC002D;
      }
      .app-banner-wrap {
        width: 100%;
        max-height: 480px;
        overflow: hidden;
        border-bottom: 2px solid #FFE600;
        background: #000;
      }
      .app-banner-wrap img {
        width: 100%;
        height: auto;
        object-fit: cover;
        display: block;
      }
      .app-content-body {
        padding: 32px;
      }
      .breadcrumb-trail {
        display: flex;
        align-items: center;
        gap: 8px;
        font-family: 'Oswald', sans-serif;
        font-size: 0.95rem;
        color: #00E5FF;
        margin-bottom: 20px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .breadcrumb-trail a {
        color: #FFE600;
        text-decoration: none;
      }
      .breadcrumb-trail a:hover {
        text-decoration: underline;
      }
      .app-title-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 24px;
        border-bottom: 1.5px dashed rgba(255, 230, 0, 0.3);
        padding-bottom: 20px;
      }
      .app-main-title {
        font-family: 'Bangers', cursive;
        font-size: 2.8rem;
        letter-spacing: 0.04em;
        color: #FFE600;
        margin: 0;
        line-height: 1.1;
      }
      .light-theme .app-main-title {
        color: #240308;
      }
      .app-desc-lead {
        font-family: 'Noto Sans JP', sans-serif;
        font-size: 1.15rem;
        line-height: 1.7;
        color: #E2E8F0;
        margin-bottom: 32px;
      }
      .light-theme .app-desc-lead {
        color: #334155;
      }
      .feature-list-box {
        background: rgba(255, 255, 255, 0.03);
        border: 1.5px solid rgba(0, 229, 255, 0.3);
        border-radius: 6px;
        padding: 24px;
        margin-bottom: 32px;
      }
      .light-theme .feature-list-box {
        background: #F8FAFC;
        border-color: #CBD5E1;
      }
      .feature-list-title {
        font-family: 'Oswald', sans-serif;
        font-size: 1.25rem;
        color: #00E5FF;
        text-transform: uppercase;
        margin-bottom: 16px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .light-theme .feature-list-title {
        color: #0284C7;
      }
      .feature-items {
        list-style: none;
        padding: 0;
        margin: 0;
        display: grid;
        gap: 12px;
      }
      .feature-items li {
        font-family: 'Noto Sans JP', sans-serif;
        font-size: 1rem;
        line-height: 1.6;
        color: #CBD5E1;
        display: flex;
        align-items: flex-start;
        gap: 10px;
      }
      .light-theme .feature-items li {
        color: #475569;
      }
      .feature-bullet {
        color: #FF007F;
        font-weight: bold;
      }
      .tech-tags-group {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 36px;
      }
      .tech-tag-badge {
        font-family: 'Oswald', sans-serif;
        font-size: 0.9rem;
        font-weight: 700;
        background: #1E0207;
        color: #FFE600;
        border: 1.5px solid #FF003C;
        padding: 6px 14px;
        border-radius: 4px;
        text-transform: uppercase;
      }
      .light-theme .tech-tag-badge {
        background: #FFF1F2;
        color: #BE123C;
        border-color: #FB7185;
      }
      .app-cta-bar {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        align-items: center;
      }
      .btn-primary-launch {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        background: #FFE600;
        color: #000;
        font-family: 'Bangers', cursive;
        font-size: 1.5rem;
        padding: 12px 28px;
        border-radius: 4px;
        text-decoration: none;
        box-shadow: 4px 4px 0px #FF003C;
        border: 2px solid #000;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
      }
      .btn-primary-launch:hover {
        transform: translate(-2px, -2px);
        box-shadow: 6px 6px 0px #FF003C;
      }
      .btn-secondary-back {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: transparent;
        color: #00E5FF;
        font-family: 'Oswald', sans-serif;
        font-size: 1.05rem;
        font-weight: 700;
        padding: 12px 20px;
        border-radius: 4px;
        text-decoration: none;
        border: 1.5px solid #00E5FF;
        transition: background 0.15s ease, color 0.15s ease;
      }
      .btn-secondary-back:hover {
        background: rgba(0, 229, 255, 0.15);
      }
    </style>
  </head>
  <body>
    <div class="fadhil-shell">
      <header class="fadhil-header" role="banner">
        <div class="header-left">
          <a href="/" id="btn-cyber-logo" class="cyber-logo-badge" title="Fadhil Akbar Cariearsa Official Portfolio" aria-label="Fadhil Dev Home">
            <div class="logo-box-wrapper" id="logo-fadhil-wrapper">
              <div class="logo-outline-layer" aria-hidden="true"></div>
              <div class="logo-inner-plate" id="logo-inner-plate">
                <div class="cyber-logo-title" id="cyber-logo-heading">
                  <span class="logo-bracket bracket-open">&lt;</span><span class="logo-part-white">FA</span><span class="logo-part-pink">DH</span><span class="logo-part-sky">IL</span><span class="logo-part-yellow">.DEV</span><span class="logo-bracket bracket-close">&gt;</span>
                </div>
              </div>
              <div class="logo-vertical-blue-bar" aria-hidden="true"></div>
            </div>
          </a>
        </div>
        <nav class="header-actions" aria-label="Portfolio navigation">
          <a href="/" class="cyber-action-btn" title="Kembali ke Beranda">
            <span>🏠</span>
            <span>HOME</span>
          </a>
          <a href="/#portfolios-section" class="cyber-action-btn" title="Lihat daftar aplikasi portofolio">
            <span>📂</span>
            <span>ALL APPS</span>
          </a>
          <button
            type="button"
            class="cyber-theme-btn theme-toggle"
            aria-label="Switch between Dark Manga and Light Manga theme"
            aria-pressed="false"
            title="Ganti Tema (Dark / Light)"
          >
            <img src="/assets/images/theme.avif" alt="Theme Toggle" width="24" height="24" />
          </button>
        </nav>
      </header>

      <main class="app-detail-container" role="main">
        <nav class="breadcrumb-trail" aria-label="Breadcrumb">
          <a href="/">Home</a>
          <span>/</span>
          <a href="/#portfolios-section">Portfolios</a>
          <span>/</span>
          <span style="color: #FFE600;">${app.name}</span>
        </nav>

        <article class="app-detail-card">
          <div class="app-banner-wrap">
            <picture>
              <source srcset="/assets/images/${app.bannerBase}.avif" type="image/avif" />
              <source srcset="/assets/images/${app.bannerBase}.webp" type="image/webp" />
              <img src="/assets/images/${app.bannerBase}.jpg" alt="${app.name} Showcase Banner" width="1200" height="630" loading="eager" />
            </picture>
          </div>

          <div class="app-content-body">
            <div class="app-title-row">
              <div>
                <span class="portfolio-type-pill" style="margin-bottom: 8px; display: inline-block;">${app.type}</span>
                <h1 class="app-main-title">${app.name}</h1>
              </div>
              <a href="${app.url}" target="_blank" rel="noopener noreferrer" class="btn-primary-launch" title="Launch ${app.name} Live Application">
                <span>LAUNCH LIVE APPLICATION</span>
                <span>➔</span>
              </a>
            </div>

            <p class="app-desc-lead">
              ${app.desc}
            </p>

            <div class="feature-list-box">
              <h2 class="feature-list-title">
                <span>⚡</span>
                <span>KEY ARCHITECTURE &amp; CAPABILITIES</span>
              </h2>
              <ul class="feature-items">
                ${app.features.map(f => `<li><span class="feature-bullet">▸</span><span>${f}</span></li>`).join('\n                ')}
              </ul>
            </div>

            <h2 class="feature-list-title" style="font-size: 1.1rem;">
              <span>🛠️</span>
              <span>TECHNOLOGY STACK</span>
            </h2>
            <div class="tech-tags-group">
              ${app.tech.map(t => `<span class="tech-tag-badge">${t}</span>`).join('\n              ')}
            </div>

            <div class="app-cta-bar">
              <a href="${app.url}" target="_blank" rel="noopener noreferrer" class="btn-primary-launch" title="Launch ${app.name}">
                <span>OPEN ${app.name.toUpperCase()}</span>
                <span>↗</span>
              </a>
              <a href="/#portfolios-section" class="btn-secondary-back" title="Return to Portfolio Directory">
                <span>← BACK TO PORTFOLIOS</span>
              </a>
            </div>
          </div>
        </article>
      </main>

      <footer class="fadhil-footer" role="contentinfo">
        <div>
          © 2026 <strong>FADHIL AKBAR CARIEARSA</strong>. ALL RIGHTS RESERVED. LICENSED UNDER CC BY-NC-ND 4.0.
        </div>
        <a href="#" class="footer-top-jump" title="Kembali ke atas">
          <span>▲ TOP OF PAGE</span>
        </a>
      </footer>
    </div>

    <script type="module" src="/app/main.js"></script>
  </body>
</html>`;
}

// Generate the 4 portfolio sub-pages
for (const app of apps) {
  const dirPath = path.join(process.cwd(), app.dir);
  fs.mkdirSync(dirPath, { recursive: true });
  const htmlPath = path.join(dirPath, 'index.html');
  fs.writeFileSync(htmlPath, generateSubpageHtml(app), 'utf8');
  console.log(`✓ Generated portfolio subpage: /${app.dir}/index.html`);
}

// Generate 404.html (Issue 16)
const notFoundHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>404 - Sector Not Found | Fadhil Akbar Cariearsa</title>
    <meta name="description" content="The requested page could not be found on fadhil.dev. Return to the developer portfolio homepage." />
    <meta name="robots" content="noindex, follow" />
    <link rel="canonical" href="https://fadhil.dev/404" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="stylesheet" href="/app/styles.css" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Bangers&family=Noto+Sans+JP:wght@400;700;900&family=Oswald:wght@500;700;800;900&display=swap" rel="stylesheet" />
    <style>
      .error-hero-container {
        min-height: 70vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 40px 20px;
      }
      .error-code {
        font-family: 'Bangers', cursive;
        font-size: clamp(6rem, 16vw, 12rem);
        color: #FF003C;
        text-shadow: 4px 4px 0px #FFE600, 8px 8px 0px #000;
        line-height: 1;
        margin: 0;
      }
      .error-subtitle {
        font-family: 'Oswald', sans-serif;
        font-size: clamp(1.4rem, 4vw, 2.2rem);
        color: #FFE600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin: 16px 0;
      }
      .error-message {
        font-family: 'Noto Sans JP', sans-serif;
        font-size: 1.1rem;
        color: #94A3B8;
        max-width: 520px;
        margin-bottom: 32px;
      }
      .btn-return-home {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        background: #FFE600;
        color: #000;
        font-family: 'Bangers', cursive;
        font-size: 1.4rem;
        padding: 12px 28px;
        border-radius: 4px;
        text-decoration: none;
        border: 2px solid #000;
        box-shadow: 4px 4px 0px #FF003C;
      }
      .btn-return-home:hover {
        transform: translate(-2px, -2px);
        box-shadow: 6px 6px 0px #FF003C;
      }
    </style>
  </head>
  <body>
    <div class="fadhil-shell">
      <header class="fadhil-header" role="banner">
        <div class="header-left">
          <a href="/" class="cyber-logo-badge" title="Fadhil Dev Home">
            <div class="logo-box-wrapper">
              <div class="logo-inner-plate">
                <span class="cyber-logo-title">
                  <span class="logo-bracket bracket-open">&lt;</span><span class="logo-part-white">FA</span><span class="logo-part-pink">DH</span><span class="logo-part-sky">IL</span><span class="logo-part-yellow">.DEV</span><span class="logo-bracket bracket-close">&gt;</span>
                </span>
              </div>
            </div>
          </a>
        </div>
        <nav class="header-actions">
          <a href="/" class="cyber-action-btn"><span>🏠</span><span>HOME</span></a>
        </nav>
      </header>

      <main class="error-hero-container" role="main">
        <h1 class="error-code">404</h1>
        <div class="error-subtitle">SECTOR NOT FOUND / ページが見つかりません</div>
        <p class="error-message">
          The requested coordinate does not exist or has been relocated. Return to the developer command base.
        </p>
        <a href="/" class="btn-return-home" title="Return to Homepage">
          <span>➔ RETURN TO BASE (HOMEPAGE)</span>
        </a>
      </main>

      <footer class="fadhil-footer" role="contentinfo">
        <div>© 2026 <strong>FADHIL AKBAR CARIEARSA</strong>. ALL RIGHTS RESERVED.</div>
      </footer>
    </div>
  </body>
</html>`;

fs.writeFileSync(path.join(process.cwd(), '404.html'), notFoundHtml, 'utf8');
console.log('✓ Generated 404 page: /404.html');
