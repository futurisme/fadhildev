import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT = process.cwd();

// Ensure all target directories exist
const dirs = [
  'assets/images/platform-icons',
  'assets/images/social',
  'public/assets/images/platform-icons',
  'public/assets/images/social',
  'public/app',
  'public/fadhil/app',
  'public/fadhil/assets/images/platform-icons',
  'public/fadhil/assets/images/social',
];

for (const d of dirs) {
  fs.mkdirSync(path.join(ROOT, d), { recursive: true });
}

console.log('✓ Directories ensured.');

// 1. Generate Favicons and Brand Icons
if (fs.existsSync(path.join(ROOT, 'apple-touch-icon.png'))) {
  fs.copyFileSync(
    path.join(ROOT, 'apple-touch-icon.png'),
    path.join(ROOT, 'fadhil-512x512.png')
  );
  fs.copyFileSync(
    path.join(ROOT, 'apple-touch-icon.png'),
    path.join(ROOT, 'public/fadhil-512x512.png')
  );
  try {
    execSync('convert apple-touch-icon.png -resize 32x32 favicon.ico', { cwd: ROOT });
    fs.copyFileSync(path.join(ROOT, 'favicon.ico'), path.join(ROOT, 'public/favicon.ico'));
    execSync('convert apple-touch-icon.png -resize 32x32 favicon.png', { cwd: ROOT });
    fs.copyFileSync(path.join(ROOT, 'favicon.png'), path.join(ROOT, 'public/favicon.png'));
  } catch (e) {
    console.error('Error generating favicon.ico:', e);
  }
}

// SVG Favicon & Logo
const svgBrand = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="cyberG" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00F0FF"/>
      <stop offset="50%" stop-color="#FFE600"/>
      <stop offset="100%" stop-color="#FF003C"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="20" fill="#05060A"/>
  <polygon points="12,12 88,12 80,88 20,88" fill="#0A0D14" stroke="#00E5FF" stroke-width="3"/>
  <path d="M28 35 L50 22 L72 35 L72 65 L50 78 L28 65 Z" fill="none" stroke="url(#cyberG)" stroke-width="4"/>
  <text x="50" y="58" font-family="'Oswald', Impact, sans-serif" font-size="28" font-weight="900" fill="#00E5FF" text-anchor="middle" letter-spacing="1">F</text>
</svg>`;

fs.writeFileSync(path.join(ROOT, 'favicon.svg'), svgBrand, 'utf8');
fs.writeFileSync(path.join(ROOT, 'fadhil.svg'), svgBrand, 'utf8');
fs.writeFileSync(path.join(ROOT, 'public/favicon.svg'), svgBrand, 'utf8');
fs.writeFileSync(path.join(ROOT, 'public/fadhil.svg'), svgBrand, 'utf8');

// 2. Generate Theme Toggle Icon (Sun & Moon Cyber Crest)
const themeSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <defs>
    <linearGradient id="themeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFE600"/>
      <stop offset="50%" stop-color="#00E5FF"/>
      <stop offset="100%" stop-color="#FF0055"/>
    </linearGradient>
  </defs>
  <circle cx="24" cy="24" r="20" fill="#05060A" stroke="#00E5FF" stroke-width="2"/>
  <path d="M24 8 A16 16 0 0 0 24 40 A16 16 0 0 1 24 8 Z" fill="url(#themeGrad)"/>
  <circle cx="24" cy="24" r="8" fill="#FFE600"/>
  <path d="M24 4 L24 8 M24 40 L24 44 M4 24 L8 24 M40 24 L44 24 M10 10 L13 13 M35 35 L38 38 M10 38 L13 35 M35 13 L38 10" stroke="#00E5FF" stroke-width="2.5" stroke-linecap="round"/>
</svg>`;

const themeSvgPath = path.join(ROOT, 'assets/images/theme.svg');
fs.writeFileSync(themeSvgPath, themeSvg, 'utf8');
try {
  execSync(`convert -background none ${themeSvgPath} -resize 96x96 assets/images/theme.png`, { cwd: ROOT });
  execSync(`convert assets/images/theme.png assets/images/theme.webp`, { cwd: ROOT });
  execSync(`convert assets/images/theme.png assets/images/theme.avif`, { cwd: ROOT });
} catch (e) {
  console.error('Error generating theme assets:', e);
}

