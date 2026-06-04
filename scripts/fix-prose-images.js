/**
 * Insight article inline diagrams were incorrectly given card-style
 * position:absolute fills by fix-insights-images.js. Restore normal prose imgs.
 *
 * Run: node scripts/fix-prose-images.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BAD_IMG =
  /<img alt="([^"]*)" loading="lazy" decoding="async" class="object-cover object-center transition-transform duration-500 group-hover:scale-105" style="position:absolute;height:100%;width:100%;left:0;top:0;right:0;bottom:0;object-fit:cover" src="([^"]*)"\/>/g;

function proseImg(alt, src) {
  return `<img alt="${alt}" loading="lazy" decoding="async" src="${src}"/>`;
}

function fixHtml(html) {
  const heroes = [];
  html = html.replace(/(style="aspect-ratio:21\/9">)(<img[^>]+\/>)/g, (_, prefix, img) => {
    heroes.push(img);
    return `${prefix}__AXIOM_HERO_${heroes.length - 1}__`;
  });

  let n = 0;
  html = html.replace(BAD_IMG, (_, alt, src) => {
    n++;
    return proseImg(alt, src);
  });

  heroes.forEach((img, i) => {
    html = html.replace(`__AXIOM_HERO_${i}__`, img);
  });

  return { html, n };
}

let files = 0;
let imgs = 0;

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (ent.name.endsWith('.html')) {
      let html = fs.readFileSync(p, 'utf8');
      const { html: fixed, n } = fixHtml(html);
      if (n > 0) {
        fs.writeFileSync(p, fixed, 'utf8');
        files++;
        imgs += n;
      }
    }
  }
}

walk(path.join(ROOT, 'insights'));
walk(ROOT); // insights.html cards keep hero placeholders; cards use group relative + absolute ok

console.log(`Fixed ${imgs} prose/card img tags across ${files} files`);
