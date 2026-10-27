import fs from 'fs';
import path from 'path';

const htmlFiles = [
  'index.html',
  'en/index.html',
  'id/index.html',
  'jp/index.html',
  'mobile/index.html',
  'cloud/index.html',
  'shareideas/index.html',
  'mindmapmaker/index.html',
  'Flag-Maker/index.html',
  'wikipediaindonesia/index.html',
  '404.html'
];

let errors = 0;
for (const file of htmlFiles) {
  const fullPath = path.resolve(process.cwd(), file);
  if (!fs.existsSync(fullPath)) continue;
  const content = fs.readFileSync(fullPath, 'utf8');
  const matches = content.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
  if (!matches) {
    if (file !== '404.html') {
      console.warn(`[${file}] No JSON-LD found!`);
    }
    continue;
  }
  for (const block of matches) {
    const rawJson = block.replace(/<script type="application\/ld\+json">/, '').replace(/<\/script>/, '').trim();
    try {
      const parsed = JSON.parse(rawJson);
      console.log(`✓ [${file}] Valid JSON-LD (${parsed['@graph'] ? parsed['@graph'].length + ' graph items' : parsed['@type']})`);
    } catch (err) {
      console.error(`✗ [${file}] JSON-LD Parse Error: ${err.message}`);
      errors++;
    }
  }
}

if (errors === 0) {
  console.log('✓ All JSON-LD Structured Data blocks are 100% valid!');
} else {
  process.exit(1);
}