// 3. Social Icons: Copy existing to assets/images/social/
const socialNames = ['dailydev', 'discord', 'duolingo', 'github', 'imdb', 'instagram', 'leetcode', 'linkedin', 'monkeytype', 'myanimelist'];
for (const s of socialNames) {
  for (const ext of ['.avif', '.webp', '.jpg']) {
    const src = path.join(ROOT, `assets/images/${s}${ext}`);
    const dest = path.join(ROOT, `assets/images/social/${s}${ext}`);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
    }
  }
}

// Generate missing social icons: Spotify, TryHackMe, Wikipedia, Roblox
const missingSocials = [
  {
    name: 'spotify',
    color: '#1DB954',
    bg: '#121212',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <rect width="64" height="64" rx="14" fill="#121212"/>
      <circle cx="32" cy="32" r="22" fill="#1DB954"/>
      <path d="M22 26 C28 24 38 24 44 28 M23 32 C28 30 36 30 42 34 M25 38 C29 36 34 36 39 39" stroke="#121212" stroke-width="3" stroke-linecap="round" fill="none"/>
    </svg>`
  },
  {
    name: 'tryhackme',
    color: '#A00',
    bg: '#111827',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <rect width="64" height="64" rx="14" fill="#111827"/>
      <path d="M32 14 L46 22 L46 42 L32 50 L18 42 L18 22 Z" fill="#E53E3E" stroke="#FFF" stroke-width="2"/>
      <text x="32" y="38" font-family="sans-serif" font-weight="900" font-size="18" fill="#FFF" text-anchor="middle">THM</text>
    </svg>`
  },
  {
    name: 'wikipedia',
    color: '#3366CC',
    bg: '#FFFFFF',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <rect width="64" height="64" rx="14" fill="#0A0D14" stroke="#4B5563" stroke-width="1.5"/>
      <circle cx="32" cy="32" r="22" fill="#FFFFFF"/>
      <text x="32" y="44" font-family="'Times New Roman', serif" font-weight="bold" font-size="34" fill="#000000" text-anchor="middle">W</text>
    </svg>`
  },
  {
    name: 'roblox',
    color: '#E02424',
    bg: '#000000',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <rect width="64" height="64" rx="14" fill="#000000" stroke="#FF003C" stroke-width="1.5"/>
      <polygon points="18,22 42,16 46,42 22,48" fill="#FF003C"/>
      <polygon points="28,29 34,27 36,34 30,36" fill="#000000"/>
    </svg>`
  }
];

for (const item of missingSocials) {
  const svgPath = path.join(ROOT, `/tmp/${item.name}.svg`);
  fs.writeFileSync(svgPath, item.svg, 'utf8');
  try {
    const pngPath = path.join(ROOT, `/tmp/${item.name}.png`);
    execSync(`convert -background none ${svgPath} -resize 128x128 ${pngPath}`);
    execSync(`convert ${pngPath} assets/images/${item.name}.jpg`);
    execSync(`convert ${pngPath} assets/images/${item.name}.webp`);
    execSync(`convert ${pngPath} assets/images/${item.name}.avif`);
    execSync(`convert ${pngPath} assets/images/social/${item.name}.jpg`);
    execSync(`convert ${pngPath} assets/images/social/${item.name}.webp`);
    execSync(`convert ${pngPath} assets/images/social/${item.name}.avif`);
  } catch (e) {
    console.error(`Error generating ${item.name}:`, e);
  }
}

// 4. Platform Icons
// Resize html, javascript, luau to 224x224 in platform-icons
const pIcons = [
  { src: 'assets/images/html.webp', name: 'html-224' },
  { src: 'assets/images/javascript.webp', name: 'javascript-224' },
  { src: 'assets/images/luau.webp', name: 'luau-224' },
];

