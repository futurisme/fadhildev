import fs from 'fs';
import path from 'path';

const htmlFiles = ['index.html', '404.html'];

let errors = 0;
for (const file of htmlFiles) {
  const fullPath = path.resolve(process.cwd(), file);
  if (!fs.existsSync(fullPath)) {
    console.error(`Missing HTML file: ${file}`);
    errors++;
    continue;
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  const matches = content.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
  if (!matches) {
    if (file !== '404.html') {
      console.error(`[${file}] No JSON-LD found!`);
      errors++;
    }
    continue;
  }
  for (const block of matches) {
    const rawJson = block
      .replace(/<script type="application\/ld\+json">/, '')
      .replace(/<\/script>/, '')
      .trim();
    try {
      const parsed = JSON.parse(rawJson);
      const inspectNode = (node) => {
        if (!node || typeof node !== 'object') return;
        if (Array.isArray(node)) {
          node.forEach(inspectNode);
          return;
        }
        const types = Array.isArray(node['@type']) ? node['@type'] : [node['@type']];
        if (types.some((t) => typeof t === 'string' && /(?:Software|Web|Mobile)Application$/i.test(t))) {
          if (!node.offers || (!node.aggregateRating && !node.review)) {
            console.error(
              `✗ [${file}] ${types.join('/')} ("${node.name || 'unnamed'}") requires offers and aggregateRating/review for Google Rich Results`
            );
            errors++;
          }
        }
        for (const val of Object.values(node)) {
          inspectNode(val);
        }
      };
      inspectNode(parsed);
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
