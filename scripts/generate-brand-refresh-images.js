/**
 * Editorial desk-style insight images for "Why we refreshed our brand"
 * (matches original Labrys card photo layout — sketch, card, tools — with Axiom branding).
 *
 * Run: node scripts/generate-brand-refresh-images.js
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const BANNER_W = 1915;
const BANNER_H = 821;
const CARD_W = 1536;
const CARD_H = 1024;

function loadSvg(name) {
  return fs
    .readFileSync(path.join(ROOT, 'brand/logo', name), 'utf8')
    .replace(/<\?xml[^?]*\?>/, '')
    .replace(/font-family="system-ui[^"]*"/g, 'font-family="Manrope, ui-sans-serif, system-ui, sans-serif"');
}

function deskEditorialHtml(w, h) {
  const lockup = loadSvg('axiom-lockup-light.svg');
  const mark = loadSvg('axiom-mark-light.svg');
  const scale = w / CARD_W;

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
    <link rel="preconnect" href="https://fonts.googleapis.com"/>
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin=""/>
    <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700&amp;display=swap" rel="stylesheet"/>
    <style>
      * { box-sizing: border-box; }
      html, body { margin: 0; width: ${w}px; height: ${h}px; overflow: hidden; }
      body {
        font-family: Manrope, ui-sans-serif, system-ui, sans-serif;
        background: #1a1410;
      }
      .desk {
        position: absolute; inset: 0;
        background:
          radial-gradient(ellipse 90% 70% at 18% 8%, rgba(255,248,235,0.22) 0%, transparent 55%),
          linear-gradient(155deg, #3d2f26 0%, #2a211b 38%, #1f1814 100%);
      }
      .grain {
        position: absolute; inset: 0; opacity: 0.08;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
      }
      .sheet {
        position: absolute;
        left: ${Math.round(8 * scale)}%;
        top: ${Math.round(18 * scale)}%;
        width: ${Math.round(52 * scale)}%;
        height: ${Math.round(58 * scale)}%;
        background: #f7f4ef;
        border-radius: 4px;
        box-shadow: 0 24px 60px rgba(0,0,0,0.35);
        transform: rotate(-7deg);
        overflow: hidden;
      }
      .sheet::before {
        content: "";
        position: absolute; inset: 0;
        background: linear-gradient(135deg, rgba(255,255,255,0.55) 0%, transparent 42%);
      }
      .sketch {
        position: absolute;
        left: 14%; top: 16%;
        width: 58%; height: 68%;
        opacity: 0.55;
      }
      .sketch svg { width: 100%; height: 100%; display: block; }
      .trace {
        position: absolute;
        left: 22%; top: 24%;
        width: 46%; height: 52%;
        border: 1.5px solid rgba(120,120,120,0.35);
        border-radius: 2px;
        transform: rotate(4deg);
        background: rgba(255,255,255,0.08);
      }
      .card {
        position: absolute;
        right: ${Math.round(10 * scale)}%;
        top: ${Math.round(22 * scale)}%;
        width: ${Math.round(34 * scale)}%;
        aspect-ratio: 1;
        background: linear-gradient(145deg, #12131a, #07080d);
        border-radius: 14px;
        box-shadow: 0 28px 70px rgba(0,0,0,0.45);
        display: flex; align-items: center; justify-content: center;
        padding: 10%;
        transform: rotate(8deg);
      }
      .card svg { width: 100%; height: auto; display: block; }
      .pencil {
        position: absolute;
        left: ${Math.round(6 * scale)}%;
        bottom: ${Math.round(16 * scale)}%;
        width: ${Math.round(220 * scale)}px;
        height: ${Math.round(18 * scale)}px;
        background: linear-gradient(90deg, #f0c987 0%, #f0c987 72%, #111 72%, #111 82%, #c9cdd3 82%);
        border-radius: 3px;
        transform: rotate(-18deg);
        box-shadow: 0 8px 18px rgba(0,0,0,0.25);
      }
      .ruler {
        position: absolute;
        left: ${Math.round(4 * scale)}%;
        bottom: ${Math.round(8 * scale)}%;
        width: ${Math.round(280 * scale)}px;
        height: ${Math.round(34 * scale)}px;
        border: 1px solid rgba(180,180,180,0.35);
        background: linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04));
        transform: rotate(-8deg);
      }
      .mark-corner {
        position: absolute;
        right: ${Math.round(6 * scale)}%;
        bottom: ${Math.round(10 * scale)}%;
        width: ${Math.round(120 * scale)}px;
        opacity: 0.16;
        transform: rotate(-12deg);
      }
      .mark-corner svg { width: 100%; height: auto; display: block; }
    </style></head><body>
    <div class="desk"><div class="grain"></div>
      <div class="sheet">
        <div class="sketch">${mark}</div>
        <div class="trace"></div>
      </div>
      <div class="card">${lockup}</div>
      <div class="pencil"></div>
      <div class="ruler"></div>
      <div class="mark-corner">${mark}</div>
    </div>
  </body></html>`;
}

async function renderScene(outPath, w, h) {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: w, height: h },
    deviceScaleFactor: 1,
  });
  await page.setContent(deskEditorialHtml(w, h), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  await page.screenshot({ path: outPath, type: 'jpeg', quality: 93 });
  await browser.close();
}

function saveWebpFromJpeg(jpegPath, webpPath) {
  const { execSync } = require('child_process');
  execSync(
    `python -c "from PIL import Image; im=Image.open(r'${jpegPath.replace(/\\/g, '/')}').convert('RGB'); im.save(r'${webpPath.replace(/\\/g, '/')}', 'WEBP', quality=88)"`,
    { stdio: 'pipe' }
  );
}

async function main() {
  const webp = path.join(ROOT, 'images/blog/why-we-refreshed-our-brand.webp');
  const bannerJpg = path.join(ROOT, '_next/why-we-refreshed-our-brand175f.jpg');
  const cardJpg = path.join(ROOT, '_next/why-we-refreshed-our-brand-card1d71.jpg');
  const cardWebp = path.join(ROOT, 'images/blog/generated/why-we-refreshed-our-brand-card.webp');

  console.log('Rendering editorial desk hero…');
  await renderScene(bannerJpg, BANNER_W, BANNER_H);
  saveWebpFromJpeg(bannerJpg, webp);

  console.log('Rendering editorial desk card…');
  await renderScene(cardJpg, CARD_W, CARD_H);
  fs.mkdirSync(path.dirname(cardWebp), { recursive: true });
  saveWebpFromJpeg(cardJpg, cardWebp);

  console.log('Updated:');
  console.log(' -', path.relative(ROOT, webp));
  console.log(' -', path.relative(ROOT, bannerJpg));
  console.log(' -', path.relative(ROOT, cardJpg));
  console.log(' -', path.relative(ROOT, cardWebp));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
