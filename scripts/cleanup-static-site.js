/**
 * Remove useless static-site bloat: Next.js flight payloads, dead script tags,
 * temp screenshots, node_modules, and unreferenced chunk JS.
 *
 * Run: node scripts/cleanup-static-site.js
 * (extract-home-data.js runs first when invoked via apply-axiom-branding.js)
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const KEEP_CHUNKS = new Set(['0z483dkqssm4rd07a.js']);

function walkHtml(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', 'scripts'].includes(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkHtml(p, files);
    else if (ent.name.endsWith('.html')) files.push(p);
  }
  return files;
}

function stripHtmlBloat(html) {
  html = html.replace(/<!-- Mirrored from[\s\S]*?-->\n?/g, '');

  html = html.replace(
    /<script(?:\s[^>]*)?>self\.__next_f\.push\([\s\S]*?\)<\/script>/gi,
    ''
  );
  html = html.replace(
    /<script(?:\s[^>]*)?>\(self\.__next_f=self\.__next_f\|\|\[\]\)\.push\([\s\S]*?\)<\/script>/gi,
    ''
  );

  html = html.replace(
    /<script[^>]*\ssrc="(?:\.\.\/)*_next\/static\/chunks\/[^"]+\.js"[^>]*>\s*<\/script>/gi,
    ''
  );
  html = html.replace(
    /<link[^>]*rel="preload"[^>]*as="script"[^>]*>/gi,
    ''
  );
  html = html.replace(
    /<link[^>]*href="(?:\.\.\/)*_next\/static\/chunks\/[^"]+\.js"[^>]*>/gi,
    ''
  );

  return html;
}

function collectReferencedAssets(htmlFiles) {
  const refs = new Set();
  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, 'utf8');
    for (const m of html.matchAll(
      /(?:href|src)="((?:\.\.\/)*_next\/[^"?#]+)/gi
    )) {
      let u = m[1].split('?')[0];
      while (u.startsWith('../')) u = u.slice(3);
      refs.add(u.replace(/^\//, ''));
    }
  }
  return refs;
}

function rm(target, reason) {
  if (!fs.existsSync(target)) return false;
  fs.rmSync(target, { recursive: true, force: true });
  console.log('Removed', path.relative(ROOT, target), `(${reason})`);
  return true;
}

function main() {
  let htmlCount = 0;
  let savedBytes = 0;

  for (const ent of fs.readdirSync(ROOT)) {
    if (/^tmp-/i.test(ent)) rm(path.join(ROOT, ent), 'debug screenshot');
  }

  rm(path.join(ROOT, 'node_modules'), 'dev-only Playwright install');

  const htmlFiles = walkHtml(ROOT);
  for (const file of htmlFiles) {
    const before = fs.readFileSync(file, 'utf8');
    const after = stripHtmlBloat(before);
    if (after !== before) {
      savedBytes += before.length - after.length;
      fs.writeFileSync(file, after, 'utf8');
      htmlCount++;
    }
  }

  const refs = collectReferencedAssets(htmlFiles);
  const chunksDir = path.join(ROOT, '_next/static/chunks');
  if (fs.existsSync(chunksDir)) {
    for (const name of fs.readdirSync(chunksDir)) {
      if (!name.endsWith('.js')) continue;
      const rel = '_next/static/chunks/' + name;
      if (KEEP_CHUNKS.has(name)) continue;
      if (!refs.has(rel)) {
        rm(path.join(chunksDir, name), 'unreferenced Next chunk');
      }
    }
  }

  for (const file of htmlFiles) {
    let html = fs.readFileSync(file, 'utf8');
    let changed = false;
    html = html.replace(
      /<link[^>]*href="(?:\.\.\/)*_next\/[^"]+"[^>]*>/gi,
      (tag) => {
        const href = tag.match(/href="([^"]+)"/i);
        if (!href) return tag;
        let rel = href[1].split('?')[0];
        const prefix = file.includes(path.sep)
          ? '../'.repeat(path.relative(ROOT, path.dirname(file)).split(path.sep).length)
          : '';
        while (rel.startsWith('../')) rel = rel.slice(3);
        if (rel.startsWith(prefix)) rel = rel.slice(prefix.length);
        const abs = path.join(ROOT, rel.replace(/\//g, path.sep));
        if (!fs.existsSync(abs)) {
          changed = true;
          return '';
        }
        return tag;
      }
    );
    if (changed) fs.writeFileSync(file, html, 'utf8');
  }

  execSync('node "' + path.join(__dirname, 'cleanup-images.js') + '"', {
    stdio: 'inherit',
    cwd: ROOT,
  });

  console.log(
    `Static cleanup complete — trimmed ${htmlCount} HTML file(s), saved ~${Math.round(savedBytes / 1024)} KB.`
  );
}

main();
