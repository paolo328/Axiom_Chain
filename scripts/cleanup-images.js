/**
 * Remove unreferenced images, debug exports, and known Labrys-only assets.
 *
 * Run: node scripts/cleanup-images.js
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');

const ALWAYS_DELETE = [
  '_next/six-years-in6cdd.jpg',
];

function collectHtmlRefs() {
  const refs = new Set();
  function walk(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      if (['node_modules', '.git', 'scripts'].includes(ent.name)) continue;
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(p);
      else if (ent.name.endsWith('.html')) {
        const html = fs.readFileSync(p, 'utf8');
        for (const m of html.matchAll(
          /(?:src|href|imageSrcSet|content)="([^"]+\.(?:jpg|jpeg|png|webp|gif)[^"]*)"/gi
        )) {
          let u = m[1].split('?')[0].split(' ')[0].replace(/%2F/g, '/');
          if (u.startsWith('http')) continue;
          while (u.startsWith('../')) u = u.slice(3);
          refs.add(u.replace(/^\//, ''));
        }
        for (const m of html.matchAll(
          /(?:_next|images)\/[a-zA-Z0-9_./%-]+\.(?:webp|jpg|jpeg|png|gif)/g
        )) {
          refs.add(m[0]);
        }
      }
    }
  }
  walk(ROOT);
  return refs;
}

function gitBytes(rel) {
  try {
    return execSync(`git show "HEAD:${rel.replace(/\\/g, '/')}"`, {
      cwd: ROOT,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch {
    return null;
  }
}

function shouldDeleteOrphan(rel) {
  const base = path.basename(rel);
  if (/^six-years-in6cdd\./i.test(base)) return true;
  if (/card/i.test(base)) return false;
  if (!rel.startsWith('_next/')) return false;
  // Drop unused HTTrack banner duplicates (article pages use images/blog/*).
  if (/banner/i.test(base)) return true;
  // Drop stray icon/png assets not referenced anywhere.
  if (/\.png$/i.test(base) && !/logo|plan|build|assure|launch/i.test(base)) return true;
  return false;
}

function isJunkName(name) {
  return /^(check-|restore-|git-|git-tmp)/i.test(name);
}

function main() {
  const refs = collectHtmlRefs();
  let deleted = 0;

  function del(rel, reason) {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) return;
    fs.unlinkSync(abs);
    deleted++;
    console.log('Deleted', rel, `(${reason})`);
  }

  for (const rel of ALWAYS_DELETE) del(rel, 'Labrys-only orphan');

  for (const ent of fs.readdirSync(ROOT)) {
    if (isJunkName(ent)) del(ent, 'debug export');
  }

  const walkDelete = (dir) => {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      if (['node_modules', '.git', 'scripts', 'brand'].includes(ent.name)) continue;
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) walkDelete(p);
      else if (/\.(jpg|jpeg|png|webp|gif)$/i.test(ent.name)) {
        const rel = path.relative(ROOT, p).replace(/\\/g, '/');
        if (isJunkName(ent.name)) del(rel, 'debug export');
        else if (!refs.has(rel) && shouldDeleteOrphan(rel)) del(rel, 'unused duplicate');
      }
    }
  };

  walkDelete(ROOT);

  console.log(`Cleanup complete — removed ${deleted} file(s).`);
}

main();
