import fs from 'fs';
import path from 'path';

const allFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', 'dist', '.playwright-cli', 'tests', 'scripts'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(html|css|js|webmanifest)$/.test(entry.name)) allFiles.push(full);
  }
}
walk('.');

const usedAssets = new Set();
for (const f of allFiles) {
  const content = fs.readFileSync(f, 'utf8');
  const regex = /["'(](\/[a-zA-Z0-9_\-./]+\.(?:avif|webp|png|jpg|jpeg|svg|ico|webmanifest|mp3|wav|ogg))/g;
  let m;
  while ((m = regex.exec(content)) !== null) {
    usedAssets.add(m[1].replace(/^\/fadhil\//, '/'));
  }
}

const diskAssets = [];
function walkAssets(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkAssets(full);
    else diskAssets.push('/' + full.replace(/\\/g, '/'));
  }
}
walkAssets('assets');

const unreferenced = diskAssets.filter((asset) => !usedAssets.has(asset));
console.log('Total referenced assets:', usedAssets.size);
console.log('Total files under assets/:', diskAssets.length);
if (unreferenced.length > 0) {
  console.warn('Unreferenced files in assets/:', unreferenced);
  process.exit(1);
}
console.log('✓ Zero unreferenced asset files on disk.');
