/**
 * Download full-resolution podium PNGs from labrys.io (256×256).
 * Run: node scripts/extract-podium-images.js
 */
const fs = require('fs');
const https = require('https');
const path = require('path');

const root = path.join(__dirname, '..');
const chunkPath = path.join(root, '_next/static/chunks/0z483dkqssm4rd07a.js');
const outDir = path.join(root, 'images/logos/podium');
const baseUrl = 'https://labrys.io/images/logos/podium/';

if (!fs.existsSync(chunkPath)) {
  console.error('Chunk not found:', chunkPath);
  process.exit(1);
}

const chunk = fs.readFileSync(chunkPath, 'utf8');
const names = [
  ...new Set([...chunk.matchAll(/images\/logos\/podium\/([a-z0-9-]+\.png)/g)].map((m) => m[1])),
].sort();

fs.mkdirSync(outDir, { recursive: true });

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`${url} → HTTP ${res.statusCode}`));
          return;
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          fs.writeFileSync(dest, Buffer.concat(chunks));
          resolve(dest);
        });
      })
      .on('error', reject);
  });
}

(async () => {
  let ok = 0;
  for (const name of names) {
    const dest = path.join(outDir, name);
    try {
      await download(baseUrl + name, dest);
      ok++;
    } catch (err) {
      console.warn('Skip', name, '-', err.message);
    }
  }
  console.log('Downloaded', ok, 'of', names.length, 'podium images to', path.relative(root, outDir));
})();
