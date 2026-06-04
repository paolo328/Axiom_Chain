/**
 * Restore original editorial insight card photos and patch visible Labrys branding.
 *
 * Run: node scripts/restore-editorial-insight-images.js
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');

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

function restore(rel) {
  const bytes = gitBytes(rel);
  if (!bytes) {
    console.warn('Skip (not in git):', rel);
    return false;
  }
  const out = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, bytes);
  console.log('Restored', rel);
  return true;
}

function patchIndustryHealth() {
  const rel = 'images/blog/industry-health-check.webp';
  if (!restore(rel)) return;

  const out = path.join(ROOT, rel);
  execSync(
    `python -c "
from PIL import Image, ImageDraw, ImageFilter
im = Image.open(r'${out.replace(/\\\\/g, '/')}').convert('RGB')
w, h = im.size
# Cover small LABRYS chest badge (original editorial conference photo)
x0 = int(w * 0.34)
y0 = int(h * 0.56)
x1 = int(w * 0.46)
y1 = int(h * 0.66)
patch = im.crop((x0, y0, x1, y1)).filter(ImageFilter.GaussianBlur(radius=6))
im.paste(patch, (x0, y0))
draw = ImageDraw.Draw(im)
draw.rectangle([x0, y0, x1, y1], fill=(18, 18, 20))
im.save(r'${out.replace(/\\\\/g, '/')}', 'WEBP', quality=88)
"`,
    { stdio: 'inherit' }
  );
  console.log('Patched chest badge on', rel);
}

function main() {
  restore('_next/rollups-axiom-chain-v2-cardc0bb.jpg');
  restore('images/blog/generated/rollups-axiom-chain-v2-card.webp');
  patchIndustryHealth();
}

main();
