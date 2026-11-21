"""Generate the PWA icons from the two-rings mark.

Usage: python3 scripts/generate-icons.py
Requires Pillow. Rendering is supersampled 4x for clean edges.
"""

from pathlib import Path

from PIL import Image, ImageDraw

PAPER = "#faf9f6"
ACCENT = "#a4604b"
OUT = Path(__file__).resolve().parent.parent / "public" / "icons"

SUPERSAMPLE = 4


def draw_icon(size: int, radius_ratio: float, center_ratio: float, stroke_ratio: float) -> Image.Image:
    scale = SUPERSAMPLE
    canvas = size * scale
    image = Image.new("RGB", (canvas, canvas), PAPER)
    draw = ImageDraw.Draw(image)

    radius = canvas * radius_ratio
    stroke = max(1, round(canvas * stroke_ratio))
    cy = canvas / 2
    cx_left = canvas * (0.5 - center_ratio)
    cx_right = canvas * (0.5 + center_ratio)

    for cx in (cx_left, cx_right):
        draw.ellipse(
            [cx - radius, cy - radius, cx + radius, cy + radius],
            outline=ACCENT,
            width=stroke,
        )

    return image.resize((size, size), Image.LANCZOS)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    icons = [
        ("icon-192.png", 192, 0.205, 0.095, 0.028),
        ("icon-512.png", 512, 0.205, 0.095, 0.028),
        ("icon-maskable-512.png", 512, 0.165, 0.08, 0.025),
        ("apple-touch-icon.png", 180, 0.205, 0.095, 0.028),
    ]

    for name, size, radius_ratio, center_ratio, stroke_ratio in icons:
        image = draw_icon(size, radius_ratio, center_ratio, stroke_ratio)
        # Flat paper + one ink colour: a small adaptive palette keeps the PNGs light.
        image = image.convert("P", palette=Image.ADAPTIVE, colors=48)
        image.save(OUT / name, optimize=True)
        print(f"wrote {OUT / name} ({image.size[0]}px)")


if __name__ == "__main__":
    main()
