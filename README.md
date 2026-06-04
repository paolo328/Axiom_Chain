# Axiom Chain LLC — Website

Static site for **Axiom Chain LLC** (blockchain & AI engineering).

**Logo paths:** see [LOGO-PATHS.md](LOGO-PATHS.md)

## Run locally

From this folder, start any static file server. Examples:

```bash
# Python
python -m http.server 8080

# Node (npx)
npx serve -l 8080
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

## Site structure

| Path | Description |
|------|-------------|
| `index.html` | Home |
| `about.html` | About |
| `services-blockchain.html` | Blockchain services |
| `services-ai.html` | AI services |
| `projects.html` | Case studies index |
| `projects/*.html` | Individual projects |
| `insights.html` | Blog / insights index |
| `insights/*.html` | Articles |
| `team.html` | Team |
| `team/*.html` | Team member profiles |
| `contact.html` | Contact |
| `brand-assets.html` | Brand assets |
| `privacy-policy.html` | Privacy policy |

## What was fixed (HTTrack mirror)

- Rebranded legacy mirror content to **Axiom Chain LLC**
- Removed broken `_data_image` folders (Next.js blur placeholders misparsed as URLs)
- Fixed `/_next/` and `/_next/image` paths for offline browsing
- Corrected broken JavaScript chunk filenames (`~` → `_`)
- Removed HTTrack mirror comments

## Branding & dark mode

- **Logo:** Axiom Chain mark and lockup SVGs in `brand/logo/` and `_next/logo_*.svg`
- **Dark mode:** Moon icon in the nav toggles light/dark theme (saved in `localStorage` as `axiom-theme`)

Re-apply logos and theme after HTML changes:

```bash
node scripts/apply-axiom-branding.js
```

## Typography

Body text uses **Manrope**; labels and accents use **Spline Sans Mono** (same pairing as the original site). The HTTrack mirror only kept one local `.woff2` file, so fonts load from **Google Fonts** on all pages. Responsive rules live in `assets/css/axiom-overrides.css`.

After adding new HTML pages:

```bash
node scripts/inject-typography.js
```

## Re-running mirror fixes

If you add HTML from a new mirror pass:

```bash
node scripts/fix-axiom-site.js
node scripts/fix-double-next.js
node scripts/apply-axiom-branding.js
```

## Limitations

- Some team photos and dynamic API routes (`/api/`) were not in the mirror; those assets may be missing offline.
- This is a static snapshot, not the original Next.js app. Interactivity is restored by `assets/js/axiom-*.js` (theme, nav, marquees, homepage tabs, FAQ accordions).

## Remove bloat

Strip dead Next.js flight payloads, unused chunk JS, and debug files:

```bash
node scripts/extract-home-data.js   # cache homepage tab data first
node scripts/cleanup-static-site.js
```

This runs automatically at the end of `node scripts/apply-axiom-branding.js`.
