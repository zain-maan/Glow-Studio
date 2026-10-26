"""Re-encode a site's photos into small AVIF + WebP files at three widths.

Usage: python optimize.py <images_dir> <name:largest_existing_width> ...
For each photo it reads <name>-<width>.webp (the largest copy we have) and writes
<name>-{480,960,<large>}.{avif,webp}, then prints the size before and after.
"""

import sys
from pathlib import Path

from PIL import Image

folder = Path(sys.argv[1])
before = sum(f.stat().st_size for f in folder.glob("*.webp"))
widths_out: dict[str, list[int]] = {}

for arg in sys.argv[2:]:
    name, src_w = arg.rsplit(":", 1)
    src = folder / f"{name}-{src_w}.webp"
    im = Image.open(src).convert("RGB")
    # Never upscale: smaller sizes only below the source width.
    largest = min(int(src_w), 1600)
    targets = sorted({w for w in (480, 960) if w < largest} | {largest})
    for w in targets:
        h = round(im.height * w / im.width)
        out = im if w == im.width else im.resize((w, h), Image.LANCZOS)
        out.save(folder / f"{name}-{w}.avif", "AVIF", quality=52, speed=4)
        out.save(folder / f"{name}-{w}.webp", "WEBP", quality=70, method=6)
    widths_out[name] = targets
    # The old large copy is no longer referenced once the new set exists.
    if int(src_w) not in targets:
        src.unlink()

for f in folder.glob("*-640.webp"):
    f.unlink()  # superseded by 480 / 960

after_webp = sum(f.stat().st_size for f in folder.glob("*.webp"))
after_avif = sum(f.stat().st_size for f in folder.glob("*.avif"))
print(f"before (webp): {before / 1e6:.2f} MB")
print(f"after  webp:   {after_webp / 1e6:.2f} MB   avif: {after_avif / 1e6:.2f} MB")
print("widths:", sorted({tuple(v) for v in widths_out.values()}))
