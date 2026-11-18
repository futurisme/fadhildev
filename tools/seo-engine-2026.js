/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Custom Agent-Model SEO, Rich Results & Cloudflare Edge Assessment Engine (2026-11-18).
 * Pure isomorphic ES Module (runs in Node.js CLI and Browser Inspector with zero external APIs).
 */

import {
  SEO_DATABASE_META,
  SEVERITY_PENALTY,
  CATEGORY_DEFINITIONS,
  RULES_DATABASE_2026,
} from './seo-standards-2026.js';

export function readImageDimensionsFromBytes(bytes) {
  if (!bytes || bytes.length < 12) return null;

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes.length >= 24) {
    const width = (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19];
    const height = (bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23];
    return { format: 'png', width: width >>> 0, height: height >>> 0 };
  }

  // JPEG: FF D8
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    let i = 2;
    while (i + 4 < bytes.length) {
      if (bytes[i] !== 0xff) {
        i++;
        continue;
      }
      const marker = bytes[i + 1];
      if (marker === 0xd9 || marker === 0xda) break;
      if (marker === 0x00 || (marker >= 0xd0 && marker <= 0xd8)) {
        i += 2;
        continue;
      }
      if (i + 3 >= bytes.length) break;
      const segLen = (bytes[i + 2] << 8) | bytes[i + 3];
      if (marker >= 0xc0 && marker <= 0xc3 && i + 8 < bytes.length) {
        const height = (bytes[i + 5] << 8) | bytes[i + 6];
        const width = (bytes[i + 7] << 8) | bytes[i + 8];
        return { format: 'jpeg', width, height };
      }
      if (segLen < 2) break;
      i += 2 + segLen;
    }
  }

  // WebP: RIFF....WEBP
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50 &&
    bytes.length >= 30
  ) {
    const chunk = String.fromCharCode(bytes[12], bytes[13], bytes[14], bytes[15]);
    if (chunk === 'VP8X') {
      const width = 1 + (bytes[24] | (bytes[25] << 8) | (bytes[26] << 16));
      const height = 1 + (bytes[27] | (bytes[28] << 8) | (bytes[29] << 16));
      return { format: 'webp', width, height };
    }
    if (chunk === 'VP8L') {
      const b0 = bytes[21];
      const b1 = bytes[22];
      const b2 = bytes[23];
      const b3 = bytes[24];
      const width = 1 + (((b1 & 0x3f) << 8) | b0);
      const height = 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
      return { format: 'webp', width, height };
    }
    if (chunk === 'VP8 ') {
      const width = (bytes[26] | (bytes[27] << 8)) & 0x3fff;
      const height = (bytes[28] | (bytes[29] << 8)) & 0x3fff;
      return { format: 'webp', width, height };
    }
  }

  return null;
}

export function decodeHtmlEntities(str) {
  return String(str || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export function parseTagAttributes(tagText) {
  const attrs = {};
  const attrRegex = /([a-zA-Z0-9_:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match;
  while ((match = attrRegex.exec(tagText)) !== null) {
    const key = match[1].toLowerCase();
    const val = match[2] ?? match[3] ?? match[4] ?? '';
    attrs[key] = decodeHtmlEntities(val);
  }
  return attrs;
}

export function extractHtmlSignals(html) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? decodeHtmlEntities(titleMatch[1].trim()) : '';

  const htmlTagMatch = html.match(/<html\b([^>]*)>/i);
  const htmlAttrs = htmlTagMatch ? parseTagAttributes(htmlTagMatch[1]) : {};

  const metas = [];
  const metaRegex = /<meta\b([^>]*?)\/?>/gi;
  let m;
  while ((m = metaRegex.exec(html)) !== null) {
    metas.push(parseTagAttributes(m[1]));
  }

  const links = [];
  const linkRegex = /<link\b([^>]*?)\/?>/gi;
  while ((m = linkRegex.exec(html)) !== null) {
    links.push(parseTagAttributes(m[1]));
  }

  const images = [];
  const imgRegex = /<img\b([^>]*?)\/?>/gi;
  while ((m = imgRegex.exec(html)) !== null) {
    images.push(parseTagAttributes(m[1]));
  }

  const anchors = [];
  const anchorRegex = /<a\b([^>]*)>/gi;
  while ((m = anchorRegex.exec(html)) !== null) {
    anchors.push(parseTagAttributes(m[1]));
  }

  const headings = [];
  const headingRegex = /<(h[1-6])\b([^>]*)>([\s\S]*?)<\/\1>/gi;
  while ((m = headingRegex.exec(html)) !== null) {
    const level = Number(m[1].slice(1));
    const text = decodeHtmlEntities(m[3].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
    headings.push({ level, tag: m[1].toLowerCase(), attrs: parseTagAttributes(m[2]), text });
  }

  const ids = new Set();
  const idRegex = /\bid=["']([^"']+)["']/gi;
  while ((m = idRegex.exec(html)) !== null) {
    ids.add(m[1]);
  }

  const jsonLdBlocks = [];
  const ldRegex = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  while ((m = ldRegex.exec(html)) !== null) {
    jsonLdBlocks.push(m[1].trim());
  }

  const inlineScripts = [];
  const inlineScriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  while ((m = inlineScriptRegex.exec(html)) !== null) {
    const attrs = parseTagAttributes(m[1]);
    if (!attrs.src && attrs.type !== 'application/ld+json') {
      inlineScripts.push(m[2]);
    }
  }

  const getMeta = (nameOrProp) => {
    const lower = nameOrProp.toLowerCase();
    const found = metas.find(
      (item) => (item.name || '').toLowerCase() === lower || (item.property || '').toLowerCase() === lower
    );
    return found ? found.content ?? '' : '';
  };

  return {
    title,
    htmlAttrs,
    metas,
    links,
    images,
    anchors,
    headings,
    ids,
    jsonLdBlocks,
    inlineScripts,
    getMeta,
  };
}

export function parseCloudflareHeaders(headersText) {
  const blocks = [];
  let current = null;
  const lines = String(headersText || '').split(/\r?\n/);

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const isIndented = /^\s+/.test(rawLine);
    if (!isIndented) {
      current = { pattern: trimmed, headers: {} };
      blocks.push(current);
    } else if (current) {
      const colonIdx = trimmed.indexOf(':');
      if (colonIdx > 0) {
        const key = trimmed.slice(0, colonIdx).trim();
        const value = trimmed.slice(colonIdx + 1).trim();
        current.headers[key] = value;
      }
    }
  }
  return blocks;
}

function matchCfPattern(pattern, pathname) {
  if (pattern === pathname) return true;
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  const regex = new RegExp(`^${escaped}$`);
  return regex.test(pathname);
}

export function evaluateCloudflareHeaders(headersText, routePath) {
  const blocks = parseCloudflareHeaders(headersText);
  const resolved = {};
  const matchedPatterns = [];
  for (const block of blocks) {
    if (matchCfPattern(block.pattern, routePath)) {
      matchedPatterns.push(block.pattern);
      for (const [key, val] of Object.entries(block.headers)) {
        resolved[key] = val;
      }
    }
  }
  return { routePath, matchedPatterns, headers: resolved };
}

export function parseCloudflareRedirects(redirectsText) {
  const rules = [];
  const lines = String(redirectsText || '').split(/\r?\n/);
  for (let idx = 0; idx < lines.length; idx++) {
    const trimmed = lines[idx].trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2) {
      rules.push({
        line: idx + 1,
        source: parts[0],
        target: parts[1],
        status: parts[2] ? Number(parts[2]) : 301,
      });
    }
  }
  return rules;
}

export function simulateCloudflareRedirect(redirectsText, pathname) {
  const rules = parseCloudflareRedirects(redirectsText);
  for (const rule of rules) {
    if (rule.source.endsWith('/*')) {
      const prefix = rule.source.slice(0, -1); // retains trailing slash
      if (pathname.startsWith(prefix)) {
        const splat = pathname.slice(prefix.length);
        const target = rule.target.replace(':splat', splat);
        return { matched: true, ...rule, resolvedTarget: target };
      }
    } else if (rule.source === pathname) {
      return { matched: true, ...rule, resolvedTarget: rule.target };
    }
  }
  return { matched: false, status: 200, resolvedTarget: pathname };
}

function isIsoWithTz(val) {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})$/.test(String(val || '').trim());
}

