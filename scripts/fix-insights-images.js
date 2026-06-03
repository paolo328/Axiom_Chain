/**
 * Fix broken insight card images on insights.html (HTTrack blur placeholder corruption).
 * Image paths resolved from files on disk; copy aligned with labrys.io/insights archive.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const INSIGHTS_HTML = path.join(ROOT, 'insights.html');

function resolveImage(slug) {
  const tryPaths = [
    `images/blog/${slug}-card.webp`,
    `images/blog/${slug}-card-v2.webp`,
    `images/blog/${slug}-card-v3.webp`,
    `images/blog/${slug}-banner.webp`,
    `images/blog/${slug}-banner-v2.webp`,
    `images/blog/${slug}-banner-v3.webp`,
    `images/blog/${slug}.webp`,
  ];

  const genDir = path.join(ROOT, 'images/blog/generated');
  if (fs.existsSync(genDir)) {
    for (const f of fs.readdirSync(genDir)) {
      if (f.includes(slug) && (f.includes('card') || f.includes('banner'))) {
        tryPaths.push(`images/blog/generated/${f}`);
      }
    }
  }

  for (const rel of tryPaths) {
    if (fs.existsSync(path.join(ROOT, rel))) return rel;
  }

  const nextDir = path.join(ROOT, '_next');
  if (fs.existsSync(nextDir)) {
    const files = fs.readdirSync(nextDir).filter(
      (f) => f.startsWith(slug) && /\.(jpg|jpeg|webp|png)$/i.test(f)
    );
    const card = files.find((f) => /card/i.test(f));
    if (card) return `_next/${card}`;
    if (files.length) return `_next/${files[0]}`;
  }

  return null;
}

function cleanImgTag(imgHtml, src) {
  const altMatch = imgHtml.match(/alt="([^"]*)"/);
  const alt = altMatch ? altMatch[1] : '';
  return (
    `<img alt="${alt}" loading="lazy" decoding="async" ` +
    `class="object-cover object-center transition-transform duration-500 group-hover:scale-105" ` +
    `style="position:absolute;height:100%;width:100%;left:0;top:0;right:0;bottom:0;object-fit:cover" ` +
    `src="${src}"/>`
  );
}

function fixInsightsPage(html) {
  const cardRe =
    /<a class="block h-full" href="insights\/([^"]+)\.html">([\s\S]*?)<\/a>/g;

  let fixed = 0;
  html = html.replace(cardRe, (block, slug) => {
    const src = resolveImage(slug);
    if (!src) return block;

    const imgRe = /<img[^>]*>/;
    if (!imgRe.test(block)) return block;
    if (!/background-image:none|_next\/image\?url=/.test(block) && block.includes(`src="${src}"`)) {
      return block;
    }

    const newBlock = block.replace(imgRe, (img) => cleanImgTag(img, src));
    if (newBlock !== block) fixed++;
    return newBlock;
  });

  // Featured / hero insight image (glamsterdam)
  html = html.replace(
    /<img([^>]*glamsterdam[^>]*)>/gi,
    (img) => {
      const src = 'images/blog/glamsterdam-whats-next-on-ethereums-upgrade-path.webp';
      if (!fs.existsSync(path.join(ROOT, src))) return img;
      return cleanImgTag(img, src);
    }
  );

  // Strip broken _next/image preloads in head
  html = html.replace(
    /<link rel="preload" as="image" imageSrcSet="_next\/image[^"]*"[^>]*>/g,
    ''
  );

  return { html, fixed };
}

const TEXT_FIXES = [
  [/>\s*Labrys\s*</g, '>Axiom Chain<'],
  [/Building with Labrys/gi, 'Building with Axiom Chain'],
  [/from Labrys:/gi, 'from Axiom Chain:'],
  [/Labrys built/gi, 'Axiom Chain built'],
  [/Labrys,/gi, 'Axiom Chain,'],
  [/Labrys'/gi, "Axiom Chain's"],
  [/Labrys Turns/gi, 'Axiom Chain milestone'],
  [/CEO Lachlan Feeney/gi, 'the Axiom Chain team'],
];

function fixBrokenImgTags(html, pathPrefix = '') {
  const imgRe = /<img([^>]*background-image:none[^>]*)>/gi;
  let n = 0;
  html = html.replace(imgRe, (full, attrs) => {
    let src = null;
    const srcM = attrs.match(/\ssrc="([^"]+)"/);
    if (srcM && !srcM[1].includes('data:')) {
      src = srcM[1].replace(/^\//, '').replace(/^_next\//, '_next/');
      if (!src.startsWith('images/') && !src.startsWith('_next/') && !src.startsWith(pathPrefix)) {
        src = pathPrefix + src;
      }
    }
    if (!src) {
      const setM = attrs.match(/images\/blog\/[^\s"']+\.webp/);
      if (setM) src = pathPrefix + setM[0];
    }
    if (!src || !fs.existsSync(path.join(ROOT, src.replace(pathPrefix, '')))) return full;
    const altM = attrs.match(/alt="([^"]*)"/);
    n++;
    return cleanImgTag(`<img alt="${altM ? altM[1] : ''}">`, pathPrefix + src.replace(pathPrefix, ''));
  });
  return { html, n };
}

function walkHtml(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'scripts', 'hts-cache'].includes(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkHtml(p, files);
    else if (ent.name.endsWith('.html')) files.push(p);
  }
  return files;
}

let totalCards = 0;
let totalImgs = 0;

for (const file of walkHtml(ROOT)) {
  const rel = path.relative(ROOT, file);
  const depth = rel.split(path.sep).length - 1;
  const prefix = depth ? '../'.repeat(depth) : '';

  let html = fs.readFileSync(file, 'utf8');
  for (const [from, to] of TEXT_FIXES) html = html.replace(from, to);

  let changed = false;
  if (file === INSIGHTS_HTML) {
    const { html: patched, fixed } = fixInsightsPage(html);
    html = patched;
    totalCards += fixed;
    changed = fixed > 0;
  }

  const { html: h2, n } = fixBrokenImgTags(html, prefix);
  if (n > 0) {
    html = h2;
    totalImgs += n;
    changed = true;
  }

  html = html.replace(
    /<link rel="preload" as="image" imageSrcSet="_next\/image[^"]*"[^>]*>/g,
    ''
  );

  if (changed) fs.writeFileSync(file, html, 'utf8');
}

console.log(`Fixed ${totalCards} insight cards on insights.html`);
console.log(`Fixed ${totalImgs} broken img tags across site`);