for (const p of pIcons) {
  if (fs.existsSync(path.join(ROOT, p.src))) {
    try {
      execSync(`convert ${p.src} -resize 224x224 assets/images/platform-icons/${p.name}.webp`, { cwd: ROOT });
      execSync(`convert assets/images/platform-icons/${p.name}.webp assets/images/platform-icons/${p.name}.avif`, { cwd: ROOT });
    } catch (e) {
      console.error(`Error converting ${p.name}:`, e);
    }
  }
}

// Generate TypeScript and Python 224x224 icons
const tsSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 224 224">
  <rect width="224" height="224" rx="32" fill="#3178C6"/>
  <text x="130" y="160" font-family="'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="110" fill="#FFFFFF" text-anchor="middle">TS</text>
</svg>`;
fs.writeFileSync('/tmp/ts.svg', tsSvg, 'utf8');
try {
  execSync('convert -background none /tmp/ts.svg -resize 224x224 assets/images/platform-icons/typescript-224.webp', { cwd: ROOT });
  execSync('convert assets/images/platform-icons/typescript-224.webp assets/images/platform-icons/typescript-224.avif', { cwd: ROOT });
} catch (e) {
  console.error('Error generating typescript icon:', e);
}

const pySvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 224 224">
  <defs>
    <linearGradient id="pyB" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#387EB8"/>
      <stop offset="100%" stop-color="#366994"/>
    </linearGradient>
    <linearGradient id="pyY" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFE873"/>
      <stop offset="100%" stop-color="#FFD43B"/>
    </linearGradient>
  </defs>
  <rect width="224" height="224" rx="32" fill="#0A0E17"/>
  <path d="M110 35 C75 35 77 50 77 50 L77 66 L112 66 L112 71 L58 71 C58 71 40 69 40 104 C40 139 55 137 55 137 L66 137 L66 117 C66 117 65 93 89 93 L124 93 C124 93 147 94 147 71 L147 50 C147 50 148 35 110 35 Z M93 47 C98 47 101 50 101 55 C101 60 98 63 93 63 C88 63 85 60 85 55 C85 50 88 47 93 47 Z" fill="url(#pyB)"/>
  <path d="M114 189 C149 189 147 174 147 174 L147 158 L112 158 L112 153 L166 153 C166 153 184 155 184 120 C184 85 169 87 169 87 L158 87 L158 107 C158 107 159 131 135 131 L100 131 C100 131 77 130 77 153 L77 174 C77 174 76 189 114 189 Z M131 177 C126 177 123 174 123 169 C123 164 126 161 131 161 C136 161 139 164 139 169 C139 174 136 177 131 177 Z" fill="url(#pyY)"/>
</svg>`;
fs.writeFileSync('/tmp/py.svg', pySvg, 'utf8');
try {
  execSync('convert -background none /tmp/py.svg -resize 224x224 assets/images/platform-icons/python-224.webp', { cwd: ROOT });
  execSync('convert assets/images/platform-icons/python-224.webp assets/images/platform-icons/python-224.avif', { cwd: ROOT });
} catch (e) {
  console.error('Error generating python icon:', e);
}

