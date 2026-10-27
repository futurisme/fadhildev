import fs from 'fs';
import path from 'path';

const archivedFiles = [
  'en/index.html',
  'id/index.html',
  'jp/index.html',
  'mobile/index.html',
  'cloud/index.html',
  'shareideas/index.html',
  'mindmapmaker/index.html',
  'Flag-Maker/index.html',
  'wikipediaindonesia/index.html',
  'public/en/index.html',
  'public/id/index.html',
  'public/jp/index.html',
  'public/mobile/index.html'
];

const noindexMeta = `    <meta name="robots" content="noindex, nofollow, noarchive" />
    <meta name="googlebot" content="noindex, nofollow, noarchive" />
    <meta http-equiv="X-Robots-Tag" content="noindex, nofollow" />`;

for (const file of archivedFiles) {
  const fullPath = path.resolve(process.cwd(), file);
  if (!fs.existsSync(fullPath)) continue;
  let content = fs.readFileSync(fullPath, 'utf8');

  // Replace existing robots tag or insert before </head>
  if (content.includes('name="robots"')) {
    content = content.replace(/<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/g, '<meta name="robots" content="noindex, nofollow, noarchive" />');
  } else {
    content = content.replace('</head>', `${noindexMeta}\n  </head>`);
  }

  // Ensure canonical points back to root
  content = content.replace(/<link rel="canonical" href="[^"]*" \/>/, '<link rel="canonical" href="https://fadhil.dev/" />');

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`✓ Archived & marked noindex: ${file}`);
}
