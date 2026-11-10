#!/usr/bin/env python3
from pathlib import Path
from PIL import Image, ImageOps

root = Path(__file__).resolve().parents[1]
atelier = root / "atelier"

MAX_DIM = 1600
QUALITY = 72

for path in sorted(atelier.glob("*")):
    if not path.is_file():
        continue

    suffix = path.suffix.lower()
    if suffix not in {".jpg", ".jpeg", ".png"}:
        continue

    out = path.with_suffix(".webp")
    if out.exists() and out.stat().st_mtime >= path.stat().st_mtime:
        continue

    try:
        with Image.open(path) as img:
            img = ImageOps.exif_transpose(img)
            rgb = img.convert("RGBA") if img.mode in {"RGBA", "LA", "P"} else img.convert("RGB")

            width, height = rgb.size
            if max(width, height) > MAX_DIM:
                scale = MAX_DIM / max(width, height)
                rgb = rgb.resize(
                    (max(1, int(width * scale)), max(1, int(height * scale))),
                    Image.Resampling.LANCZOS,
                )

            rgb.save(out, "WEBP", quality=QUALITY, method=6, optimize=True)
            print(f"Created: {out.name}")
    except Exception as exc:
        print(f"Skip {path.name}: {exc}")

print("Image optimization complete")