// 5. Project Banners: Share Ideas & Wikipedia Custom Profile
// Create Share Ideas Banner (1280x720) with cyber manga bento art
const shareIdeasSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720">
  <defs>
    <linearGradient id="bgS" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#05060A"/>
      <stop offset="50%" stop-color="#0B132B"/>
      <stop offset="100%" stop-color="#1C2541"/>
    </linearGradient>
    <linearGradient id="accS" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00F0FF"/>
      <stop offset="50%" stop-color="#FFE600"/>
      <stop offset="100%" stop-color="#FF0055"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#bgS)"/>
  <g stroke="#00E5FF" stroke-width="0.8" opacity="0.2">
    <line x1="0" y1="120" x2="1280" y2="120"/>
    <line x1="0" y1="240" x2="1280" y2="240"/>
    <line x1="0" y1="360" x2="1280" y2="360"/>
    <line x1="0" y1="480" x2="1280" y2="480"/>
    <line x1="0" y1="600" x2="1280" y2="600"/>
    <line x1="160" y1="0" x2="160" y2="720"/>
    <line x1="320" y1="0" x2="320" y2="720"/>
    <line x1="480" y1="0" x2="480" y2="720"/>
    <line x1="640" y1="0" x2="640" y2="720"/>
    <line x1="800" y1="0" x2="800" y2="720"/>
    <line x1="960" y1="0" x2="960" y2="720"/>
    <line x1="1120" y1="0" x2="1120" y2="720"/>
  </g>
  <!-- Cyber Card Plate -->
  <polygon points="120,80 1160,80 1160,600 1100,640 120,640" fill="#0A0E17" stroke="#00E5FF" stroke-width="4"/>
  <rect x="150" y="110" width="980" height="40" fill="#000000"/>
  <text x="170" y="138" font-family="'Oswald', sans-serif" font-size="22" font-weight="900" fill="#FFE600" letter-spacing="2">EXPERIMENTAL DYNAMIC // SHARE IDEAS HUB</text>
  <!-- Glowing Nodes Illustration -->
  <circle cx="400" cy="380" r="70" fill="#00E5FF" opacity="0.85"/>
  <circle cx="640" cy="280" r="90" fill="#FFE600" opacity="0.85"/>
  <circle cx="880" cy="400" r="75" fill="#FF0055" opacity="0.85"/>
  <line x1="400" y1="380" x2="640" y2="280" stroke="#FFFFFF" stroke-width="6"/>
  <line x1="640" y1="280" x2="880" y2="400" stroke="#FFFFFF" stroke-width="6"/>
  <text x="640" y="550" font-family="'Oswald', sans-serif" font-size="64" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="4">SHARE IDEAS</text>
  <text x="640" y="600" font-family="'Noto Sans JP', sans-serif" font-size="20" font-weight="700" fill="#00E5FF" text-anchor="middle" letter-spacing="3">COLLABORATIVE BRAINSTORMING &amp; REAL-TIME FEEDBACK</text>
</svg>`;
fs.writeFileSync('/tmp/shareideas-banner.svg', shareIdeasSvg, 'utf8');
try {
  execSync('convert /tmp/shareideas-banner.svg -resize 1280x720 assets/images/shareideas-banner.jpg', { cwd: ROOT });
  execSync('convert assets/images/shareideas-banner.jpg assets/images/shareideas-banner.webp', { cwd: ROOT });
  execSync('convert assets/images/shareideas-banner.jpg assets/images/shareideas-banner.avif', { cwd: ROOT });
} catch (e) {
  console.error('Error generating shareideas-banner:', e);
}

// Create Wikipedia Custom Profile Banner (1280x720)
const wikiSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720">
  <defs>
    <linearGradient id="bgW" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#05060A"/>
      <stop offset="50%" stop-color="#111827"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#bgW)"/>
  <polygon points="120,80 1160,80 1160,600 1100,640 120,640" fill="#0A0E17" stroke="#00E5FF" stroke-width="4"/>
  <rect x="150" y="110" width="980" height="40" fill="#000000"/>
  <text x="170" y="138" font-family="'Oswald', sans-serif" font-size="22" font-weight="900" fill="#FFE600" letter-spacing="2">MEDIAWIKI EMULATOR // WIKIPEDIA INDONESIA PROFILE</text>
  <circle cx="640" cy="310" r="95" fill="#FFFFFF" stroke="#00E5FF" stroke-width="4"/>
  <text x="640" y="360" font-family="'Times New Roman', serif" font-size="140" font-weight="bold" fill="#000000" text-anchor="middle">W</text>
  <text x="640" y="520" font-family="'Oswald', sans-serif" font-size="52" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="3">WIKIPEDIA CUSTOM PROFILE</text>
  <text x="640" y="580" font-family="'Noto Sans JP', sans-serif" font-size="20" font-weight="700" fill="#38BDF8" text-anchor="middle" letter-spacing="2">INTERACTIVE INDONESIAN USER PAGE DEMONSTRATION</text>
</svg>`;
fs.writeFileSync('/tmp/wiki-banner.svg', wikiSvg, 'utf8');
try {
  execSync('convert /tmp/wiki-banner.svg -resize 1280x720 assets/images/wikipediaindonesia-banner.jpg', { cwd: ROOT });
  execSync('convert assets/images/wikipediaindonesia-banner.jpg assets/images/wikipediaindonesia-banner.webp', { cwd: ROOT });
  execSync('convert assets/images/wikipediaindonesia-banner.jpg assets/images/wikipediaindonesia-banner.avif', { cwd: ROOT });
} catch (e) {
  console.error('Error generating wiki banner:', e);
}

