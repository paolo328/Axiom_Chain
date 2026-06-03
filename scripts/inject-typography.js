/**
 * Inject Google Fonts (Manrope + Spline Sans Mono) into all HTML pages.
 * Removes broken local woff2 preloads from the HTTrack mirror.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const FONT_SNIPPET =
  '<link rel="preconnect" href="https://fonts.googleapis.com"/>' +
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin=""/>' +
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&amp;family=Spline+Sans+Mono:wght@300;400;500;600;700&amp;display=swap"/>';

const BROKEN_FONT_PRELOAD =
  /<link rel="preload" href="[^"]*\.woff2" as="font" crossorigin="" type="font\/woff2"\/>/g;

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'hts-cache', 'scripts', 'assets'].includes(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, files);
    else if (ent.name.endsWith('.html')) files.push(p);
  }
  return files;
}

let patched = 0;
for (const file of walk(ROOT)) {
  let html = fs.readFileSync(file, 'utf8');
  let changed = false;

  if (BROKEN_FONT_PRELOAD.test(html)) {
    html = html.replace(BROKEN_FONT_PRELOAD, '');
    changed = true;
  }
  BROKEN_FONT_PRELOAD.lastIndex = 0;

  if (!html.includes('fonts.googleapis.com')) {
    const themeEnd = html.indexOf('})();</script>');
    if (themeEnd !== -1) {
      const insertAt = themeEnd + '})();</script>'.length;
      html = html.slice(0, insertAt) + FONT_SNIPPET + html.slice(insertAt);
      changed = true;
    } else if (html.includes('<head>')) {
      html = html.replace(/<head>/i, `<head>${FONT_SNIPPET}`);
      changed = true;
    }
  } else {
    const fontBlockRe =
      /<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com"\/>[\s\S]*?display=swap"\/>/;
    const block = html.match(fontBlockRe);
    if (block) {
      const without = html.replace(fontBlockRe, '');
      const themeEnd = without.indexOf('})();</script>');
      if (themeEnd !== -1 && !without.slice(themeEnd, themeEnd + 80).includes('fonts.googleapis')) {
        const insertAt = themeEnd + '})();</script>'.length;
        html = without.slice(0, insertAt) + block[0] + without.slice(insertAt);
        changed = true;
      }
    }
  }

  if (changed) {
    fs.writeFileSync(file, html, 'utf8');
    patched++;
  }
}

console.log(`Typography: updated ${patched} HTML file(s). Fonts load from Google Fonts CDN.`);
