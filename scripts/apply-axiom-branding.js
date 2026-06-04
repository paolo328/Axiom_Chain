const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

/** Strip remaining Labrys-era copy from mirrored HTML (incl. JSON-LD). */
const TEXT_REBRAND = [
  [/<!-- Mirrored from[\s\S]*?-->\n?/g, ''],
  [/Labrys — Blockchain &amp; AI Product Studio/g, 'Axiom Chain — Blockchain &amp; AI Engineering'],
  [/Labrys — Blockchain & AI Product Studio/g, 'Axiom Chain — Blockchain & AI Engineering'],
  [/Labrys Group/g, 'Axiom Chain LLC'],
  [/Labrys LLC/g, 'Axiom Chain LLC'],
  [/© Labrys/g, '© Axiom Chain LLC'],
  [/Building with Labrys/gi, 'Building with Axiom Chain'],
  [/from Labrys:/gi, 'from Axiom Chain:'],
  [/Labrys built/gi, 'Axiom Chain built'],
  [/Labrys Turns/gi, 'Axiom Chain milestone'],
  [/CEO Lachlan Feeney/gi, 'the Axiom Chain team'],
  [/Lachlan Feeney/g, 'Axiom Chain team'],
  [/Lachlan's/g, "Axiom Chain team's"],
  [/\\u003cstrong\\u003eLachlan\\u003c\/strong\\u003e/g, '\\u003cstrong\\u003eAxiom Chain team\\u003c/strong\\u003e'],
  [/"lachlan-feeney"/g, '"joshua-roy"'],
  [/lachlan-feeney/g, 'joshua-roy'],
  [/\/team\/lachlan-feeney/g, '/team/joshua-roy'],
  [/"founder":\{"@type":"Person","name":"Axiom Chain team"\},?/g, ''],
  [/https:\/\/github\.com\/Axiom Chain-Group/g, 'https://github.com/axiom-chain'],
  [/info@\./g, 'info@axiomchain.com'],
  [/https:\/\/careers-page\.com\/labrys/gi, 'contact.html'],
  [/https:\/\/x\.com\/labrys_io/gi, 'https://x.com/AxiomChainLLC'],
  [/https:\/\/www\.linkedin\.com\/company\/labrys-io/gi, 'https://www.linkedin.com/company/axiom-chain'],
  [/@labrys_io/gi, '@AxiomChainLLC'],
  [/https?:\/\/labrys\.io\/?/gi, ''],
  [/labrys\.io/gi, ''],
  [/Axiom Chain'/g, "Axiom Chain's"],
  [/Axiom Chain'ss/g, "Axiom Chain's"],
  [/Axiom Chain Turns 6/g, 'Six years at Axiom Chain'],
  [/Axiom Chain Turns/g, 'Six years at Axiom Chain'],
  [/Axiom Chain team, our CEO/gi, 'our CEO'],
  [/Axiom Chain team \(Axiom Chain CEO\)/gi, 'our CEO'],
  [/During his address, Axiom Chain team, our CEO/gi, 'During his address, our CEO'],
  [/Axiom Chain team \(Axiom Chain CEO\) shared/gi, 'Our CEO shared'],
  [/Axiom Chain milestone/g, 'Six years at Axiom Chain'],
  [/Axiom Chain, a leading Web3/gi, 'Axiom Chain, a blockchain and AI engineering studio'],
  [/Australia&#x27;s leading Web3 development company Axiom Chain/gi, 'Axiom Chain'],
  [/Australia's leading Web3 development company Axiom Chain/gi, 'Axiom Chain'],
  [/Labrys/g, 'Axiom Chain'],
];

function applyTextRebrand(html) {
  for (const [from, to] of TEXT_REBRAND) {
    html = html.replace(from, to);
  }
  return fixInsightCategoryTags(html);
}

/** Labrys used the company name as the card tag; use topic-style labels like other insights. */
function fixInsightCategoryTags(html) {
  const cardTags = {
    'why-we-refreshed-our-brand': 'Culture — Company',
    'six-years-in': 'Culture — Company',
  };

  for (const [slug, tag] of Object.entries(cardTags)) {
    html = html.replace(
      new RegExp(
        `(href="(?:\\.\\./)?insights/${slug}\\.html"[\\s\\S]*?<p class="mb-2 text-xs font-bold uppercase tracking-widest text-white/70">)Axiom Chain(<\\/p>)`,
        'g'
      ),
      `$1${tag}$2`
    );
  }

  if (html.includes('why-we-refreshed-our-brand')) {
    html = html.replace(
      /property="article:section" content="Axiom Chain"/g,
      'property="article:section" content="Culture"'
    );
    html = html.replace(
      /property="article:tag" content="Axiom Chain"/g,
      'property="article:tag" content="Culture — Company"'
    );
  }

  return html;
}

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
const HOME_DATA_SCRIPT =
  '<script src="PATH_PREFIXassets/js/axiom-home-data.js"></script>';
const HOME_SCRIPT =
  '<script src="PATH_PREFIXassets/js/axiom-home.js" defer></script>';
const ACCORDION_SCRIPT =
  '<script src="PATH_PREFIXassets/js/axiom-accordion.js" defer></script>';

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

  const headerDualRe =
    /<a aria-label="Axiom Chain home" class="flex items-center" href="[^"]*"><img alt="Axiom Chain"[^>]*class="axiom-site-logo-dark[^"]*"[^>]*\/><img alt="Axiom Chain"[^>]*class="axiom-site-logo-light[^"]*"[^>]*\/><\/a>/;

  const dualLogo = `<a aria-label="Axiom Chain home" class="flex items-center" href="${home}"><img alt="Axiom Chain" width="220" height="68" decoding="async" class="axiom-site-logo-dark axiom-site-lockup" src="${logoDark}"/><img alt="Axiom Chain" width="220" height="68" decoding="async" class="axiom-site-logo-light axiom-site-lockup" src="${logoLight}"/></a>`;

  if (headerDualRe.test(html)) {
    html = html.replace(headerDualRe, dualLogo);
  } else if (singleLogoRe.test(html)) {
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

  const footerLogo = `<a aria-label="Axiom Chain home" class="block" href="${home}"><img alt="Axiom Chain" width="220" height="68" decoding="async" class="axiom-site-logo-dark axiom-site-lockup" src="${logoDark}"/><img alt="Axiom Chain" width="220" height="68" decoding="async" class="axiom-site-logo-light axiom-site-lockup" src="${logoLight}"/></a>`;

  if (footerSvgRe.test(html)) {
    html = html.replace(footerSvgRe, footerLogo);
  } else if (footerImgRe.test(html)) {
    html = html.replace(footerImgRe, footerLogo);
  } else if (html.includes('M112 90V20H128V76H157V90H112')) {
    html = html.replace(
      /<a aria-label="Axiom Chain home" class="block" href="[^"]*">[\s\S]*?M112 90V20H128V76H157V90H112[\s\S]*?<\/a>/,
      footerLogo
    );
  }

  return html;
}

let count = 0;
let footerCount = 0;

require('child_process').execSync('node "' + path.join(__dirname, 'remove-labrys.js') + '"', {
  stdio: 'inherit',
});
require('child_process').execSync('node "' + path.join(__dirname, 'extract-home-data.js') + '"', {
  stdio: 'inherit',
});
require('child_process').execSync('node "' + path.join(__dirname, 'extract-podium-images.js') + '"', {
  stdio: 'inherit',
});
require('child_process').execSync('node "' + path.join(__dirname, 'generate-brand-refresh-images.js') + '"', {
  stdio: 'inherit',
});
require('child_process').execSync('node "' + path.join(__dirname, 'fix-insight-hero-images.js') + '"', {
  stdio: 'inherit',
});
require('child_process').execSync('node "' + path.join(__dirname, 'fix-prose-images.js') + '"', {
  stdio: 'inherit',
});
require('child_process').execSync('node "' + path.join(__dirname, 'rebrand-labrys-images.js') + '"', {
  stdio: 'inherit',
});
require('child_process').execSync('node "' + path.join(__dirname, 'cleanup-images.js') + '"', {
  stdio: 'inherit',
});
require('child_process').execSync('node "' + path.join(__dirname, 'restore-editorial-insight-images.js') + '"', {
  stdio: 'inherit',
});
require('child_process').execSync('node "' + path.join(__dirname, 'fix-insights-images.js') + '"', {
  stdio: 'inherit',
});

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

  if (!html.includes('axiom-accordion.js')) {
    const inject = ACCORDION_SCRIPT.replace(/PATH_PREFIX/g, prefix);
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

  if (html.includes('axiom-home.js') && html.includes('axiom-home-data.js')) {
    html = html.replace(
      /<script src="[^"]*axiom-home-data\.js"><\/script>\s*<script src="[^"]*axiom-home\.js" defer><\/script>/,
      (m) => {
        const data = m.match(/<script src="([^"]*axiom-home-data\.js)"><\/script>/)[1];
        const home = m.match(/<script src="([^"]*axiom-home\.js)" defer><\/script>/)[1];
        return `<script src="${data}"></script><script src="${home}" defer></script>`;
      }
    );
  } else {
    if (!html.includes('axiom-home-data.js')) {
      const inject = HOME_DATA_SCRIPT.replace(/PATH_PREFIX/g, prefix);
      html = html.replace(/<\/body>/i, `${inject}</body>`);
    }
    if (!html.includes('axiom-home.js')) {
      const inject = HOME_SCRIPT.replace(/PATH_PREFIX/g, prefix);
      html = html.replace(/<\/body>/i, `${inject}</body>`);
    }
  }

  html = html.replace(/style="opacity:0"/g, 'style="opacity:1"');

  html = applyTextRebrand(html);

  fs.writeFileSync(file, html, 'utf8');
  count++;
}

console.log(`Patched ${count} HTML files (${footerCount} with footer logo). Logos copied to _next/.`);
