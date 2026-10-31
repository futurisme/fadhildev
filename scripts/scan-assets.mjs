import fs from 'fs';
import path from 'path';

const allFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', 'dist', '.playwright-cli'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(html|css|js|json)$/.test(entry.name)) allFiles.push(full);
  }
}
walk('.');

const usedAssets = new Set();
for (const f of allFiles) {
  const content = fs.readFileSync(f, 'utf8');
  const regex = /(?:src|href|srcset|url)\s*[:=]\s*["'(]?(\/[a-zA-Z0-9_\-./]+)/g;
  let m;
  while ((m = regex.exec(content)) !== null) {
    const u = m[1];
    if (/\.(avif|webp|png|jpg|jpeg|svg|ico|webmanifest|mp3|wav|ogg)$/.test(u)) {
      usedAssets.add(u.replace(/^\/fadhil\//, '/'));
    }
  }
}

console.log('Total referenced assets:', usedAssets.size);
for (const u of Array.from(usedAssets).sort()) {
  console.log('  ', u);
}
