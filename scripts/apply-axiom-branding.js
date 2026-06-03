const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const LOGO_MAP = [
  ['brand/logo/axiom-mark-dark.svg', '_next/logo_darkf67a.svg'],
  ['brand/logo/axiom-mark-light.svg', '_next/logo_lighte611.svg'],
  ['brand/logo/axiom-lockup-dark.svg', '_next/logo_text_dark24c3.svg'],
  ['brand/logo/axiom-lockup-light.svg', '_next/logo_text_light.svg'],
  ['brand/logo/axiom-mark-dark.svg', 'brand/logo/axiom-mark-dark.svg'],
  ['brand/logo/axiom-mark-light.svg', 'brand/logo/axiom-mark-light.svg'],
  ['brand/logo/axiom-lockup-dark.svg', 'brand/logo/axiom-lockup-dark.svg'],
  ['brand/logo/axiom-lockup-light.svg', 'brand/logo/axiom-lockup-light.svg'],
];

const copied = new Set();
for (const [srcRel, destRel] of LOGO_MAP) {
  if (copied.has(destRel)) continue;
  copied.add(destRel);
  const out = path.join(ROOT, destRel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.copyFileSync(path.join(ROOT, srcRel), out);
}

const THEME_INLINE =
  '<script>(function(){var t=localStorage.getItem("axiom-theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark");})();</script>';

const FONT_LINKS =
  '<link rel="preconnect" href="https://fonts.googleapis.com"/>' +
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin=""/>' +
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&amp;family=Spline+Sans+Mono:wght@300;400;500;600;700&amp;display=swap"/>';

const HEAD_INJECT =
  THEME_INLINE +
  FONT_LINKS +
  '<link rel="stylesheet" href="PATH_PREFIXassets/css/axiom-overrides.css"/>';

const THEME_SCRIPT =
  '<script src="PATH_PREFIXassets/js/axiom-theme.js" defer></script>';
const NAV_SCRIPT =
  '<script src="PATH_PREFIXassets/js/axiom-nav.js" defer></script>';
const MARQUEE_SCRIPT =
  '<script src="PATH_PREFIXassets/js/axiom-marquee.js" defer></script>';
const HERO_GRID_SCRIPT =
  '<script src="PATH_PREFIXassets/js/axiom-hero-grid.js" defer></script>';

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'hts-cache', 'scripts', 'assets'].includes(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, files);
    else if (ent.name.endsWith('.html')) files.push(p);
  }
  return files;
}

function depthPrefix(filePath) {
  const rel = path.relative(ROOT, filePath);
  const depth = rel.split(path.sep).length - 1;
  return depth === 0 ? '' : '../'.repeat(depth);
}

function patchHeaderLogo(html, prefix) {
  const logoDark = `${prefix}_next/logo_text_dark24c3.svg`;
  const logoLight = `${prefix}_next/logo_text_light.svg`;
  const home = prefix ? `${prefix}index.html` : 'index.html';

  const singleLogoRe =
    /<a aria-label="Axiom Chain home" class="flex items-center" href="[^"]*"><img alt="Axiom Chain"[^>]*src="[^"]*logo_text[^"]*"[^>]*\/><\/a>/;

  const dualLogo = `<a aria-label="Axiom Chain home" class="flex items-center" href="${home}"><img alt="Axiom Chain" width="438" height="116" decoding="async" class="axiom-site-logo-dark h-8 min-w-28 w-auto sm:h-10 sm:min-w-32 md:h-8 md:min-w-28 lg:h-12 lg:min-w-36" src="${logoDark}"/><img alt="Axiom Chain" width="438" height="116" decoding="async" class="axiom-site-logo-light h-8 min-w-28 w-auto sm:h-10 sm:min-w-32 md:h-8 md:min-w-28 lg:h-12 lg:min-w-36" src="${logoLight}"/></a>`;

  if (singleLogoRe.test(html)) {
    html = html.replace(singleLogoRe, dualLogo);
  }

  return html;
}

function patchFooterLogo(html, prefix) {
  const logoDark = `${prefix}_next/logo_text_dark24c3.svg`;
  const logoLight = `${prefix}_next/logo_text_light.svg`;
  const home = prefix ? `${prefix}index.html` : 'index.html';

  const footerSvgRe =
    /<a aria-label="Axiom Chain home" class="block" href="[^"]*"><svg width="438" height="116"[\s\S]*?<\/svg><\/a>/;

  const footerImgRe =
    /<a aria-label="Axiom Chain home" class="block" href="[^"]*"><img alt="Axiom Chain"[^>]*class="axiom-site-logo-(?:dark|light)[^"]*"[^>]*\/><img alt="Axiom Chain"[^>]*class="axiom-site-logo-(?:dark|light)[^"]*"[^>]*\/><\/a>/;

  const footerLogo = `<a aria-label="Axiom Chain home" class="block" href="${home}"><img alt="Axiom Chain" width="438" height="116" decoding="async" class="axiom-site-logo-dark h-auto w-full max-w-40 sm:max-w-52" src="${logoDark}"/><img alt="Axiom Chain" width="438" height="116" decoding="async" class="axiom-site-logo-light h-auto w-full max-w-40 sm:max-w-52" src="${logoLight}"/></a>`;

  if (footerSvgRe.test(html)) {
    html = html.replace(footerSvgRe, footerLogo);
  } else if (!footerImgRe.test(html) && html.includes('M112 90V20H128V76H157V90H112')) {
    html = html.replace(
      /<a aria-label="Axiom Chain home" class="block" href="[^"]*">[\s\S]*?M112 90V20H128V76H157V90H112[\s\S]*?<\/a>/,
      footerLogo
    );
  }

  return html;
}

let count = 0;
let footerCount = 0;
for (const file of walk(ROOT)) {
  let html = fs.readFileSync(file, 'utf8');
  const prefix = depthPrefix(file);
  const before = html;

  html = patchHeaderLogo(html, prefix);
  html = patchFooterLogo(html, prefix);
  if (html !== before) footerCount++;

  if (!html.includes('axiom-overrides.css')) {
    const inject = HEAD_INJECT.replace(/PATH_PREFIX/g, prefix);
    html = html.replace(/<head>/i, `<head>${inject}`);
  }

  if (!html.includes('axiom-theme.js')) {
    const inject = THEME_SCRIPT.replace(/PATH_PREFIX/g, prefix);
    html = html.replace(/<\/body>/i, `${inject}</body>`);
  }

  if (!html.includes('axiom-nav.js')) {
    const inject = NAV_SCRIPT.replace(/PATH_PREFIX/g, prefix);
    html = html.replace(/<\/body>/i, `${inject}</body>`);
  }

  if (!html.includes('axiom-marquee.js')) {
    const inject = MARQUEE_SCRIPT.replace(/PATH_PREFIX/g, prefix);
    html = html.replace(/<\/body>/i, `${inject}</body>`);
  }

  if (!html.includes('axiom-hero-grid.js')) {
    const inject = HERO_GRID_SCRIPT.replace(/PATH_PREFIX/g, prefix);
    html = html.replace(/<\/body>/i, `${inject}</body>`);
  }

  html = html.replace(/style="opacity:0"/g, 'style="opacity:1"');

  fs.writeFileSync(file, html, 'utf8');
  count++;
}

console.log(`Patched ${count} HTML files (${footerCount} with footer logo). Logos copied to _next/.`);
