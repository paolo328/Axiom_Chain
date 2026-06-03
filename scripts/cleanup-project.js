/**
 * Remove HTTrack / Labrys leftovers and restore labrys.io-style Trusted By marquee.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const ROW1 = [
  ['Autonomous', 'autonomous.png'],
  ['Immutable', 'immutable.png'],
  ['Circle', 'circle.png'],
  ['Cloud9', 'cloud9.svg'],
  ['Downer', 'downer.svg'],
  ['Fjord Foundry', 'fjord-foundry.svg'],
  ['Hashlock', 'hashlock.svg'],
  ['LayerZero', 'layerzero.svg'],
  ['Liquifi', 'liquifi.png'],
  ['NZDD', 'nzdd.svg'],
  ['Pier Two', 'pier-two.svg'],
  ['Sunflower Land', 'sunflower-land.svg'],
  ['Swell', 'swell-network.svg'],
  ['Vana', 'vana.svg'],
  ['VPA Connect', 'vpa-connect.svg'],
];

const ROW2 = [
  ['Eclipse', 'eclipse.svg'],
  ['Fluidity', 'fluidity.svg'],
  ['MyShell', 'myshell.svg'],
  ['RockSolid', 'rock-solid.svg'],
  ['Sentient', 'sentient.svg'],
  ['Sweet', 'sweet.png'],
  ['Glue', 'glue.svg'],
  ['HLV', 'hlv.png'],
  ['Spekter', 'spekter-games.svg'],
  ['Superposition', 'superposition.svg'],
  ['The Deposit Holder', 'the-deposit-holder.svg'],
  ['Thirdweb', 'thirdweb.png'],
  ['Utila', 'utila.png'],
];

function logoCell([alt, file]) {
  const src = `images/logos/clients/${file}`;
  if (!fs.existsSync(path.join(ROOT, src))) return '';
  return `<div class="group/logo pointer-events-auto mr-10 flex h-10 w-auto max-w-[10rem] shrink-0 cursor-pointer items-center justify-center transition-colors duration-300 md:mr-16 md:h-12 md:max-w-[12rem] marquee-logo-dark-bg rounded-sm px-4 py-1"><img alt="${alt}" loading="lazy" width="192" height="48" decoding="async" class="h-full w-auto object-contain grayscale brightness-50 opacity-90 dark:brightness-90 dark:opacity-70 transition-all duration-300 group-hover/logo:grayscale-0 group-hover/logo:brightness-100 group-hover/logo:opacity-100 dark:invert" src="${src}"/></div>`;
}

function marqueeRow(logos) {
  const cells = logos.map(logoCell).filter(Boolean).join('');
  return `<div aria-hidden="true" class="group/marquee overflow-hidden pointer-events-none"><div class="flex w-max will-change-transform group-hover/marquee:[animation-play-state:paused]"><div class="flex w-max shrink-0 items-center">${cells}</div><div class="flex w-max shrink-0 items-center" aria-hidden="true">${cells}</div></div></div>`;
}

const TRUSTED_BLOCK = `<div class="flex flex-col gap-5 trusted-partners">
${marqueeRow(ROW1)}
${marqueeRow(ROW2)}
</div>`;

function rm(target) {
  if (!fs.existsSync(target)) return;
  fs.rmSync(target, { recursive: true, force: true });
  console.log('Removed', path.relative(ROOT, target));
}

// --- Delete junk ---
rm(path.join(ROOT, 'hts-cache'));
for (const f of ['hts-log.txt', 'backblue.gif', 'fade.gif']) {
  rm(path.join(ROOT, f));
}

const partnersDir = path.join(ROOT, 'images/logos/partners');
rm(partnersDir);

const brandDir = path.join(ROOT, 'brand/logo');
if (fs.existsSync(brandDir)) {
  for (const f of fs.readdirSync(brandDir)) {
    if (/^labrys-/i.test(f)) {
      rm(path.join(brandDir, f));
    }
  }
}

// Orphan HTTrack static folder
rm(path.join(ROOT, 'static'));

function walkHtml(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'scripts', 'hts-cache'].includes(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkHtml(p, files);
    else if (ent.name.endsWith('.html')) files.push(p);
  }
  return files;
}

function cleanHtml(html) {
  const reps = [
    [/@labrys_io/gi, '@AxiomChainLLC'],
    [/https?:\/\/labrys\.io\/?/gi, ''],
    [/labrys\.io/gi, ''],
    [/Brisbane-based product studio/gi, 'Blockchain and AI product engineering studio'],
    [/Suite 1, Level 1\/299 Coronation Dr Milton \(Brisbane\) QLD 4064 Australia/gi, ''],
    [/border-labrys/gi, 'border-foreground-10'],
    [/Labrys builds/gi, 'Axiom Chain builds'],
    [/Labrys/g, 'Axiom Chain'],
  ];
  for (const [from, to] of reps) html = html.replace(from, to);

  // Fix broken Next image srcSet — use direct client paths where possible
  html = html.replace(
    /srcSet="_next\/image\?url=%2Fimages%2Flogos%2Fclients%2F([^"&]+)[^"]*"[^>]*src="_next\/[^"]+"/g,
    (m, file) => {
      const decoded = decodeURIComponent(file.replace(/&amp;/g, '&').split('&')[0]);
      const src = `images/logos/clients/${decoded}`;
      if (fs.existsSync(path.join(ROOT, src))) {
        return `src="${src}"`;
      }
      return m;
    }
  );

  html = html.replace(
    /srcSet="_next\/image\?url=%2Fimages%2Flogos%2Fsvg%2F([^"&]+)[^"]*"[^>]*src="_next\/[^"]+"/g,
    (m, file) => {
      const src = `images/logos/clients/${decodeURIComponent(file)}`;
      if (fs.existsSync(path.join(ROOT, src))) return `src="${src}"`;
      return m;
    }
  );

  return html;
}

let htmlFiles = walkHtml(ROOT);
for (const file of htmlFiles) {
  let html = fs.readFileSync(file, 'utf8');
  html = cleanHtml(html);
  fs.writeFileSync(file, html, 'utf8');
}
console.log('Cleaned', htmlFiles.length, 'HTML files');

// Restore Trusted By on index only (matches https://labrys.io/)
const indexPath = path.join(ROOT, 'index.html');
let index = fs.readFileSync(indexPath, 'utf8');
const startMarker =
  '<p class="mb-5 text-center text-2xs font-bold uppercase tracking-[3px] text-foreground-25">Trusted By</p>';
const endMarker =
  '</div></div></div></div></section><section class="relative bg-background text-foreground py-(--content-padding)">';

const start = index.indexOf(startMarker);
const end = index.indexOf(endMarker);
if (start !== -1 && end !== -1) {
  const before = index.slice(0, start + startMarker.length);
  const after = index.slice(end);
  index = before + TRUSTED_BLOCK + after;
  fs.writeFileSync(indexPath, index, 'utf8');
  console.log('Restored Trusted By marquee on index.html');
}

console.log('Done.');
