const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'hts-cache', 'scripts'].includes(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, files);
    else if (ent.name.endsWith('.html')) files.push(p);
  }
  return files;
}

let n = 0;
for (const f of walk(ROOT)) {
  let html = fs.readFileSync(f, 'utf8');
  if (!html.includes('_next/_next')) continue;
  html = html.replace(/_next\/_next\//g, '_next/');
  html = html.replace(/labrys\.io/g, '.');
  fs.writeFileSync(f, html);
  n++;
}
console.log('Fixed', n, 'files');
