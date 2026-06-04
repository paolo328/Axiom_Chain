import os
import re

refs = set()
for root, dirs, files in os.walk("."):
    if ".git" in root or "node_modules" in root:
        continue
    for f in files:
        if not f.endswith(".html"):
            continue
        t = open(os.path.join(root, f), encoding="utf-8", errors="ignore").read()
        for m in re.finditer(
            r'(?:src|href|imageSrcSet|content)="([^"]+\.(?:jpg|jpeg|png|webp|gif)[^"]*)"',
            t,
            re.I,
        ):
            u = m.group(1).split("?")[0].split(" ")[0].replace("%2F", "/")
            if u.startswith("http"):
                continue
            while u.startswith("../"):
                u = u[3:]
            refs.add(u.lstrip("/"))
        for m in re.finditer(
            r"(?:_next|images)/[a-zA-Z0-9_./%-]+\.(?:webp|jpg|jpeg|png|gif)", t
        ):
            refs.add(m.group(0))

all_imgs = []
for root, dirs, files in os.walk("."):
    if ".git" in root or "node_modules" in root:
        continue
    for f in files:
        if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp", ".gif")):
            p = os.path.join(root, f).replace("\\", "/").lstrip("./")
            all_imgs.append(p)

orphans = [p for p in all_imgs if p not in refs and not p.startswith("brand/logo")]
junk = [
    p
    for p in all_imgs
    if os.path.basename(p).startswith(("check-", "restore-", "git-"))
]
labrys = [p for p in all_imgs if "labrys" in p.lower()]

print("refs", len(refs), "all", len(all_imgs), "orphans", len(orphans), "junk", len(junk))
for p in sorted(junk):
    print("JUNK", p)
for p in sorted(labrys):
    print("LABRYS", p)
print("--- orphans ---")
for p in sorted(orphans):
    print(p)
