/**
 * Remove Labrys branding: rename assets, fix paths, purge files.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const PATH_REPLACEMENTS = [
  [/labrys-brand-kit\.zip/gi, 'brand/axiom-brand-kit.zip'],
  [/brand\/logo\/labrys-lockup-dark/gi, 'brand/logo/axiom-lockup-dark'],
  [/brand\/logo\/labrys-lockup-light/gi, 'brand/logo/axiom-lockup-light'],
  [/brand\/logo\/labrys-mark-dark/gi, 'brand/logo/axiom-mark-dark'],
  [/brand\/logo\/labrys-mark-light/gi, 'brand/logo/axiom-mark-light'],
  [/brand\/logo\/labrys-wordmark-dark/gi, 'brand/logo/axiom-lockup-dark'],
  [/brand\/logo\/labrys-wordmark-light/gi, 'brand/logo/axiom-lockup-light'],
  [/_next\/labrys-lockup-dark[a-z0-9]*\.svg/gi, '_next/logo_text_dark24c3.svg'],
  [/_next\/labrys-lockup-light[a-z0-9]*\.svg/gi, '_next/logo_text_light.svg'],
  [/_next\/labrys-mark-dark[a-z0-9]*\.svg/gi, '_next/logo_darkf67a.svg'],
  [/_next\/labrys-mark-light[a-z0-9]*\.svg/gi, '_next/logo_lighte611.svg'],
  [/_next\/labrys-wordmark-dark[a-z0-9]*\.svg/gi, '_next/logo_text_dark24c3.svg'],
  [/_next\/labrys-wordmark-light[a-z0-9]*\.svg/gi, '_next/logo_text_light.svg'],
  [/building-with-labrys-/gi, 'building-with-axiom-chain-'],
  [/-labrys-v2-/gi, '-axiom-chain-v2-'],
  [/labrys-v2-/gi, 'axiom-chain-v2-'],
  [/%2Fbrand%2Flogo%2Flabrys-mark-dark\.svg/gi, '%2Fbrand%2Flogo%2Faxiom-mark-dark.svg'],
  [/%2Fbrand%2Flogo%2Flabrys-mark-light\.svg/gi, '%2Fbrand%2Flogo%2Faxiom-mark-light.svg'],
  [/%2Fbrand%2Flogo%2Flabrys-lockup-dark\.svg/gi, '%2Fbrand%2Flogo%2Faxiom-lockup-dark.svg'],
  [/%2Fbrand%2Flogo%2Flabrys-lockup-light\.svg/gi, '%2Fbrand%2Flogo%2Faxiom-lockup-light.svg'],
  [/%2Fbrand%2Flogo%2Flabrys-wordmark-dark\.svg/gi, '%2Fbrand%2Flogo%2Faxiom-lockup-dark.svg'],
  [/%2Fbrand%2Flogo%2Flabrys-wordmark-light\.svg/gi, '%2Fbrand%2Flogo%2Faxiom-lockup-light.svg'],
];

const TEXT_REPLACEMENTS = [
  [/labrys brand assets/gi, 'Axiom Chain brand assets'],
  [/labrys logo/gi, 'Axiom Chain logo'],
  [/labrys logos download/gi, 'Axiom Chain logos download'],
  [/labrys press kit/gi, 'Axiom Chain press kit'],
  [/labrys media kit/gi, 'Axiom Chain media kit'],
  [/labrys media resources/gi, 'Axiom Chain media resources'],
  [/labrys brand guidelines/gi, 'Axiom Chain brand guidelines'],
  [/labrys brand colours/gi, 'Axiom Chain brand colours'],
  [/https:\/\/careers-page\.com\/labrys/gi, 'contact.html'],
  [/https:\/\/x\.com\/labrys_io/gi, 'https://x.com/AxiomChainLLC'],
  [/https:\/\/www\.linkedin\.com\/company\/labrys-io/gi, 'https://www.linkedin.com/company/axiom-chain'],
  [/@labrys_io/gi, '@AxiomChainLLC'],
  [/labrys\.io/gi, ''],
  [/https?:\/\/labrys\.io\/?/gi, ''],
  [/Labrys/g, 'Axiom Chain'],
  [/labrys/g, 'axiom-chain'],
];

function walk(dir, files = [], extRe = /\.(html|js|css|md|json)$/) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'scripts', 'hts-cache'].includes(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, files, extRe);
    else if (extRe.test(ent.name)) files.push(p);
  }
  return files;
}

function renameLabrysFiles(dir) {
  if (!fs.existsSync(dir)) return;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      renameLabrysFiles(p);
      continue;
    }
    if (!/labrys/i.test(ent.name)) continue;
    const newName = ent.name
      .replace(/building-with-labrys-/gi, 'building-with-axiom-chain-')
      .replace(/-labrys-v2-/gi, '-axiom-chain-v2-')
      .replace(/labrys-v2-/gi, 'axiom-chain-v2-')
      .replace(/labrys/gi, 'axiom-chain');
    const dest = path.join(dir, newName);
    if (p !== dest && !fs.existsSync(dest)) {
      fs.renameSync(p, dest);
      console.log('Renamed', path.relative(ROOT, p), '->', newName);
    }
  }
}

function patchContent(content) {
  for (const [from, to] of PATH_REPLACEMENTS) {
    content = content.replace(from, to);
  }
  for (const [from, to] of TEXT_REPLACEMENTS) {
    content = content.replace(from, to);
  }
  return content;
}

// Rename image/asset files first
renameLabrysFiles(path.join(ROOT, 'images'));
renameLabrysFiles(path.join(ROOT, '_next'));

// Patch text files
const textFiles = walk(ROOT);
let patched = 0;
for (const file of textFiles) {
  let content = fs.readFileSync(file, 'utf8');
  if (!/labrys/i.test(content)) continue;
  const next = patchContent(content);
  if (next !== content) {
    fs.writeFileSync(file, next, 'utf8');
    patched++;
  }
}
console.log('Patched', patched, 'text files');

// Delete Labrys-only assets
const toDelete = [
  'brand/labrys-brand-kit.zip',
  '_next/labrys-lockup-darkdda6.svg',
  '_next/labrys-lockup-light5895.svg',
  '_next/labrys-mark-dark4794.svg',
  '_next/labrys-mark-light611e.svg',
  '_next/labrys-wordmark-dark19b9.svg',
  '_next/labrys-wordmark-light6937.svg',
];

for (const rel of toDelete) {
  const p = path.join(ROOT, rel);
  if (fs.existsSync(p)) {
    fs.unlinkSync(p);
    console.log('Deleted', rel);
  }
}

// Remove broken PNG download links from brand-assets (no axiom PNGs in brand/logo)
const brandAssets = path.join(ROOT, 'brand-assets.html');
if (fs.existsSync(brandAssets)) {
  let html = fs.readFileSync(brandAssets, 'utf8');
  html = html.replace(
    /<a href="brand\/logo\/axiom-[^"]+\.png" download=""[^>]*>[\s\S]*?PNG<\/a>/gi,
    ''
  );
  html = html.replace(/brand\/axiom-chain-brand-kit\.zip/gi, 'brand/logo/axiom-mark-dark.svg');
  html = html.replace(/brand\/axiom-brand-kit\.zip/gi, 'brand/logo/');
  fs.writeFileSync(brandAssets, html, 'utf8');
  console.log('Updated brand-assets.html');
}

// Create simple brand kit zip from axiom SVGs
const brandKit = path.join(ROOT, 'brand/axiom-brand-kit.zip');
try {
  const { execSync } = require('child_process');
  const logoDir = path.join(ROOT, 'brand/logo');
  if (fs.existsSync(logoDir)) {
    const cwd = path.join(ROOT, 'brand');
    if (fs.existsSync(brandKit)) fs.unlinkSync(brandKit);
    execSync('zip -r axiom-brand-kit.zip logo', { cwd, stdio: 'pipe' });
    console.log('Created brand/axiom-brand-kit.zip');
  }
} catch (e) {
  console.log('Skip zip (zip CLI unavailable):', e.message);
}

console.log('Labrys removal complete.');
