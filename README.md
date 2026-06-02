# Axiom Chain LLC — Website

Static site based on a mirrored layout, rebranded and repaired for local hosting as **Axiom Chain LLC** (blockchain & AI engineering).

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

- Rebranded **Labrys** → **Axiom Chain** / **Axiom Chain LLC**
- Removed broken `_data_image` folders (Next.js blur placeholders misparsed as URLs)
- Fixed `/_next/` and `/_next/image` paths for offline browsing
- Corrected broken JavaScript chunk filenames (`~` → `_`)
- Removed HTTrack mirror comments

## Re-running fixes

If you add HTML from a new mirror pass:

```bash
node scripts/fix-axiom-site.js
```

Note: the script expects files under `labrys.io/`; adjust `SITE_ROOT` in the script if your layout changes.

## Limitations

- Some team photos and dynamic API routes (`/api/`) were not in the mirror; those assets may be missing offline.
- This is a static snapshot, not the original Next.js app. Interactivity depends on mirrored JavaScript in `_next/static/chunks/`.
