/**
 * Fix broken insight card images on insights.html (HTTrack blur placeholder corruption).
 * Image paths resolved from files on disk; copy aligned with labrys.io/insights archive.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const INSIGHTS_HTML = path.join(ROOT, 'insights.html');

function isBannerPath(rel) {
  return /banner|v2-banner|-banner\./i.test(path.basename(rel));
}

function resolveImage(slug) {
  const tryPaths = [
    `images/blog/${slug}-card.webp`,
    `images/blog/${slug}-card-v2.webp`,
    `images/blog/${slug}-card-v3.webp`,
  ];

  const genDir = path.join(ROOT, 'images/blog/generated');
  if (fs.existsSync(genDir)) {
    for (const f of fs.readdirSync(genDir)) {
      if (f.includes(slug) && f.includes('card')) {
        tryPaths.push(`images/blog/generated/${f}`);
      }
    }
  }

  const nextDir = path.join(ROOT, '_next');
  if (fs.existsSync(nextDir)) {
    const files = fs.readdirSync(nextDir).filter(
      (f) => f.startsWith(slug) && /\.(jpg|jpeg|webp|png)$/i.test(f)
    );
    const card = files.find((f) => /card/i.test(f));
    if (card) tryPaths.push(`_next/${card}`);
  }

  tryPaths.push(`images/blog/${slug}.webp`);

  // Banners are last — they crop badly on archive cards (1920×480 in a portrait tile).
  tryPaths.push(
    `images/blog/${slug}-banner.webp`,
    `images/blog/${slug}-banner-v2.webp`,
    `images/blog/${slug}-banner-v3.webp`
  );

  if (fs.existsSync(genDir)) {
    for (const f of fs.readdirSync(genDir)) {
      if (f.includes(slug) && f.includes('banner')) {
        tryPaths.push(`images/blog/generated/${f}`);
      }
    }
  }

  if (fs.existsSync(nextDir)) {
    const files = fs.readdirSync(nextDir).filter(
      (f) =>
        f.startsWith(slug) &&
        /\.(jpg|jpeg|webp|png)$/i.test(f) &&
        !/card/i.test(f)
    );
    if (files.length) tryPaths.push(`_next/${files[0]}`);
  }

  for (const rel of tryPaths) {
    if (fs.existsSync(path.join(ROOT, rel))) return rel;
  }

  return null;
}

function cleanImgTag(imgHtml, src, mode = 'card') {
  const altMatch = imgHtml.match(/alt="([^"]*)"/);
  const alt = altMatch ? altMatch[1] : '';
  if (mode === 'prose') {
    return `<img alt="${alt}" loading="lazy" decoding="async" src="${src}"/>`;
  }
  return (
    `<img alt="${alt}" loading="lazy" decoding="async" ` +
    `class="object-cover object-center transition-transform duration-500 group-hover:scale-105" ` +
    `style="position:absolute;height:100%;width:100%;left:0;top:0;right:0;bottom:0;object-fit:cover" ` +
    `src="${src}"/>`
  );
}

function cleanCardExcerpt(text) {
  return text
    .replace(/\sIntro\s+/g, '. ')
    .replace(
      /from the Axiom Chain team\.+\s*The team at Axiom Chain/gi,
      'from our team. We'
    )
    .replace(/\.{2,}/g, '.')
    .replace(/\s+/g, ' ')
    .trim();
}

function fixInsightsPage(html) {
  const cardRe =
    /<a class="block h-full" href="insights\/([^"]+)\.html">([\s\S]*?)<\/a>/g;

  let fixed = 0;
  html = html.replace(cardRe, (block, slug) => {
    const src = resolveImage(slug);
    if (!src) return block;

    const imgRe = /<img[^>]*>/;
    const imgMatch = block.match(imgRe);
    if (!imgMatch) return block;

    const currentImg = imgMatch[0];
    const currentSrc = currentImg.match(/\ssrc="([^"]+)"/)?.[1];
    const needsCover = !/object-cover|object-fit:cover/.test(currentImg);
    const needsSrc =
      currentSrc !== src ||
      (currentSrc && isBannerPath(currentSrc) && !isBannerPath(src));

    let newBlock = block;
    if (
      needsCover ||
      needsSrc ||
      /background-image:none|_next\/image\?url=/.test(block)
    ) {
      newBlock = newBlock.replace(imgRe, (img) => cleanImgTag(img, src));
    }

    newBlock = newBlock.replace(
      /(<p class="[^"]*line-clamp-2[^"]*">)([^<]+)(<\/p>)/,
      (full, open, text, close) => {
        const cleaned = cleanCardExcerpt(text);
        return cleaned === text ? full : `${open}${cleaned}${close}`;
      }
    );

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
  [/Building with Labrys/gi, 'Building with Axiom Chain'],
  [/from Labrys:/gi, 'from Axiom Chain:'],
  [/Labrys built/gi, 'Axiom Chain built'],
  [/Labrys,/gi, 'Axiom Chain,'],
  [/Labrys'/gi, "Axiom Chain's"],
  [/Labrys Turns/gi, 'Axiom Chain milestone'],
  [/CEO Lachlan Feeney/gi, 'the Axiom Chain team'],
];

const INSIGHT_CARD_TAGS = {
  'why-we-refreshed-our-brand': 'Culture — Company',
  'six-years-in': 'Culture — Company',
};

function fixInsightCardTags(html) {
  for (const [slug, tag] of Object.entries(INSIGHT_CARD_TAGS)) {
    html = html.replace(
      new RegExp(
        `(href="insights/${slug}\\.html"[\\s\\S]*?<p class="mb-2 text-xs font-bold uppercase tracking-widest text-white/70">)[^<]+(<\\/p>)`,
        'g'
      ),
      `$1${tag}$2`
    );
  }
  return html;
}

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
    return cleanImgTag(`<img alt="${altM ? altM[1] : ''}">`, pathPrefix + src.replace(pathPrefix, ''), 'prose');
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
    html = fixInsightCardTags(html);
    changed = true;
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
