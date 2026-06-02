/**
 * Fix HTTrack-mirrored Labrys site for local use as Axiom Chain LLC.
 */
const fs = require('fs');
const path = require('path');

const SITE_ROOT = path.join(__dirname, '..');

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === '_data_image' || ent.name === 'hts-cache') continue;
      walk(p, files);
    } else if (ent.name.endsWith('.html')) files.push(p);
  }
  return files;
}

function depthPrefix(filePath) {
  const rel = path.relative(SITE_ROOT, filePath);
  const depth = rel.split(path.sep).length - 1;
  return depth === 0 ? '' : '../'.repeat(depth);
}

function fixHtml(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');
  const prefix = depthPrefix(filePath);

  // Remove HTTrack mirror comments
  html = html.replace(/<!-- Mirrored from[\s\S]*?-->\n?/g, '');

  // Rebrand (order matters)
  const replacements = [
    ['Labrys — Blockchain &amp; AI Product Studio', 'Axiom Chain — Blockchain &amp; AI Engineering'],
    ['Labrys — Blockchain & AI Product Studio', 'Axiom Chain — Blockchain & AI Engineering'],
    ['Labrys Group', 'Axiom Chain LLC'],
    ['labrys group', 'Axiom Chain LLC'],
    ['Labrys LLC', 'Axiom Chain LLC'],
    ['© Labrys', '© Axiom Chain LLC'],
    ['https://labrys.io/', prefix || './'],
    ['https://labrys.io', prefix ? prefix.replace(/\/$/, '') || '.' : '.'],
    ['http://labrys.io/', prefix || './'],
    ['http://labrys.io', '.'],
    ['//labrys.io/', prefix || './'],
    ['Building with Labrys', 'Building with Axiom Chain'],
    ['building with Labrys', 'building with Axiom Chain'],
    ['Labrys', 'Axiom Chain'],
  ];
  for (const [from, to] of replacements) {
    html = html.split(from).join(to);
  }

  // Fix absolute asset paths for local serving
  html = html.replace(/"\/_next\//g, `"${prefix}_next/`);
  html = html.replace(/'\/_next\//g, `'${prefix}_next/`);
  html = html.replace(/"\/images\//g, `"${prefix}images/`);
  html = html.replace(/'\/images\//g, `'${prefix}images/`);
  html = html.replace(/"\/brand\//g, `"${prefix}brand/`);
  html = html.replace(/url\(\/_next\//g, `url(${prefix}_next/`);
  html = html.replace(/url\(\/images\//g, `url(${prefix}images/`);

  // HTTrack broke Next chunk names (~ -> _)
  html = html.replace(/0j0a34vyo0~9v/g, '0j0a34vyo0_9vd07a');
  html = html.replace(/02o~blc33vl3l/g, '02o_blc33vl3ld07a');
  // Only fix wrong static/chunks paths (not already under _next/)
  html = html.replace(/(?<!_next\/)static\/chunks\//g, '_next/static/chunks/');
  html = html.replace(/_next\/_next\//g, '_next/');

  // Fix _next/image optimizer URLs -> direct image paths
  html = html.replace(
    /\/_next\/image\?url=([^&"'\s]+)(?:&[^"'\s]*)?/g,
    (_, enc) => {
      try {
        const decoded = decodeURIComponent(enc);
        const imgPath = decoded.startsWith('/') ? decoded.slice(1) : decoded;
        return prefix + imgPath;
      } catch {
        return prefix + 'images/placeholder.webp';
      }
    }
  );

  // Broken data:image hrefs (HTTrack treated as links)
  html = html.replace(/href="[^"]*data:image[^"]*"/gi, 'href="#"');
  html = html.replace(/href='[^']*data:image[^']*'/gi, "href='#'");

  // Broken _data_image blur placeholders in inline styles
  html = html.replace(
    /background-image:url\([^)]*_data_image[^)]*\)/gi,
    'background-image:none'
  );
  html = html.replace(/src="[^"]*_data_image[^"]*"/gi, 'src="#"');
  html = html.replace(/href="[^"]*_data_image[^"]*"/gi, 'href="#"');

  // Strip query strings from local chunk/css paths (optional, helps consistency)
  html = html.replace(
    /((?:href|src)="(?:\.\.\/)*_next\/[^"?]+)\?[^"]*"/g,
    '$1"'
  );

  fs.writeFileSync(filePath, html, 'utf8');
}

function removeDataImageDirs(dir) {
  if (!fs.existsSync(dir)) return;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === '_data_image') {
        fs.rmSync(p, { recursive: true, force: true });
        console.log('Removed', p);
      } else {
        removeDataImageDirs(p);
      }
    }
  }
}

const files = walk(SITE_ROOT);
console.log(`Processing ${files.length} HTML files...`);
for (const f of files) fixHtml(f);
removeDataImageDirs(SITE_ROOT);
console.log('Done.');
