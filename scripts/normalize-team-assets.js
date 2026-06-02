const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const chunksDir = path.join(ROOT, '_next', 'static', 'chunks');
const localChunks = new Set(fs.readdirSync(chunksDir));

function resolveChunk(name) {
  if (localChunks.has(name)) return name;
  const alt = name.replace(/~/g, '_');
  if (localChunks.has(alt)) return alt;
  const withD07a = alt.endsWith('d07a') ? alt : alt.replace(/\.(js|css)$/, (m) => m === '.js' ? 'd07a.js' : 'd07a.css');
  if (localChunks.has(withD07a)) return withD07a;
  // fuzzy: find file starting with same prefix
  const base = alt.split('.')[0].slice(0, 8);
  const hit = [...localChunks].find((f) => f.startsWith(base));
  return hit || name;
}

let html = fs.readFileSync(path.join(ROOT, 'team.html'), 'utf8');

html = html.replace(/_next\/static\/(?:chunks|media)\/([^"?]+)/g, (full, file) => {
  const resolved = resolveChunk(file);
  return full.replace(file, resolved);
});

html = html.replace(/~mkja6u/g, '_mkja6ud07a');
html = html.replace(/0ki-vl_mkja6u/g, '0ki-vl_mkja6ud07a');
html = html.replace(/17192x85wofc\.\.css/g, '17192x85wofc.d07a.css');
html = html.replace(/0ouves966ytwu\.css/g, '0ouves966ytwud07a.css');
html = html.replace(/0kho-wj7-y-w1\.woff2/g, '0kho-wj7-y-w1d07a.woff2');

fs.writeFileSync(path.join(ROOT, 'team.html'), html);
console.log('Normalized team.html assets');
