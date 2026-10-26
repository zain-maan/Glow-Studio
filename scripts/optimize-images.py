"""Turn full-quality photos into crisp AVIF + WebP files at the widths the site serves.

Usage: python scripts/optimize-images.py <originals_dir>
<originals_dir> holds <name>.jpg files (high-quality JPEG downloads from Unsplash).
Portraits get 480 and 960 px; everything else 640, 1280 and 1920 px (never upscaled).
"""

import sys
from pathlib import Path

from PIL import Image

PORTRAITS = {"layla", "sofia", "omar", "nadia", "karim", "client"}
src_dir = Path(sys.argv[1])
out = Path(__file__).resolve().parent.parent / "public" / "images"
out.mkdir(parents=True, exist_ok=True)

for src in sorted(src_dir.glob("*.jpg")):
    name = src.stem
    for old in out.glob(f"{name}-*.*"):
        if old.stem.rsplit("-", 1)[0] == name:
            old.unlink()
    im = Image.open(src).convert("RGB")
    widths = (480, 960) if name in PORTRAITS else (640, 1280, 1920)
    for w in widths:
        w = min(w, im.width)
        h = round(im.height * w / im.width)
        img = im if w == im.width else im.resize((w, h), Image.LANCZOS)
        img.save(out / f"{name}-{w}.avif", "AVIF", quality=68, speed=4)
        img.save(out / f"{name}-{w}.webp", "WEBP", quality=84, method=6)
    print(name, im.size, widths, flush=True)

print(f"webp {sum(f.stat().st_size for f in out.glob('*.webp')) / 1e6:.2f} MB, avif {sum(f.stat().st_size for f in out.glob('*.avif')) / 1e6:.2f} MB")