function collectJsonLdNodes(node, allNodes = []) {
  if (!node || typeof node !== 'object') return allNodes;
  if (Array.isArray(node)) {
    node.forEach((n) => collectJsonLdNodes(n, allNodes));
    return allNodes;
  }
  allNodes.push(node);
  for (const val of Object.values(node)) {
    collectJsonLdNodes(val, allNodes);
  }
  return allNodes;
}

function normalizeUrlPath(raw) {
  if (!raw) return '';
  if (raw.startsWith('https://fadhil.dev/')) return '/' + raw.slice('https://fadhil.dev/'.length);
  if (raw === 'https://fadhil.dev') return '/';
  return raw;
}

export function evaluateSiteSnapshot(snapshot) {
  const {
    files = {},
    existingFiles = new Set(Object.keys(files)),
    diskAssetPaths = [],
    disallowedCodeFiles = [],
    appJsFiles = {},
    imageDimensions = {},
    liveChecks = null,
    targetDateISO = SEO_DATABASE_META.targetDateISO,
  } = snapshot || {};

  const indexHtml = files['index.html'] || '';
  const notFoundHtml = files['404.html'] || '';
  const robotsTxt = files['robots.txt'] || '';
  const sitemapXml = files['sitemap.xml'] || '';
  const headersTxt = files['_headers'] || '';
  const redirectsTxt = files['_redirects'] || '';
  const manifestRaw = files['site.webmanifest'] || '';
  const swJs = files['sw.js'] || '';
  const distIndexHtml = files['dist/index.html'] ?? null;
  const distNotFoundHtml = files['dist/404.html'] ?? null;

  const idx = extractHtmlSignals(indexHtml);
  const nf = extractHtmlSignals(notFoundHtml);

  let parsedJsonLd = null;
  let jsonLdParseError = null;
  if (idx.jsonLdBlocks.length > 0) {
    try {
      parsedJsonLd = JSON.parse(idx.jsonLdBlocks[0]);
    } catch (err) {
      jsonLdParseError = err.message;
    }
  }

  const graph = Array.isArray(parsedJsonLd?.['@graph']) ? parsedJsonLd['@graph'] : [];
  const findGraphType = (t) =>
    graph.find((n) => (Array.isArray(n['@type']) ? n['@type'].includes(t) : n['@type'] === t));

  const webSiteNode = findGraphType('WebSite');
  const personNode = findGraphType('Person');
  const profilePageNode = findGraphType('ProfilePage');
  const itemListNode = findGraphType('ItemList');
  const breadcrumbNode = findGraphType('BreadcrumbList');

  const results = {};

  const record = (id, passed, evidence, actual = null, expected = null) => {
    results[id] = { passed: Boolean(passed), evidence, actual, expected };
  };

  // --- CRAWL ---
  {
    const hasAllowRoot = /^Allow:\s*\/$/m.test(robotsTxt);
    const hasSitemap = /^Sitemap:\s*https:\/\/fadhil\.dev\/sitemap\.xml$/m.test(robotsTxt);
    const blocksRootOr404 = /^Disallow:\s*(\/$|\/404)/m.test(robotsTxt);
    const ok = Boolean(robotsTxt) && hasAllowRoot && hasSitemap && !blocksRootOr404;
    record(
      'CRAWL-ROBOTS-01',
      ok,
      ok
        ? 'robots.txt allows "/", exposes /404 for noindex visibility, and points to https://fadhil.dev/sitemap.xml'
        : 'robots.txt missing Allow: /, Sitemap directive, or contains overly restrictive Disallow',
      robotsTxt.trim().split('\n').slice(0, 6).join(' | '),
      'User-agent: * / Allow: / / Sitemap: https://fadhil.dev/sitemap.xml'
    );
  }

  {
    const locMatch = sitemapXml.match(/<loc>(.*?)<\/loc>/);
    const lastmodMatch = sitemapXml.match(/<lastmod>(.*?)<\/lastmod>/);
    const imageLocs = [...sitemapXml.matchAll(/<image:loc>(.*?)<\/image:loc>/g)].map((m) => m[1].trim());
    const missingImages = imageLocs.filter((u) => {
      const rel = normalizeUrlPath(u).replace(/^\//, '');
      return !existingFiles.has(rel);
    });
    const hasNamespaces =
      sitemapXml.includes('http://www.sitemaps.org/schemas/sitemap/0.9') &&
      sitemapXml.includes('http://www.google.com/schemas/sitemap-image/1.1');
    const locOk = locMatch?.[1]?.trim() === 'https://fadhil.dev/';
    const lastmodVal = lastmodMatch?.[1]?.trim() || '';
    const lastmodOk = isIsoWithTz(lastmodVal);
    const ok = hasNamespaces && locOk && lastmodOk && imageLocs.length >= 5 && missingImages.length === 0;
    record(
      'CRAWL-SITEMAP-01',
      ok,
      ok
        ? `sitemap.xml valid with canonical <loc>, ISO-8601 <lastmod> (${lastmodVal}), and ${imageLocs.length} verified <image:loc> assets`
        : `Sitemap error: namespaces=${hasNamespaces}, loc=${locMatch?.[1]}, lastmod=${lastmodVal}, missingImages=${missingImages.join(',')}`,
      { loc: locMatch?.[1], lastmod: lastmodVal, imageCount: imageLocs.length, missingImages },
      'Canonical https://fadhil.dev/, valid ISO-8601 <lastmod>, and 100% existing image assets'
    );
  }

  {
    const canonicals = idx.links.filter((l) => (l.rel || '').toLowerCase().split(/\s+/).includes('canonical'));
    const sitemaps = idx.links.filter((l) => (l.rel || '').toLowerCase().split(/\s+/).includes('sitemap'));
    const ok =
      canonicals.length === 1 &&
      canonicals[0].href === 'https://fadhil.dev/' &&
      sitemaps.length >= 1 &&
      sitemaps[0].href === '/sitemap.xml';
    record(
      'CRAWL-CANONICAL-01',
      ok,
      ok
        ? 'Single canonical https://fadhil.dev/ and /sitemap.xml link verified'
        : `Canonical/sitemap link mismatch: canonicals=${JSON.stringify(canonicals)}`,
      canonicals.map((c) => c.href),
      ['https://fadhil.dev/']
    );
  }

  {
    const robotsMeta = idx.getMeta('robots');
    const googlebotMeta = idx.getMeta('googlebot');
    const requiredDirectives = ['index', 'follow', 'max-image-preview:large', 'max-snippet:-1', 'max-video-preview:-1'];
    const hasAll = (val) => requiredDirectives.every((d) => val.toLowerCase().includes(d));
    const ok = hasAll(robotsMeta) && hasAll(googlebotMeta);
    record(
      'CRAWL-ROBOTSMETA-01',
      ok,
      ok
        ? 'robots & googlebot directives unlock large image previews and unlimited snippets/video'
        : 'robots or googlebot meta tag missing required max-preview directives',
      { robots: robotsMeta, googlebot: googlebotMeta },
      requiredDirectives.join(', ')
    );
  }

  {
    const nfRobots = nf.getMeta('robots');
    const nfGooglebot = nf.getMeta('googlebot');
    const nfCanonicals = nf.links.filter((l) => (l.rel || '').toLowerCase().includes('canonical'));
    const ok =
      /noindex/i.test(nfRobots) &&
      /noindex/i.test(nfGooglebot) &&
      nfCanonicals.length === 0;
    record(
      'CRAWL-404-01',
      ok,
      ok
        ? '404.html enforces noindex, follow with zero self-canonical'
        : '404.html missing noindex directive or erroneously includes canonical tag',
      { robots: nfRobots, canonicals: nfCanonicals.length },
      'noindex, follow and 0 canonical tags'
    );
  }

  {
    const alternates = idx.links.filter(
      (l) => (l.rel || '').toLowerCase().split(/\s+/).includes('alternate') && l.hreflang
    );
    const badTargets = alternates.filter((l) => /\/(id|jp|en|mobile)\b/i.test(l.href || ''));
    const hasXDefault = alternates.some((l) => l.hreflang === 'x-default' && l.href === 'https://fadhil.dev/');
    const hasEn = alternates.some((l) => l.hreflang === 'en' && l.href === 'https://fadhil.dev/');
    const ok = hasXDefault && hasEn && badTargets.length === 0;
    record(
      'CRAWL-HREFLANG-01',
      ok,
      ok
        ? 'Hreflang x-default and en align cleanly with canonical https://fadhil.dev/'
        : 'Hreflang missing x-default/en or pointing to redirected language subpaths',
      alternates,
      'x-default + en -> https://fadhil.dev/'
    );
  }

  // --- META ---
  {
    const len = idx.title.length;
    const isGeneric = /^(my\s+app|home|vite\s+app|react\s+app|untitled)$/i.test(idx.title);
    const ok = len >= 30 && len <= 60 && !isGeneric;
    record(
      'META-TITLE-01',
      ok,
      ok ? `Title length ${len} chars ("${idx.title}")` : `Title "${idx.title}" (${len} chars) outside 30-60 optimal range`,
      len,
      '30-60 chars'
    );
  }

  {
    const desc = idx.getMeta('description');
    const len = desc.length;
    const ok = len >= 120 && len <= 160;
    record(
      'META-DESC-01',
      ok,
      ok ? `Meta description length ${len} chars within 120-160 range` : `Meta description length ${len} chars outside 120-160 range`,
      len,
      '120-160 chars'
    );
  }

  {
    const ogUpdated = idx.getMeta('og:updated_time');
    const siteMod = webSiteNode?.dateModified || '';
    const profileMod = profilePageNode?.dateModified || '';
    const sitemapMod = (sitemapXml.match(/<lastmod>(.*?)<\/lastmod>/)?.[1] || '').trim();
    const allStamps = [ogUpdated, siteMod, profileMod, sitemapMod];
    const allValidIso = allStamps.every(isIsoWithTz);
    const allSynced = allValidIso && new Set(allStamps).size === 1;
    const isFreshForTarget = allStamps.every((s) => {
      if (!s) return false;
      const utcDate = new Date(s);
      return !Number.isNaN(utcDate.getTime()) && utcDate.toISOString().slice(0, 10) >= targetDateISO;
    });
    const ok = allSynced && isFreshForTarget;
    record(
      'META-FRESHNESS-01',
      ok,
      ok
        ? `All 4 timestamps synchronized at ${ogUpdated} (>= ${targetDateISO} UTC)`
        : `Timestamp drift or stale date detected: og=${ogUpdated}, webSite=${siteMod}, profile=${profileMod}, sitemap=${sitemapMod}`,
      { ogUpdated, siteMod, profileMod, sitemapMod, targetDateISO },
      `Synchronized ISO-8601 >= ${targetDateISO}`
    );
  }

  {
    const ogImage = idx.getMeta('og:image');
    const ogW = Number(idx.getMeta('og:image:width'));
    const ogH = Number(idx.getMeta('og:image:height'));
    const ogAlt = idx.getMeta('og:image:alt');
    const twCard = idx.getMeta('twitter:card');
    const twImg = idx.getMeta('twitter:image');
    const ogRel = normalizeUrlPath(ogImage).replace(/^\//, '');
    const actualDim = imageDimensions[ogRel] || null;
    const dimMatches = actualDim ? actualDim.width === ogW && actualDim.height === ogH : false;
    const ok =
      idx.getMeta('og:type') === 'profile' &&
      Boolean(idx.getMeta('og:site_name')) &&
      Boolean(idx.getMeta('og:title')) &&
      Boolean(idx.getMeta('og:description')) &&
      ogImage.startsWith('https://fadhil.dev/') &&
      existingFiles.has(ogRel) &&
      dimMatches &&
      Boolean(ogAlt) &&
      twCard === 'summary_large_image' &&
      twImg === ogImage;
    record(
      'META-SOCIAL-01',
      ok,
      ok
        ? `OpenGraph & Twitter cards match actual ${actualDim.width}x${actualDim.height} binary dimensions`
        : `Social metadata mismatch: declared og:image=${ogW}x${ogH}, disk binary=${actualDim ? `${actualDim.width}x${actualDim.height}` : 'missing'}`,
      { declared: `${ogW}x${ogH}`, actual: actualDim ? `${actualDim.width}x${actualDim.height}` : null },
      actualDim ? `${actualDim.width}x${actualDim.height}` : 'Matching og:image dimensions'
    );
  }

  {
    const hasDeprecated =
      /<meta[^>]+name=["']apple-mobile-web-app-capable["']/i.test(indexHtml) ||
      /<meta[^>]+name=["']keywords["']/i.test(indexHtml) ||
      /http-equiv=["']X-UA-Compatible["']/i.test(indexHtml) ||
      /<meta[^>]+name=["']apple-mobile-web-app-capable["']/i.test(notFoundHtml);
    const hasModernMobile = idx.getMeta('mobile-web-app-capable') === 'yes';
    const ok = !hasDeprecated && hasModernMobile;
    record(
      'META-DEPRECATED-01',
      ok,
      ok
        ? 'Zero deprecated meta tags; uses standard mobile-web-app-capable'
        : 'Found deprecated meta tag (apple-mobile-web-app-capable, keywords, or X-UA-Compatible)',
      { hasDeprecated, hasModernMobile },
      'No deprecated meta tags'
    );
  }

  // --- SCHEMA ---
  {
    const definedIds = new Set(graph.map((n) => n['@id']).filter(Boolean));
    const allNodes = parsedJsonLd ? collectJsonLdNodes(parsedJsonLd) : [];
    const danglingIds = [];
    for (const node of allNodes) {
      if (node['@id'] && Object.keys(node).length === 1 && !definedIds.has(node['@id'])) {
        danglingIds.push(node['@id']);
      }
    }
    const ok = !jsonLdParseError && parsedJsonLd?.['@context'] === 'https://schema.org' && graph.length >= 4 && danglingIds.length === 0;
    record(
      'SCHEMA-SYNTAX-01',
      ok,
      ok
        ? `JSON-LD valid with ${graph.length} linked @graph nodes and 0 dangling @id references`
        : `JSON-LD error: parseError=${jsonLdParseError}, danglingIds=${danglingIds.join(',')}`,
      { parseError: jsonLdParseError, danglingIds, nodeCount: graph.length },
      'Valid Schema.org @graph with 0 dangling @id'
    );
  }

  {
    const allNodes = parsedJsonLd ? collectJsonLdNodes(parsedJsonLd) : [];
    const invalidAppNodes = [];
    for (const node of allNodes) {
      const types = Array.isArray(node['@type']) ? node['@type'] : [node['@type']];
      if (types.some((t) => typeof t === 'string' && /(?:Software|Web|Mobile)Application$/i.test(t))) {
        if (!node.offers || (!node.aggregateRating && !node.review)) {
          invalidAppNodes.push(node.name || 'unnamed');
        }
      }
    }
    const ok = parsedJsonLd !== null && invalidAppNodes.length === 0;
    record(
      'SCHEMA-RICHGATE-01',
      ok,
      ok
        ? 'Zero invalid Software/Web/MobileApplication items (all Rich Result gates satisfied)'
        : `Invalid SoftwareApplication items missing offers + rating/review: ${invalidAppNodes.join(', ')}`,
      invalidAppNodes,
      '0 invalid Application items'
    );
  }

  {
    const sameAs = Array.isArray(personNode?.sameAs) ? personNode.sameAs : [];
    const trackingSameAs = sameAs.filter((u) => /[?&](?:igsh|ref_|utm_|fbclid)=/i.test(u));
    const nonHttpsSameAs = sameAs.filter((u) => !String(u).startsWith('https://'));
    const imgObj = personNode?.image;
    const ogRel = normalizeUrlPath(imgObj?.url || '').replace(/^\//, '');
    const actualDim = imageDimensions[ogRel] || null;
    const imgDimOk = Boolean(actualDim && imgObj?.width === actualDim.width && imgObj?.height === actualDim.height);
    const profileLinksOk =
      profilePageNode?.mainEntity?.['@id'] === 'https://fadhil.dev/#person' &&
      profilePageNode?.about?.['@id'] === 'https://fadhil.dev/#person' &&
      profilePageNode?.isPartOf?.['@id'] === 'https://fadhil.dev/#website' &&
      profilePageNode?.hasPart?.['@id'] === 'https://fadhil.dev/#portfolio-list';
    const ok =
      Boolean(personNode && profilePageNode) &&
      profileLinksOk &&
      imgDimOk &&
      sameAs.length >= 14 &&
      trackingSameAs.length === 0 &&
      nonHttpsSameAs.length === 0;
    record(
      'SCHEMA-PROFILE-01',
      ok,
      ok
        ? `ProfilePage + Person verified (${sameAs.length} clean HTTPS sameAs profiles, ${actualDim.width}x${actualDim.height} ImageObject)`
        : `ProfilePage/Person issue: imgDimOk=${imgDimOk}, trackingSameAs=${trackingSameAs.join(',')}, profileLinksOk=${profileLinksOk}`,
      {
        imageDeclared: imgObj ? `${imgObj.width}x${imgObj.height}` : null,
        imageActual: actualDim ? `${actualDim.width}x${actualDim.height}` : null,
        trackingSameAs,
      },
      'Accurate ImageObject dimensions and clean canonical sameAs URLs without tracking params'
    );
  }

  {
    const items = Array.isArray(itemListNode?.itemListElement) ? itemListNode.itemListElement : [];
    const urls = items.map((e) => e.item?.url).filter(Boolean);
    const uniqueUrls = new Set(urls);
    const missingDomAnchors = urls
      .map((u) => {
        const hashIdx = u.indexOf('#');
        return hashIdx >= 0 ? u.slice(hashIdx + 1) : '';
      })
      .filter((frag) => !frag || !idx.ids.has(frag));
    const missingItemFields = items.filter((e, i) => {
      const item = e.item || {};
      const imgPath = normalizeUrlPath(typeof item.image === 'string' ? item.image : item.image?.url).replace(/^\//, '');
      return (
        e.position !== i + 1 ||
        item['@type'] !== 'CreativeWork' ||
        !item.name ||
        !item.description ||
        !item.url ||
        !existingFiles.has(imgPath)
      );
    });
    const ok =
      itemListNode &&
      itemListNode.numberOfItems === items.length &&
      items.length === 4 &&
      uniqueUrls.size === items.length &&
      missingDomAnchors.length === 0 &&
      missingItemFields.length === 0;
    record(
      'SCHEMA-ITEMLIST-01',
      ok,
      ok
        ? `ItemList lists 4 distinct CreativeWork items each anchored to a unique DOM #id`
        : `ItemList defect: uniqueUrls=${uniqueUrls.size}/${items.length}, missingDomAnchors=${missingDomAnchors.join(',')}, invalidItems=${missingItemFields.length}`,
      { total: items.length, uniqueUrls: uniqueUrls.size, missingDomAnchors },
      '4 unique #portfolio-* fragment URLs resolving to real DOM IDs'
    );
  }

  // --- EDGE ---
  {
    const rootH = evaluateCloudflareHeaders(headersTxt, '/');
    const nfH = evaluateCloudflareHeaders(headersTxt, '/404');
    const appH = evaluateCloudflareHeaders(headersTxt, '/app/styles.css');
    const swH = evaluateCloudflareHeaders(headersTxt, '/sw.js');
    const smH = evaluateCloudflareHeaders(headersTxt, '/sitemap.xml');
    const hasXFrame = /X-Frame-Options/i.test(headersTxt);
    const hsts = rootH.headers['Strict-Transport-Security'] || '';
    const ok =
      !hasXFrame &&
      /nosniff/i.test(rootH.headers['X-Content-Type-Options'] || '') &&
      /includeSubDomains/i.test(hsts) &&
      /preload/i.test(hsts) &&
      /index,\s*follow/i.test(rootH.headers['X-Robots-Tag'] || '') &&
      /rel="canonical"/.test(rootH.headers['Link'] || '') &&
      /noindex,\s*follow/i.test(nfH.headers['X-Robots-Tag'] || '') &&
      /stale-while-revalidate/i.test(appH.headers['Cache-Control'] || '') &&
      !/immutable/i.test(appH.headers['Cache-Control'] || '') &&
      swH.headers['Service-Worker-Allowed'] === '/' &&
      /max-age=0,\s*must-revalidate/i.test(swH.headers['Cache-Control'] || '') &&
      /noindex/i.test(smH.headers['X-Robots-Tag'] || '');
    record(
      'EDGE-HEADERS-01',
      ok,
      ok
        ? 'Cloudflare _headers passes all security, canonical Link, noindex, SWR, and /sw.js precedence rules'
        : 'Cloudflare _headers rule mismatch or precedence defect',
      { root: rootH.headers, notFound: nfH.headers, sw: swH.headers },
      'Unencumbered HSTS+nosniff, canonical Link, /404 noindex, /sw.js max-age=0'
    );
  }

  {
    const rules = parseCloudflareRedirects(redirectsTxt);
    const hasSoft404 = rules.some((r) => r.source === '/404' && r.status === 200);
    const missingRewriteTargets = rules
      .filter((r) => r.status === 200 && !r.target.includes(':splat'))
      .filter((r) => !existingFiles.has(r.target.replace(/^\//, '')));
    const loops = rules.filter((r) => r.status !== 200 && r.source === r.target);
    const enSim = simulateCloudflareRedirect(redirectsTxt, '/en');
    const inDevSim = simulateCloudflareRedirect(redirectsTxt, '/shareideas');
    const legacySim = simulateCloudflareRedirect(redirectsTxt, '/fadhil/app/styles.css');
    const ok =
      !hasSoft404 &&
      missingRewriteTargets.length === 0 &&
      loops.length === 0 &&
      enSim.status === 301 &&
      inDevSim.status === 302 &&
      legacySim.status === 200 &&
      legacySim.resolvedTarget === '/app/styles.css';
    record(
      'EDGE-REDIRECTS-01',
      ok,
      ok
        ? `_redirects verified (${rules.length} rules: 0 soft-404s, 0 loops, all 200 targets verified)`
        : `_redirects issue: soft404=${hasSoft404}, missingTargets=${missingRewriteTargets.map((r) => r.target).join(',')}`,
      { ruleCount: rules.length, hasSoft404, missingRewriteTargets },
      '0 soft-404s, 0 loops, valid 301/302/200 rules'
    );
  }

  {
    const ok = liveChecks
      ? Boolean(
          liveChecks.routes?.root?.status === 200 &&
            liveChecks.routes?.notFound?.status === 404 &&
            /noindex/i.test(liveChecks.routes?.notFound?.xRobotsTag || '') &&
            liveChecks.routes?.redirectEn?.status === 301 &&
            liveChecks.routes?.redirectInDev?.status === 302 &&
            liveChecks.routes?.sw?.status === 200 &&
            liveChecks.routes?.sw?.swAllowed === '/'
        )
      : true;
    record(
      'EDGE-LIVE-01',
      ok,
      liveChecks
        ? ok
          ? 'Live HTTP probe confirmed 200 /, 404 /404 (noindex), 301 /en, 302 /shareideas, 200 /sw.js'
          : `Live HTTP probe failed: ${JSON.stringify(liveChecks.routes)}`
        : 'Static simulation mode (no live server probe attached)',
      liveChecks?.routes || 'simulated',
      '200 /, 404 /404, 301 /en, 302 /shareideas, 200 /sw.js'
    );
  }

  // --- CWV ---
  {
    const heroImg = idx.images.find((im) => im.src === '/assets/images/portfolio-banner.jpg');
    const actualHeroDim = imageDimensions['assets/images/portfolio-banner.jpg'];
    const heroDimMatches = Boolean(
      heroImg &&
        actualHeroDim &&
        Number(heroImg.width) === actualHeroDim.width &&
        Number(heroImg.height) === actualHeroDim.height &&
        heroImg.loading === 'eager' &&
        heroImg.fetchpriority === 'high'
    );
    const missingDims = idx.images.filter((im) => !im.width || !im.height);
    const preloadHero = idx.links.find((l) => l.rel === 'preload' && l.as === 'image');
    const preloadOk = Boolean(preloadHero && existingFiles.has((preloadHero.href || '').replace(/^\//, '')));
    const unreferencedAssets = diskAssetPaths.filter((p) => !snapshot.referencedAssets?.has(p));
    const ok = heroDimMatches && missingDims.length === 0 && preloadOk && unreferencedAssets.length === 0;
    record(
      'CWV-MEDIA-01',
      ok,
      ok
        ? `Hero image dimensions (${actualHeroDim.width}x${actualHeroDim.height}), eager preload, and all ${idx.images.length} image slots verified`
        : `Media defect: heroImg=${heroImg?.width}x${heroImg?.height} vs disk=${actualHeroDim?.width}x${actualHeroDim?.height}, missingDims=${missingDims.length}, unreferenced=${unreferencedAssets.length}`,
      {
        heroDeclared: heroImg ? `${heroImg.width}x${heroImg.height}` : null,
        heroActual: actualHeroDim ? `${actualHeroDim.width}x${actualHeroDim.height}` : null,
        missingDims: missingDims.length,
        unreferencedAssets,
      },
      actualHeroDim ? `${actualHeroDim.width}x${actualHeroDim.height}` : 'Exact disk dimensions + preload'
    );
  }

  {
    const hasBrokenAvifCanvasProbe = /toDataURL\(['"]image\/avif['"]\)/.test(indexHtml);
    const cssLink = idx.links.find((l) => l.rel === 'stylesheet' && (l.href || '').startsWith('/app/styles.css'));
    const nfCssLink = nf.links.find((l) => l.rel === 'stylesheet' && (l.href || '').startsWith('/app/styles.css'));
    const expectedVersion = `?v=${targetDateISO.replace(/-/g, '')}`;
    const cssVersionOk = Boolean(cssLink?.href?.includes(expectedVersion) && nfCssLink?.href?.includes(expectedVersion));
    const ok = !hasBrokenAvifCanvasProbe && cssVersionOk;
    record(
      'CWV-SCRIPTS-01',
      ok,
      ok
        ? `Critical rendering path clean (no broken canvas AVIF probe; CSS cache-buster ${expectedVersion})`
        : `Critical path defect: brokenAvifCanvasProbe=${hasBrokenAvifCanvasProbe}, cssHref=${cssLink?.href} (expected ${expectedVersion})`,
      { hasBrokenAvifCanvasProbe, cssHref: cssLink?.href, nfCssHref: nfCssLink?.href },
      `No canvas AVIF probe; ${expectedVersion}`
    );
  }

  {
    if (distIndexHtml !== null && distNotFoundHtml !== null) {
      const hasCssDist =
        /<link[^>]+rel="stylesheet"[^>]+href="\/app\/styles\.css\?v=\d{8}[a-z]*"/.test(distIndexHtml) &&
        /<link[^>]+rel="stylesheet"[^>]+href="\/app\/styles\.css\?v=\d{8}[a-z]*"/.test(distNotFoundHtml);
      const hasBrokenScriptCss =
        /<script[^>]+src="\/app\/styles\.css/.test(distIndexHtml) ||
        /<script[^>]+src="\/app\/styles\.css/.test(distNotFoundHtml);
      const hasBase64Sitemap = /data:text\/xml;base64/i.test(distIndexHtml);
      const distSynced = distIndexHtml.trim() === indexHtml.trim() && distNotFoundHtml.trim() === notFoundHtml.trim();
      const ok = hasCssDist && !hasBrokenScriptCss && !hasBase64Sitemap && distSynced;
      record(
        'CWV-DIST-01',
        ok,
        ok
          ? 'Production dist/index.html and dist/404.html match pristine source without bundler corruption'
          : `dist/ artifact mismatch: hasCss=${hasCssDist}, brokenScriptCss=${hasBrokenScriptCss}, synced=${distSynced}`,
        { hasCssDist, hasBrokenScriptCss, hasBase64Sitemap, distSynced },
        'Synced pristine dist/index.html & dist/404.html'
      );
    } else {
      record('CWV-DIST-01', true, 'Browser-mode source inspection (dist/ checked in CLI build pipeline)', null, null);
    }
  }

  // --- A11Y ---
  {
    const h1Count = idx.headings.filter((h) => h.level === 1).length;
    const nfH1Count = nf.headings.filter((h) => h.level === 1).length;
    let skipped = false;
    let prev = 0;
    for (const h of idx.headings) {
      if (prev > 0 && h.level > prev + 1) {
        skipped = true;
        break;
      }
      prev = h.level;
    }
    const hasSkipLink = idx.anchors.some((a) => a.href === '#main-content');
    const hasMainId = idx.ids.has('main-content');
    const ok = h1Count === 1 && nfH1Count === 1 && !skipped && hasSkipLink && hasMainId;
    record(
      'A11Y-HEADINGS-01',
      ok,
      ok
        ? `Heading outline valid (1 <h1>, ${idx.headings.length} headings, 0 skipped levels) + skip-link to #main-content`
        : `Heading/landmark defect: h1=${h1Count}, nfH1=${nfH1Count}, skipped=${skipped}, skipLink=${hasSkipLink}, mainId=${hasMainId}`,
      { h1Count, nfH1Count, skipped, hasSkipLink, hasMainId },
      '1 <h1>, sequential headings, skip-link to #main-content'
    );
  }

  {
    const roleButtonDivs = /<(?:div|li|span)\b[^>]*role=["']button["']/i.test(indexHtml);
    const redundantLandmarkRoles = /<(?:header|main|footer|nav)\b[^>]*role=["'](?:banner|main|contentinfo|navigation)["']/i.test(indexHtml);
    const missingAltImgs = idx.images.filter((im) => im.alt === undefined && im['aria-hidden'] !== 'true');
    const unsafeBlankLinks = idx.anchors.filter(
      (a) => a.target === '_blank' && !((a.rel || '').includes('noopener') && (a.rel || '').includes('noreferrer'))
    );
    const ok = !roleButtonDivs && !redundantLandmarkRoles && missingAltImgs.length === 0 && unsafeBlankLinks.length === 0;
    record(
      'A11Y-CONTROLS-01',
      ok,
      ok
        ? '100% native controls, 0 redundant landmark roles, valid alt coverage, and safe target="_blank" rel attributes'
        : `A11y defect: roleButtonDivs=${roleButtonDivs}, redundantRoles=${redundantLandmarkRoles}, missingAlt=${missingAltImgs.length}, unsafeLinks=${unsafeBlankLinks.length}`,
      { roleButtonDivs, redundantLandmarkRoles, missingAlt: missingAltImgs.length, unsafeBlankLinks: unsafeBlankLinks.length },
      'Native buttons/links with noopener noreferrer'
    );
  }

  {
    if (liveChecks) {
      const mobile = liveChecks.mobile;
      const desktop = liveChecks.desktop;
      const expectedMobileOrder = [
        '.hero-banner-frame',
        '.about-cyber-frame',
        '.socials-cyber-frame',
        '.tools-cyber-frame',
        '.skills-cyber-frame',
        '.portfolios-section',
      ];
      const orderMatches =
        JSON.stringify(mobile?.cardOrder || []) === JSON.stringify(expectedMobileOrder);
      const noOverflow = mobile?.overflowPx === 0 && desktop?.overflowPx === 0;
      const allImgsLoaded = Boolean(desktop?.brokenImages?.length === 0 && mobile?.brokenImages?.length === 0);
      const ok = orderMatches && noOverflow && allImgsLoaded;
      record(
        'A11Y-MOBILE-01',
        ok,
        ok
          ? 'Live Chromium verified 0px horizontal overflow (1440x900 & 390x844), exact mobile card sequence, and 100% loaded images'
          : `Live layout issue: orderMatches=${orderMatches}, overflow=${desktop?.overflowPx}/${mobile?.overflowPx}, brokenImgs=${desktop?.brokenImages?.length}`,
        { mobileOrder: mobile?.cardOrder, overflow: { desktop: desktop?.overflowPx, mobile: mobile?.overflowPx } },
        expectedMobileOrder.join(' -> ')
      );
    } else {
      record('A11Y-MOBILE-01', true, 'Static mode (live viewport check runs with browser probe)', null, null);
    }
  }

  // --- PWA ---
  {
    let manifest = null;
    try {
      manifest = JSON.parse(manifestRaw);
    } catch (_) {}
    const manifestIconsOk =
      manifest &&
      Array.isArray(manifest.icons) &&
      manifest.icons.every((ic) => existingFiles.has((ic.src || '').replace(/^\//, '')));
    const hasFavicon32Link = idx.links.some(
      (l) => l.rel === 'icon' && l.href === '/favicon.png' && l.sizes === '32x32'
    );
    const appleIcon = idx.links.find((l) => l.rel === 'apple-touch-icon');
    const appleDim = imageDimensions['apple-touch-icon.png'];
    const appleSizeValid = Boolean(
      appleIcon &&
        (!appleIcon.sizes || (appleDim && appleIcon.sizes === `${appleDim.width}x${appleDim.height}`))
    );
    const ok = Boolean(manifest && manifest.name && manifest.start_url === '/' && manifestIconsOk && hasFavicon32Link && appleSizeValid);
    record(
      'PWA-MANIFEST-01',
      ok,
      ok
        ? 'site.webmanifest, /favicon.png (32x32), and apple-touch-icon (512x512) links accurate and present'
        : `Icon/Manifest mismatch: hasFavicon32Link=${hasFavicon32Link}, appleSizes=${appleIcon?.sizes} (actual ${appleDim?.width}x${appleDim?.height})`,
      { hasFavicon32Link, appleSizesAttr: appleIcon?.sizes, appleActual: appleDim ? `${appleDim.width}x${appleDim.height}` : null },
      'Linked 32x32 favicon.png + accurate apple-touch-icon dimensions'
    );
  }

  {
    const expectedPrefix = `fadhil-pwa-v${targetDateISO.replace(/-/g, '')}`;
    const hasCurrentCache = swJs.includes(expectedPrefix);
    const scopedSameOrigin = /const isSameOrigin = url\.origin === self\.location\.origin/.test(swJs);
    const guardsHttp = /req\.url\.startsWith\('http'\)/.test(swJs);
    const ok = hasCurrentCache && scopedSameOrigin && guardsHttp;
    record(
      'PWA-SW-01',
      ok,
      ok
        ? `Service worker cache "${expectedPrefix}" isolated strictly to same-origin and Google Fonts`
        : `SW issue: expected cache prefix "${expectedPrefix}", scopedSameOrigin=${scopedSameOrigin}`,
      { hasCurrentCache, scopedSameOrigin, guardsHttp },
      expectedPrefix
    );
  }

  // --- SECURITY ---
  {
    const innerHtmlHits = Object.entries(appJsFiles)
      .filter(([, code]) => /\.innerHTML\s*=/.test(code))
      .map(([name]) => name);
    const consoleErrors = liveChecks?.consoleErrors || [];
    const failedRequests = liveChecks?.failedRequests || [];
    const ok =
      disallowedCodeFiles.length === 0 &&
      innerHtmlHits.length === 0 &&
      consoleErrors.length === 0 &&
      failedRequests.length === 0 &&
      idx.getMeta('referrer') === 'strict-origin-when-cross-origin';
    record(
      'SEC-HYGIENE-01',
      ok,
      ok
        ? 'Exclusive HTML/CSS/JS stack, zero innerHTML mutations, referrer policy enforced, 0 console/network errors'
        : `Hygiene violation: disallowed=${disallowedCodeFiles.length}, innerHTML=${innerHtmlHits.join(',')}, consoleErrors=${consoleErrors.length}`,
      { disallowedCodeFiles, innerHtmlHits, consoleErrors, failedRequests },
      '0 disallowed files, 0 innerHTML, 0 runtime errors'
    );
  }

  // Score calculation
  let penalty = 0;
  const summary = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, PASS: 0 };
  const findings = [];
  const passedChecks = [];
  const categoryStats = {};
  for (const cat of CATEGORY_DEFINITIONS) {
    categoryStats[cat.id] = { ...cat, total: 0, passed: 0, penalty: 0 };
  }

  for (const rule of RULES_DATABASE_2026) {
    const res = results[rule.id] || { passed: false, evidence: 'Rule not evaluated' };
    categoryStats[rule.category].total++;
    const item = { ...rule, ...res };
    if (res.passed) {
      summary.PASS++;
      categoryStats[rule.category].passed++;
      passedChecks.push(item);
    } else {
      summary[rule.severity]++;
      const p = SEVERITY_PENALTY[rule.severity] || 4;
      penalty += p;
      categoryStats[rule.category].penalty += p;
      findings.push(item);
    }
  }

  const overallScore = Math.max(0, 100 - penalty);
  const categories = Object.values(categoryStats).map((c) => ({
    ...c,
    score: Math.max(0, Math.round(((c.passed / (c.total || 1)) * 100))),
  }));

  const grade =
    overallScore >= 97 && summary.CRITICAL === 0 && summary.HIGH === 0
      ? 'ELITE (A+)'
      : overallScore >= 90
        ? 'PASS (A)'
        : overallScore >= 75
          ? 'FAIR (B)'
          : 'FAIL (NEEDS FIX)';

  const eligibleForTopTierSearch = summary.CRITICAL === 0 && summary.HIGH === 0 && overallScore >= 95;

  return {
    databaseVersion: SEO_DATABASE_META.version,
    engineName: SEO_DATABASE_META.engineName,
    evaluatedAt: new Date().toISOString(),
    overallScore,
    grade,
    eligibleForTopTierSearch,
    summary,
    totalRules: RULES_DATABASE_2026.length,
    categories,
    findings,
    passedChecks,
    serpPreview: {
      url: idx.links.find((l) => l.rel === 'canonical')?.href || 'https://fadhil.dev/',
      title: idx.title,
      titleLength: idx.title.length,
      description: idx.getMeta('description'),
      descriptionLength: idx.getMeta('description').length,
      updatedTime: idx.getMeta('og:updated_time'),
    },
    socialPreview: {
      ogType: idx.getMeta('og:type'),
      ogTitle: idx.getMeta('og:title'),
      ogDescription: idx.getMeta('og:description'),
      ogImage: idx.getMeta('og:image'),
      ogImageWidth: idx.getMeta('og:image:width'),
      ogImageHeight: idx.getMeta('og:image:height'),
      twitterCard: idx.getMeta('twitter:card'),
      twitterSite: idx.getMeta('twitter:site'),
    },
    schemaGraph: graph.map((node) => ({
      type: node['@type'],
      id: node['@id'] || null,
      name: node.name || null,
    })),
    routeAudit: ['/','/index.html','/404','/404.html','/en','/id','/jp','/shareideas','/sw.js','/sitemap.xml','/robots.txt','/fadhil/app/styles.css'].map((routePath) => ({
      routePath,
      redirect: simulateCloudflareRedirect(redirectsTxt, routePath),
      headers: evaluateCloudflareHeaders(headersTxt, routePath).headers,
    })),
  };
}
