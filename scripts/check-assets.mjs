import fs from 'fs';
import path from 'path';

const htmlFiles = [
  'index.html',
  'en/index.html',
  'id/index.html',
  'jp/index.html',
  'mobile/index.html',
  'shareideas/index.html',
  'mindmapmaker/index.html',
  'Flag-Maker/index.html',
  'wikipediaindonesia/index.html',
  '404.html'
];

let missingCount = 0;
for (const file of htmlFiles) {
  const fullPath = path.resolve(process.cwd(), file);
  if (!fs.existsSync(fullPath)) {
    console.error(`Missing HTML file: ${file}`);
    missingCount++;
    continue;
  }
  const content = fs.readFileSync(fullPath, 'utf8');

  // Match local src, href, srcset attributes starting with / (excluding http, data:, mailto:, #)
  const regex = /(?:src|href|srcset)=["'](\/[^"'#?]+)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const rawUrl = match[1];
    // Strip trailing slash if it's a file
    const cleanUrl = rawUrl.startsWith('/fadhil/') ? rawUrl.slice('/fadhil'.length) : rawUrl;
    
    // Check candidate paths on disk
    const cand1 = path.resolve(process.cwd(), cleanUrl.replace(/^\//, ''));
    const cand2 = path.resolve(process.cwd(), 'public', cleanUrl.replace(/^\//, ''));
    const cand3 = path.resolve(process.cwd(), rawUrl.replace(/^\//, ''));

    const exists = fs.existsSync(cand1) || fs.existsSync(cand2) || fs.existsSync(cand3);
    if (!exists) {
      console.warn(`[${file}] 404 Broken asset: ${rawUrl}`);
      missingCount++;
    }
  }
}

if (missingCount === 0) {
  console.log('✓ All internal assets and links exist on disk!');
} else {
  console.log(`Found ${missingCount} broken references.`);
}
