import fs from 'fs';
import path from 'path';

const ROOT_DIR = process.cwd();
const originalIndexHtml = fs.readFileSync('/tmp/fadhildev_repo/index.html', 'utf8');
const originalMobileHtml = fs.readFileSync('/tmp/fadhildev_repo/mobile/index.html', 'utf8');

// 1. Clean up old domain references
function fixDomainsAndCanonicals(html, canonicalUrl, lang = 'en', pageTitle = null, pageDesc = null) {
  let res = html;

  // Replace cariearsa.com/fadhil with fadhil.dev in meta tags and schemas
  res = res.replace(/https:\/\/cariearsa\.com\/fadhil\//g, 'https://fadhil.dev/');
  res = res.replace(/https:\/\/cariearsa\.com\/fadhil/g, 'https://fadhil.dev');
  res = res.replace(/https:\/\/cariearsa\.com\/fadhil\/sitemap\.xml/g, 'https://fadhil.dev/sitemap.xml');

  // Fix youtube domain to youtube-nocookie.com
  res = res.replace(/https:\/\/www\.youtube\.com\/embed\//g, 'https://www.youtube-nocookie.com/embed/');

  // Replace youtube prefetch with youtube-nocookie preconnect
  const ytPreconnect = `    <link rel="preconnect" href="https://www.youtube-nocookie.com" />\n    <link rel="preconnect" href="https://i.ytimg.com" />`;
  if (!res.includes('youtube-nocookie.com')) {
    res = res.replace(/<link rel="dns-prefetch" href="https:\/\/www\.youtube\.com" \/>/, ytPreconnect);
  }

  // Update canonical
  res = res.replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${canonicalUrl}" />`);

  // Ensure hreflang and alternate links point cleanly to fadhil.dev
  const hreflangBlock = `    <link rel="alternate" media="only screen and (max-width: 1024px)" href="https://fadhil.dev/mobile/" />
    <link rel="alternate" hreflang="x-default" href="https://fadhil.dev/" />
    <link rel="alternate" hreflang="en" href="https://fadhil.dev/en/" />
    <link rel="alternate" hreflang="id" href="https://fadhil.dev/id/" />
    <link rel="alternate" hreflang="ja" href="https://fadhil.dev/jp/" />`;

  res = res.replace(/(?:<link rel="alternate" media="[^"]*" href="[^"]*" \/>\s*)?<link rel="alternate"[^>]*hreflang="x-default"[^>]*>[\s\S]*?<link rel="alternate"[^>]*hreflang="ja"[^>]*>/, hreflangBlock);

  // Set html lang
  res = res.replace(/<html lang="[^"]*">/, `<html lang="${lang}">`);

  // Update title & description if provided
  if (pageTitle) {
    res = res.replace(/<title>.*?<\/title>/, `<title>${pageTitle}</title>`);
    res = res.replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${pageTitle}" />`);
    res = res.replace(/<meta name="twitter:title" content=".*?" \/>/, `<meta name="twitter:title" content="${pageTitle}" />`);
  }
  if (pageDesc) {
    res = res.replace(/<meta\s+name="description"\s+content=".*?"\s*\/>/, `<meta name="description" content="${pageDesc}" />`);
    res = res.replace(/<meta property="og:description" content=".*?" \/>/, `<meta property="og:description" content="${pageDesc}" />`);
    res = res.replace(/<meta name="twitter:description" content=".*?" \/>/, `<meta name="twitter:description" content="${pageDesc}" />`);
  }

  // Ensure og:url is self-canonical
  res = res.replace(/<meta property="og:url" content=".*?" \/>/, `<meta property="og:url" content="${canonicalUrl}" />`);

  // Fix YouTube facade: replace direct autoplay iframe with facade
  const ytFacadePattern = /<div class="hero-video-frame-layer">[\s\S]*?<iframe[\s\S]*?<\/iframe>[\s\S]*?<\/div>/;
  const ytFacadeReplacement = `<div class="hero-video-frame-layer">
                  <div id="fadhil-hero-yt" class="hero-yt-iframe" data-youtube-src="https://www.youtube-nocookie.com/embed/r_UrlnA-6z4?si=MzDoxi9AW-lhCFSV&amp;start=6&amp;enablejsapi=1&amp;controls=1&amp;playsinline=1&amp;rel=0&amp;vq=hd1080"></div>
                </div>`;
  res = res.replace(ytFacadePattern, ytFacadeReplacement);

  // Add Theme FOUC inline protection in head if not already there
  const themeFoucScript = `    <script>
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
    </script>`;

  if (!res.includes('localStorage.getItem("portfolio-theme")')) {
    res = res.replace('<meta charset="UTF-8" />', `${themeFoucScript}\n    <meta charset="UTF-8" />`);
  }

  // Safe bot-friendly mobile redirect
  const botFriendlyMobileRedirect = `    <script>
      (function() {
        try {
          var ua = navigator.userAgent || "";
          if (/bot|crawl|slurp|spider|mediapartners|facebook|twitter|bing|google|yandex|duckduckgo/i.test(ua)) return;
          var params = new URLSearchParams(window.location.search);
          if (params.get("view") === "desktop" || sessionStorage.getItem("cariearsa_fadhil_pref") === "desktop") return;
          if (params.get("view") === "mobile") {
            sessionStorage.setItem("cariearsa_fadhil_pref", "mobile");
            window.location.replace("/mobile/" + window.location.search + window.location.hash);
            return;
          }
          var uaData = navigator.userAgentData;
          var isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i.test(ua);
          var isSmallScreen = window.innerWidth <= 1024 && ("ontouchstart" in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0));
          if ((uaData && uaData.mobile === true) || isMobileUA || isSmallScreen) {
            window.location.replace("/mobile/" + window.location.search + window.location.hash);
          }
        } catch(e) {}
      })();
    </script>`;

  // Replace old mobile redirect script
  res = res.replace(/<script>\(function\(\)\s*\{[\s\S]*?sessionStorage\.setItem\("cariearsa_fadhil_pref"[\s\S]*?<\/script>/, botFriendlyMobileRedirect);

  // Ensure Person Schema has all 14 links and jobTitle Full-Stack Developer
  const fullSchema = `    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "WebSite",
            "@id": "https://fadhil.dev/#website",
            "url": "https://fadhil.dev/",
            "name": "Fadhil Akbar Cariearsa - Developer Portfolio",
            "description": "Official portfolio of Fadhil Akbar Cariearsa showcasing software development projects, interactive web applications, technical skills, and core tools.",
            "inLanguage": ["en", "id", "ja"]
          },
          {
            "@type": "Person",
            "@id": "https://fadhil.dev/#person",
            "name": "Fadhil Akbar Cariearsa",
            "alternateName": ["Fadhil Cariearsa", "fadhil.dev", "futurisme"],
            "url": "https://fadhil.dev/",
            "image": "https://fadhil.dev/assets/images/portfolio-banner.jpg",
            "jobTitle": "Full-Stack Developer",
            "knowsAbout": [
              "Full-Stack Development",
              "TypeScript",
              "JavaScript",
              "Python",
              "Luau",
              "HTML5",
              "CSS3",
              "UI/UX Design",
              "Cybersecurity",
              "3D Animation"
            ],
            "sameAs": [
              "https://github.com/fadhilakbarcariearsaindonesia",
              "https://www.linkedin.com/in/cariearsa/",
              "https://leetcode.com/u/FadhilAkbarCariearsa",
              "https://open.spotify.com/user/31atjyxnu3ck3yxvr3vsk7igsoqi",
              "https://monkeytype.com/profile/fadhilakbar",
              "https://www.instagram.com/fadhil.akbar.cariearsa?igsh=MWxraXQ2cjh0b3JyZA==",
              "https://tryhackme.com/p/fadhilakbar",
              "https://discord.com/users/1323914885238624298",
              "https://www.duolingo.com/profile/MTsN3Malang",
              "https://www.imdb.com/user/p.bl7qolkdgr7bhx2kf7hxuhokau?ref_=hm_nv_profile",
              "https://id.wikipedia.org/wiki/Pengguna:Fadhil_Akbar_Cariearsa",
              "https://myanimelist.net/profile/fadhilakbar",
              "https://app.daily.dev/fadhilakbar",
              "https://www.roblox.com/users/profile?username=therealjeff_roblox"
            ]
          },
          {
            "@type": "ProfilePage",
            "@id": "${canonicalUrl}#profilepage",
            "url": "${canonicalUrl}",
            "name": "${pageTitle || 'Fadhil Akbar Cariearsa - Developer Portfolio'}",
            "isPartOf": {
              "@id": "https://fadhil.dev/#website"
            },
            "mainEntity": {
              "@id": "https://fadhil.dev/#person"
            }
          }
        ]
      }
    </script>`;

  res = res.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, fullSchema);

  // Fix heading hierarchy:
  // 1. Add semantic hidden h2s for sections to bridge h1 -> h2 -> h3
  if (!res.includes('class="sr-only">Interactive Showcase')) {
    res = res.replace(
      '<div class="hero-column">',
      '<div class="hero-column">\n          <h2 class="sr-only">Interactive Showcase &amp; Media</h2>'
    );
  }
  if (!res.includes('class="sr-only">Core Capabilities')) {
    res = res.replace(
      '<div class="skills-box-inner"',
      '<h2 class="sr-only">Core Capabilities &amp; Skills</h2>\n              <div class="skills-box-inner"'
    );
  }
  if (!res.includes('class="sr-only">About Fadhil Akbar')) {
    res = res.replace(
      '<div class="about-card-body">',
      '<div class="about-card-body">\n                <h2 class="sr-only">About Fadhil Akbar Cariearsa</h2>'
    );
  }
  if (!res.includes('class="sr-only">Verified Social')) {
    res = res.replace(
      '<div class="socials-card-body">',
      '<div class="socials-card-body">\n                <h2 class="sr-only">Verified Social Profiles &amp; Networks</h2>'
    );
  }
  if (!res.includes('class="sr-only">Developer Tools')) {
    res = res.replace(
      '<ul class="tools-grid"',
      '<h2 class="sr-only">Developer Tools, Frameworks &amp; Technologies</h2>\n                <ul class="tools-grid"'
    );
  }

  // 2. Change portfolio span to h2
  res = res.replace(
    '<span class="cyber-title-box" id="portfolios-heading">FEATURED LEARNING PORTFOLIOS</span>',
    '<h2 class="cyber-title-box" id="portfolios-heading" style="margin:0;font-size:inherit;font-family:inherit;font-weight:inherit;line-height:inherit;display:inline-block;">FEATURED LEARNING PORTFOLIOS</h2>'
  );

  // Use modular main.js script
  res = res.replace(
    /<script src="\/fadhil\/app\/main\.js\?v=[^"]*" defer><\/script>/,
    '<script type="module" src="/app/main.js"></script>'
  );

  // Make YouTube script non-blocking
  res = res.replace(
    '<script src="https://www.youtube.com/iframe_api"></script>',
    '<script src="https://www.youtube.com/iframe_api" async defer></script>'
  );

  return res;
}

// Write /index.html
const indexHtmlContent = fixDomainsAndCanonicals(
  originalIndexHtml,
  'https://fadhil.dev/',
  'en'
);
fs.writeFileSync(path.join(ROOT_DIR, 'index.html'), indexHtmlContent, 'utf8');
console.log('✓ Created /index.html');

// Write /en/index.html
const enHtmlContent = fixDomainsAndCanonicals(
  originalIndexHtml,
  'https://fadhil.dev/en/',
  'en',
  'Fadhil Akbar Cariearsa - Developer Portfolio (EN)',
  'Official portfolio of Fadhil Akbar Cariearsa showcasing software development projects, interactive web applications, technical skills, and core tools.'
);
fs.writeFileSync(path.join(ROOT_DIR, 'en/index.html'), enHtmlContent, 'utf8');
console.log('✓ Created /en/index.html');

// Write /id/index.html
let idHtmlContent = fixDomainsAndCanonicals(
  originalIndexHtml,
  'https://fadhil.dev/id/',
  'id',
  'Fadhil Akbar Cariearsa - Portofolio Pengembang Perangkat Lunak',
  'Portofolio resmi Fadhil Akbar Cariearsa menampilkan proyek pengembangan perangkat lunak, aplikasi web interaktif, keahlian teknis, dan alat-alat utama.'
);
// Prerender Indonesian text
idHtmlContent = idHtmlContent.replace(
  /<p id="about-desc-content">[\s\S]*?<\/p>/,
  `<p id="about-desc-content">
                    Seorang generalis penikmat hobi dengan minat pada bidang desain, pengembangan, animasi, keamanan siber, dan seni 2D (murni sebagai hobi dan minat pribadi, tidak ditekuni secara profesional/serius).
                  </p>`
);
// Highlight ID button as active
idHtmlContent = idHtmlContent.replace(
  '<button type="button" class="lang-flag-btn" data-lang="id"',
  '<button type="button" class="lang-flag-btn active" data-lang="id"'
);
fs.writeFileSync(path.join(ROOT_DIR, 'id/index.html'), idHtmlContent, 'utf8');
console.log('✓ Created /id/index.html');

// Write /jp/index.html
let jpHtmlContent = fixDomainsAndCanonicals(
  originalIndexHtml,
  'https://fadhil.dev/jp/',
  'ja',
  'Fadhil Akbar Cariearsa - デベロッパーポートフォリオ',
  'Fadhil Akbar Cariearsa の公式ポートフォリオ。ソフトウェア開発プロジェクト、インタラクティブWebアプリ、技術スキル、および主要ツールを掲載。'
);
// Prerender Japanese text
jpHtmlContent = jpHtmlContent.replace(
  /<p id="about-desc-content">[\s\S]*?<\/p>/,
  `<p id="about-desc-content">
                    デザイン、開発、アニメーション、サイバーセキュリティ、2Dアートに関心を持つジェネラリスト愛好家です（純粋な趣味および個人的な関心として嗜んでおり、本業や専門的な追究ではありません）。
                  </p>`
);
// Highlight JP button as active
jpHtmlContent = jpHtmlContent.replace(
  '<button type="button" class="lang-flag-btn" data-lang="jp"',
  '<button type="button" class="lang-flag-btn active" data-lang="jp"'
);
fs.writeFileSync(path.join(ROOT_DIR, 'jp/index.html'), jpHtmlContent, 'utf8');
console.log('✓ Created /jp/index.html');

// Process Mobile HTML
let mobileContent = originalMobileHtml;
// Replace domains
mobileContent = mobileContent.replace(/https:\/\/cariearsa\.com\/fadhil\//g, 'https://fadhil.dev/');
mobileContent = mobileContent.replace(/https:\/\/cariearsa\.com\/fadhil/g, 'https://fadhil.dev');
mobileContent = mobileContent.replace(/https:\/\/www\.youtube\.com\/embed\//g, 'https://www.youtube-nocookie.com/embed/');

// Canonical and alternate links
mobileContent = mobileContent.replace(
  /<link rel="canonical" href="[^"]*" \/>/,
  `<link rel="canonical" href="https://fadhil.dev/mobile/" />`
);
mobileContent = mobileContent.replace(
  /<link rel="alternate"[^>]*hreflang="x-default"[^>]*>[\s\S]*?<link rel="alternate"[^>]*hreflang="ja"[^>]*>/,
  `<link rel="alternate" media="only screen and (max-width: 1024px)" href="https://fadhil.dev/mobile/" />
    <link rel="alternate" hreflang="x-default" href="https://fadhil.dev/" />
    <link rel="alternate" hreflang="en" href="https://fadhil.dev/en/" />
    <link rel="alternate" hreflang="id" href="https://fadhil.dev/id/" />
    <link rel="alternate" hreflang="ja" href="https://fadhil.dev/jp/" />`
);

// og:url and og:image
mobileContent = mobileContent.replace(
  /<meta property="og:url" content="[^"]*" \/>/,
  `<meta property="og:url" content="https://fadhil.dev/mobile/" />`
);

// Preconnects
if (!mobileContent.includes('youtube-nocookie.com')) {
  mobileContent = mobileContent.replace(
    '</title>',
    `</title>\n    <link rel="preconnect" href="https://www.youtube-nocookie.com" />\n    <link rel="preconnect" href="https://i.ytimg.com" />`
  );
}

// Bot friendly desktop redirect
const botFriendlyDesktopRedirect = `    <script>
      (function() {
        try {
          var ua = navigator.userAgent || '';
          if (/bot|crawl|slurp|spider|mediapartners|facebook|twitter|bing|google|yandex|duckduckgo/i.test(ua)) return;
          var params = new URLSearchParams(window.location.search);
          if (params.get('view') === 'mobile' || sessionStorage.getItem('cariearsa_fadhil_pref') === 'mobile') return;
          if (params.get('view') === 'desktop') {
            sessionStorage.setItem('cariearsa_fadhil_pref', 'desktop');
            window.location.replace('/' + window.location.search + window.location.hash);
            return;
          }
          if (window.innerWidth > 1024 && !('ontouchstart' in window)) {
            window.location.replace('/' + window.location.search + window.location.hash);
          }
        } catch(e) {}
      })();
    </script>`;

mobileContent = mobileContent.replace(/<script>\s*\(function\(\)\s*\{[\s\S]*?sessionStorage\.setItem\('cariearsa_fadhil_pref'[\s\S]*?<\/script>/, botFriendlyDesktopRedirect);

// Replace YouTube iframe with facade
mobileContent = mobileContent.replace(
  /<div class="hero-video-frame-layer">[\s\S]*?<iframe[\s\S]*?<\/iframe>[\s\S]*?<\/div>/,
  `<div class="hero-video-frame-layer">
                  <div id="fadhil-hero-yt" class="hero-yt-iframe" data-youtube-src="https://www.youtube-nocookie.com/embed/r_UrlnA-6z4?si=MzDoxi9AW-lhCFSV&amp;start=6&amp;enablejsapi=1&amp;controls=1&amp;playsinline=1&amp;rel=0&amp;vq=hd1080"></div>
                </div>`
);

// Heading hierarchy: change portfolio span to h2
mobileContent = mobileContent.replace(
  '<span class="cyber-title-box" id="portfolios-heading">FEATURED LEARNING PORTFOLIOS</span>',
  '<h2 class="cyber-title-box" id="portfolios-heading" style="margin:0;font-size:inherit;font-family:inherit;font-weight:inherit;line-height:inherit;display:inline-block;">FEATURED LEARNING PORTFOLIOS</h2>'
);

// Modular script
mobileContent = mobileContent.replace(
  /<script src="\/fadhil\/app\/main\.js\?v=[^"]*" defer><\/script>/,
  '<script type="module" src="/app/main.js"></script>'
);

fs.writeFileSync(path.join(ROOT_DIR, 'mobile/index.html'), mobileContent, 'utf8');
console.log('✓ Created /mobile/index.html');
