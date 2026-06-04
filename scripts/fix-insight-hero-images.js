/**
 * Fix insight article hero images: prefer generated webp banners over corrupt _next JPGs.
 * Also regenerates _next JPG/ card assets from the webp source when available.
 *
 * Run: node scripts/fix-insight-hero-images.js
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const INSIGHTS_DIR = path.join(ROOT, 'insights');
const GEN_DIR = path.join(ROOT, 'images/blog/generated');

/** Some HTTrack v2 banner webps stack a diagram above the hero art (768px tall). */
const STACKED_BANNER_CROP = {
  rollups: 0.375,
};
const DEFAULT_STACKED_CROP = 0.375;

function cropStackedBannerIfNeeded(slug, webpRel) {
  const cropTop = STACKED_BANNER_CROP[slug] ?? DEFAULT_STACKED_CROP;

  const webp = path.join(ROOT, webpRel);
  try {
    execSync(
      `python -c "from PIL import Image; p=r'${webp.replace(/\\/g, '/')}'; im=Image.open(p); w,h=im.size; ` +
        `(h <= 520 or h < 700) and exit(); t=int(h*${cropTop}); c=im.crop((0,t,w,h)); c.save(p,'WEBP',quality=86); print('cropped', c.size)"`,
      { stdio: 'pipe' }
    );
    return true;
  } catch {
    return false;
  }
}

function slugFromFile(file) {
  return path.basename(file, '.html');
}

function findBannerWebp(slug) {
  const direct = [
    `images/blog/generated/${slug}-axiom-chain-v2-banner.webp`,
    `images/blog/generated/${slug}-labrys-v2-banner.webp`,
    `images/blog/${slug}-banner-v3.webp`,
    `images/blog/${slug}-banner-v2.webp`,
    `images/blog/${slug}-banner.webp`,
    `images/blog/${slug}.webp`,
  ];

  for (const rel of direct) {
    if (fs.existsSync(path.join(ROOT, rel))) return rel;
  }

  if (fs.existsSync(GEN_DIR)) {
    const match = fs
      .readdirSync(GEN_DIR)
      .filter((f) => f.startsWith(slug) && f.includes('banner') && f.endsWith('.webp'))
      .sort()
      .pop();
    if (match) return `images/blog/generated/${match}`;
  }

  return null;
}

function findCardWebp(slug) {
  if (!fs.existsSync(GEN_DIR)) return null;
  const match = fs
    .readdirSync(GEN_DIR)
    .filter((f) => f.startsWith(slug) && f.includes('card') && f.endsWith('.webp'))
    .sort()
    .pop();
  if (match) return `images/blog/generated/${match}`;

  for (const rel of [
    `images/blog/${slug}-card-v3.webp`,
    `images/blog/${slug}-card-v2.webp`,
    `images/blog/${slug}-card.webp`,
  ]) {
    if (fs.existsSync(path.join(ROOT, rel))) return rel;
  }
  return null;
}

function webpToJpeg(webpRel, jpegRel) {
  const webp = path.join(ROOT, webpRel);
  const jpeg = path.join(ROOT, jpegRel);
  if (!fs.existsSync(webp)) return false;
  try {
    execSync(
      `python -c "from PIL import Image; im=Image.open(r'${webp.replace(/\\/g, '/')}').convert('RGB'); im.save(r'${jpeg.replace(/\\/g, '/')}', 'JPEG', quality=88)"`,
      { stdio: 'pipe' }
    );
    return true;
  } catch {
    return false;
  }
}

function patchHeroImg(html, prefix, bannerWebp) {
  const src = `${prefix}${bannerWebp}`;
  const heroRe =
    /(<div class="relative overflow-hidden rounded-2xl border border-foreground-10 bg-panel-alt" style="aspect-ratio:21\/9">[\s\S]*?<img[^>]*src=")([^"]+)("[^>]*>)/;
  if (!heroRe.test(html)) return { html, changed: false };
  const next = html.replace(heroRe, `$1${src}$3`);
  return { html: next, changed: next !== html };
}

let pages = 0;
let jpegs = 0;

for (const file of fs.readdirSync(INSIGHTS_DIR).filter((f) => f.endsWith('.html'))) {
  const slug = slugFromFile(file);
  const bannerWebp = findBannerWebp(slug);
  if (!bannerWebp) continue;

  cropStackedBannerIfNeeded(slug, bannerWebp);

  const filePath = path.join(INSIGHTS_DIR, file);
  let html = fs.readFileSync(filePath, 'utf8');
  const prefix = '../';
  const { html: patched, changed } = patchHeroImg(html, prefix, bannerWebp);
  if (changed) {
    fs.writeFileSync(filePath, patched, 'utf8');
    pages++;
  }

  const nextBanner = fs
    .readdirSync(path.join(ROOT, '_next'))
    .find((f) => f.startsWith(slug) && f.includes('banner') && f.endsWith('.jpg'));
  if (nextBanner && webpToJpeg(bannerWebp, `_next/${nextBanner}`)) jpegs++;

  const cardWebp = findCardWebp(slug);
  if (cardWebp) {
    const nextCard = fs
      .readdirSync(path.join(ROOT, '_next'))
      .find((f) => f.startsWith(slug) && f.includes('card') && f.endsWith('.jpg'));
    if (nextCard && webpToJpeg(cardWebp, `_next/${nextCard}`)) jpegs++;
  }
}

console.log(`Patched ${pages} insight hero img tags to use webp banners`);
console.log(`Regenerated ${jpegs} _next JPG assets from webp sources`);
