/**
 * Replace insight images that still show Labrys branding with Axiom Chain visuals.
 *
 * Run: node scripts/rebrand-labrys-images.js
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');

function loadSvg(name) {
  return fs
    .readFileSync(path.join(ROOT, 'brand/logo', name), 'utf8')
    .replace(/<\?xml[^?]*\?>/, '')
    .replace(/font-family="system-ui[^"]*"/g, 'font-family="Manrope, ui-sans-serif, system-ui, sans-serif"');
}

function fontsHead() {
  return `<link rel="preconnect" href="https://fonts.googleapis.com"/>
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin=""/>
    <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&amp;display=swap" rel="stylesheet"/>`;
}

function baseStyle(w, h) {
  return `* { box-sizing: border-box; }
    html, body { margin: 0; width: ${w}px; height: ${h}px; overflow: hidden; }
    body { font-family: Manrope, ui-sans-serif, system-ui, sans-serif; background: #0b0c12; }`;
}

function anniversaryHeroHtml(w, h) {
  const lockup = loadSvg('axiom-lockup-light.svg');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>${fontsHead()}<style>
    ${baseStyle(w, h)}
    .wrap { position: absolute; inset: 0; background: radial-gradient(circle at 78% 58%, rgba(124,58,237,0.35), transparent 42%), #050508; }
    .title { position: absolute; left: 8%; top: 10%; font-size: ${Math.round(w * 0.055)}px; font-weight: 800; letter-spacing: 0.32em; color: transparent;
      -webkit-text-stroke: 1.5px rgba(0,239,159,0.85); text-transform: uppercase; }
    .pill { position: absolute; left: 8%; bottom: 14%; width: 72%; height: 42%; border-radius: 28px;
      background: linear-gradient(135deg, #00ef9f 0%, #00b877 55%, #059669 100%);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 24px 60px rgba(0,239,159,0.18); }
    .pill span { font-size: ${Math.round(w * 0.11)}px; font-weight: 800; color: #050508; letter-spacing: 0.06em; }
    .logo { position: absolute; right: 6%; top: 18%; width: 34%; opacity: 0.95; }
    .logo svg { width: 100%; height: auto; display: block; }
    .orb { position: absolute; right: 0; top: 8%; width: 46%; height: 72%; border-radius: 50%;
      background: radial-gradient(circle, rgba(124,58,237,0.55), rgba(0,239,159,0.12) 52%, transparent 72%); filter: blur(8px); }
  </style></head><body><div class="wrap">
    <div class="orb"></div>
    <div class="title">Axiom Chain</div>
    <div class="logo">${lockup}</div>
    <div class="pill"><span>6 YEARS IN</span></div>
  </div></body></html>`;
}

function brandedPanelHtml(w, h, title, subtitle) {
  const lockup = loadSvg('axiom-lockup-light.svg');
  const mark = loadSvg('axiom-mark-light.svg');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>${fontsHead()}<style>
    ${baseStyle(w, h)}
    .scene { position: absolute; inset: 0; background:
      radial-gradient(ellipse 70% 60% at 72% 38%, rgba(124,58,237,0.28), transparent 60%),
      linear-gradient(145deg, #12131a, #07080d); }
    .grid { position: absolute; inset: -8%; opacity: 0.45; transform: rotate(-10deg);
      background-image: linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px);
      background-size: 48px 48px; }
    .panel { position: absolute; left: 8%; top: 12%; width: 52%; padding: 6% 7%;
      border-radius: 24px; border: 1px solid rgba(255,255,255,0.08);
      background: rgba(255,255,255,0.04); backdrop-filter: blur(10px); }
    .panel svg { width: 72%; height: auto; display: block; }
    .title { margin-top: 8%; font-size: ${Math.round(w * 0.05)}px; font-weight: 800; color: #fff; line-height: 1.05; }
    .sub { margin-top: 4%; font-size: ${Math.round(w * 0.028)}px; font-weight: 600; letter-spacing: 0.12em;
      text-transform: uppercase; color: rgba(255,255,255,0.45); }
    .mark { position: absolute; right: 8%; bottom: 10%; width: 28%; opacity: 0.35; }
    .mark svg { width: 100%; height: auto; display: block; }
  </style></head><body><div class="scene"><div class="grid"></div>
    <div class="panel">${lockup}<div class="title">${title}</div><div class="sub">${subtitle}</div></div>
    <div class="mark">${mark}</div>
  </div></body></html>`;
}

function anniversaryCardHtml(w, h) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>${fontsHead()}<style>
    ${baseStyle(w, h)}
    .card { position: absolute; left: 10%; top: 8%; width: 80%; height: 84%; border-radius: 18px;
      border: 2px solid rgba(124,58,237,0.55); background: linear-gradient(160deg, #15161f, #09090f);
      box-shadow: 0 20px 50px rgba(0,0,0,0.45); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; }
    .brand { font-size: ${Math.round(w * 0.09)}px; font-weight: 800; color: #fff; letter-spacing: 0.08em; }
    .saga { font-size: ${Math.round(w * 0.045)}px; font-weight: 600; color: rgba(255,255,255,0.55); }
    .qr { width: 42%; aspect-ratio: 1; border-radius: 12px; background: #fff; display: grid; place-items: center; }
    .qr-dot { width: 18%; height: 18%; border-radius: 50%; background: #7c3aed; }
    .stone { font-size: ${Math.round(w * 0.055)}px; font-weight: 800; color: #a78bfa; letter-spacing: 0.08em; }
    .count { font-size: ${Math.round(w * 0.035)}px; color: rgba(255,255,255,0.45); }
  </style></head><body>
    <div class="card">
      <div class="brand">Axiom Chain</div>
      <div class="saga">Anniversary Quest</div>
      <div class="qr"><div class="qr-dot"></div></div>
      <div class="stone">Reality Stone</div>
      <div class="count">1 of 6</div>
    </div>
  </body></html>`;
}

function west57Html(w, h) {
  const lockup = loadSvg('axiom-lockup-light.svg');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>${fontsHead()}<style>
    ${baseStyle(w, h)}
    .top { position: absolute; inset: 0 0 34% 0; background: #050508; padding: 6% 7%; }
    .row { display: flex; align-items: center; gap: 18px; }
    .row .logo svg { width: ${Math.round(w * 0.18)}px; height: auto; display: block; }
    .x { color: rgba(255,255,255,0.55); font-size: 28px; font-weight: 700; }
    .client { font-size: ${Math.round(w * 0.08)}px; font-weight: 800; color: #fff; line-height: 1; }
    .client span { display: block; font-size: 0.42em; font-weight: 600; opacity: 0.75; }
    .headline { margin-top: 8%; font-size: ${Math.round(w * 0.055)}px; font-weight: 800; color: #00ef9f; letter-spacing: 0.04em; }
    .story { font-size: ${Math.round(w * 0.12)}px; font-weight: 800; color: #fff; line-height: 0.95; margin-top: 2%; }
    .badge { display: inline-block; margin-top: 5%; padding: 8px 14px; background: #00ef9f; color: #050508;
      font-size: 12px; font-weight: 800; letter-spacing: 0.14em; }
    .quote { position: absolute; left: 0; right: 0; bottom: 0; height: 34%; background: #f3f1ea; padding: 7% 8%;
      font-size: ${Math.round(w * 0.034)}px; font-weight: 600; color: #111; line-height: 1.45; }
    .quote:before { content: '"'; font-size: 2.2em; line-height: 0; color: #111; opacity: 0.25; display: block; margin-bottom: 8px; }
  </style></head><body>
    <div class="top">
      <div class="row"><div class="logo">${lockup}</div><span class="x">×</span>
        <div class="client">57<span>west</span></div></div>
      <div class="headline">THE WEST 57TH</div>
      <div class="story">STORY</div>
      <div class="badge">CASE STUDY FEATURE</div>
    </div>
    <div class="quote">Axiom Chain helped us build a seamless offramp to allow users to spend their crypto at millions of merchants globally.</div>
  </body></html>`;
}

const JOBS = [
  { file: 'images/blog/six-years-in.webp', w: 1024, h: 458, html: (w, h) => anniversaryHeroHtml(w, h), webp: true },
  { file: '_next/six-years-in-150e4.webp', w: 828, h: 466, html: (w, h) => brandedPanelHtml(w, h, 'Where is the market headed?', '6th anniversary talk'), webp: true },
  { file: '_next/six-years-in-2ea26.jpg', w: 828, h: 466, html: (w, h) => brandedPanelHtml(w, h, 'Team celebration', 'New Farm Park · Year 6'), webp: false },
  { file: '_next/six-years-in-393bf.jpg', w: 384, h: 512, html: (w, h) => anniversaryCardHtml(w, h), webp: false },
  { file: '_next/six-years-in-4d3f6.jpg', w: 828, h: 466, html: (w, h) => brandedPanelHtml(w, h, 'Anniversary quest complete', 'Axiom Chain team wins'), webp: false },
  { file: 'images/blog/building-with-axiom-chain-the-west-57th-story.webp', w: 1024, h: 572, html: (w, h) => west57Html(w, h), webp: true },
];

async function renderJob(job) {
  const out = path.join(ROOT, job.file);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const tmp = out + '.tmp.jpg';

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: job.w, height: job.h }, deviceScaleFactor: 1 });
  await page.setContent(job.html(job.w, job.h), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(450);
  await page.screenshot({ path: tmp, type: 'jpeg', quality: 92 });
  await browser.close();

  if (job.webp) {
    execSync(
      `python -c "from PIL import Image; im=Image.open(r'${tmp.replace(/\\/g, '/')}').convert('RGB'); im.save(r'${out.replace(/\\/g, '/')}', 'WEBP', quality=88)"`,
      { stdio: 'pipe' }
    );
    fs.unlinkSync(tmp);
  } else {
    fs.renameSync(tmp, out);
  }
  console.log('Updated', path.relative(ROOT, out));
}

async function main() {
  for (const job of JOBS) {
    console.log('Rendering', job.file, '…');
    await renderJob(job);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