// 6. Tool & Capability Logos (root and public/)
const toolLogos = [
  { name: 'vscode-logo', fill: '#007ACC', text: 'VS', label: 'VS Code' },
  { name: 'cloudflare-logo', fill: '#F38020', text: 'CF', label: 'Cloudflare' },
  { name: 'cloudflare-workers-logo', fill: '#F38020', text: 'W', label: 'Workers' },
  { name: 'supabase-logo', fill: '#3ECF8E', text: 'SB', label: 'Supabase' },
  { name: 'git-logo', fill: '#F05032', text: 'GIT', label: 'Git' },
  { name: 'figma-logo', fill: '#A259FF', text: 'FIG', label: 'Figma' },
  { name: 'postgresql-logo', fill: '#4169E1', text: 'PG', label: 'Postgres' },
  { name: 'mongodb-logo', fill: '#47A248', text: 'MDB', label: 'MongoDB' },
  { name: 'blender-logo', fill: '#E87D0D', text: '3D', label: 'Blender' },
  { name: 'krita-logo', fill: '#F44336', text: 'ART', label: 'Krita' },
  { name: 'ibispaint-logo', fill: '#FF4081', text: 'IBIS', label: 'IbisPaint' },
  { name: 'canva-logo', fill: '#00C4CC', text: 'CV', label: 'Canva' },
  { name: 'roblox-studio-logo', fill: '#00A2FF', text: 'RBX', label: 'Studio' },
  { name: 'devtool-logo', fill: '#00E5FF', text: 'DEV', label: 'DevTools' }
];

for (const tool of toolLogos) {
  const toolSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
    <rect width="120" height="120" rx="24" fill="#0A0E17" stroke="${tool.fill}" stroke-width="3"/>
    <circle cx="60" cy="50" r="32" fill="${tool.fill}" opacity="0.9"/>
    <text x="60" y="59" font-family="'Oswald', sans-serif" font-weight="900" font-size="24" fill="#FFFFFF" text-anchor="middle">${tool.text}</text>
    <text x="60" y="105" font-family="'Oswald', sans-serif" font-weight="700" font-size="14" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">${tool.label}</text>
  </svg>`;
  
  const tmpSvg = `/tmp/${tool.name}.svg`;
  fs.writeFileSync(tmpSvg, toolSvg, 'utf8');
  try {
    const tmpPng = `/tmp/${tool.name}.png`;
    execSync(`convert -background none ${tmpSvg} -resize 120x120 ${tmpPng}`);
    
    // Save to root, assets/images/, and public/
    const targets = [
      `${tool.name}`,
      `assets/images/${tool.name}`,
      `public/${tool.name}`,
      `public/assets/images/${tool.name}`
    ];
    for (const t of targets) {
      execSync(`convert ${tmpPng} ${t}.webp`, { cwd: ROOT });
      execSync(`convert ${tmpPng} ${t}.avif`, { cwd: ROOT });
      execSync(`convert ${tmpPng} ${t}.png`, { cwd: ROOT });
    }
  } catch (e) {
    console.error(`Error generating ${tool.name}:`, e);
  }
}

// 7. Mirror all assets into public/ and public/fadhil/ to guarantee 100% path resolution
console.log('Mirroring assets to public/ ...');
execSync('cp -r assets public/', { cwd: ROOT });
execSync('mkdir -p public/fadhil && cp -r assets public/fadhil/', { cwd: ROOT });
execSync('mkdir -p public/fadhil/app && cp -r app/* public/fadhil/app/', { cwd: ROOT });
execSync('cp favicon.svg fadhil.svg favicon.ico apple-touch-icon.png fadhil-512x512.png public/fadhil/', { cwd: ROOT });

console.log('✓ All assets generated and synchronized successfully!');
