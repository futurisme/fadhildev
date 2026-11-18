import fs from 'fs';
import path from 'path';

const htmlFiles = ['index.html', '404.html'];

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
    const cleanUrl = rawUrl.startsWith('/fadhil/') ? rawUrl.slice('/fadhil'.length) : rawUrl;
    if (cleanUrl === '/') continue;

    const cand = path.resolve(process.cwd(), cleanUrl.replace(/^\//, ''));
    if (!fs.existsSync(cand)) {
      console.warn(`[${file}] 404 Broken asset: ${rawUrl}`);
      missingCount++;
    }
  }
}

if (missingCount === 0) {
  console.log('✓ All internal assets and links exist on disk!');
} else {
  console.error(`Found ${missingCount} broken references.`);
  process.exit(1);
}
