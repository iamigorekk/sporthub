"""Build the README hero from the giraffe frames recorded by scripts/record_giraffe.js, no network:

  python3 scripts/readme_media.py FRAMES_DIR          hero from scripts/record_giraffe.js
  python3 scripts/readme_media.py --demo FRAMES_DIR   demo from scripts/record_demo.js

Outputs (docs/assets/): hero-static.png + hero.gif (1280x480, one 10 s giraffe cycle, seamless); demo.gif + demo-poster.png. The wordmark never moves; the giraffe is the
recording, only scaled. Needs Pillow and ffmpeg on PATH (GIF via palettegen/paletteuse).
"""
from __future__ import annotations

import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ASSETS = Path(__file__).resolve().parent.parent / "docs" / "assets"
W, H = 1280, 480
BG, ORANGE, DEEP, GREY = (8, 8, 8), (0xFF, 0x90, 0x00), (0x5A, 0x2C, 0x00), (0xA3, 0xA3, 0xA3)
GLYPHS = {  # 5x5 block letters, the same family as the GHOST / STAMPEDE heroes
    "S": [" ####", "#    ", " ### ", "    #", "#### "],
    "P": ["#### ", "#   #", "#### ", "#    ", "#    "],
    "O": [" ### ", "#   #", "#   #", "#   #", " ### "],
    "R": ["#### ", "#   #", "#### ", "#  # ", "#   #"],
    "T": ["#####", "  #  ", "  #  ", "  #  ", "  #  "],
    "H": ["#   #", "#   #", "#####", "#   #", "#   #"],
    "U": ["#   #", "#   #", "#   #", "#   #", " ### "],
    "B": ["#### ", "#   #", "#### ", "#   #", "#### "],
}
TAGLINE = "sports signals  ·  Robinhood Chain  ·  read-only"


def font(size: int) -> ImageFont.FreeTypeFont:
    for p in ("/System/Library/Fonts/Menlo.ttc", "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"):
        if Path(p).exists():
            return ImageFont.truetype(p, size)
    return ImageFont.load_default(size)


def wordmark(cw: int, ch: int) -> Image.Image:
    rows = [" ".join(GLYPHS[c][i] for c in "SPORTHUB") for i in range(5)]
    im = Image.new("RGBA", (len(rows[0]) * cw + cw, 5 * ch + ch), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    for dy, dx, col in ((ch // 2, cw // 2, DEEP), (0, 0, ORANGE)):  # pressed shadow, then the letters
        for y, row in enumerate(rows):
            for x, c in enumerate(row):
                if c == "#":
                    d.rectangle([x * cw + dx, y * ch + dy, (x + 1) * cw - 1 + dx, (y + 1) * ch - 1 + dy], fill=col + (255,))
    return im


def ease(t: float) -> float:
    return t * t * (3 - 2 * t)


def stroke_at(t: float) -> float:  # t in 0..1 of the loop: grow, hold, retract, rest
    if t < 0.05:
        return 0.0
    if t < 0.15:
        return ease((t - 0.05) / 0.1)
    if t < 0.88:
        return 1.0
    if t < 0.95:
        return 1 - ease((t - 0.88) / 0.07)
    return 0.0


def frame(giraffe: Image.Image, stroke: float, wm: Image.Image, f: ImageFont.FreeTypeFont) -> Image.Image:
    im = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(im)
    x0, y0 = 64, 138
    im.paste(wm, (x0, y0), wm)
    d.text((x0, y0 + wm.height + 14), TAGLINE, font=f, fill=GREY)
    y = y0 + wm.height + 58
    x_end = x0 + int(stroke * (W - giraffe.width - 60 - x0))
    if stroke > 0:
        d.rectangle([x0, y, x_end, y + 3], fill=ORANGE)
        d.polygon([(x_end + 1, y - 4), (x_end + 11, y + 1), (x_end + 1, y + 7)], fill=ORANGE)
    im.paste(giraffe, (W - giraffe.width - 24, H - giraffe.height))
    return im


def main(src: Path) -> None:
    shots = sorted(src.glob("g-*.png"))
    if not shots:
        sys.exit(f"no g-*.png in {src}; run scripts/record_giraffe.js first")
    wm, f = wordmark(14, 28), font(21)
    size = (360, 450)  # the recording is 800x1000
    with tempfile.TemporaryDirectory() as tmp:
        for i, p in enumerate(shots):
            g = Image.open(p).convert("RGB").resize(size, Image.LANCZOS)
            frame(g, stroke_at(i / len(shots)), wm, f).save(Path(tmp) / f"f-{i:03d}.png")
        shutil.copy(Path(tmp) / f"f-{len(shots) // 3:03d}.png", ASSETS / "hero-static.png")
        vf = "split[a][b];[a]palettegen=max_colors=96:stats_mode=diff[p];[b][p]paletteuse=dither=none"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-framerate", "12", "-i", str(Path(tmp) / "f-%03d.png"),
                        "-vf", vf, "-loop", "0", str(ASSETS / "hero.gif")], check=True)
    report("hero.gif", "hero-static.png")


def demo(src: Path) -> None:
    """demo.gif is a screen recording of sporthub.sh by scripts/record_demo.js (PNG + list.txt with real durations).
    1024 px, 10 fps, 128 colours keeps ~28 s of photos and particles under GitHub's 10 MB image limit."""
    vf = ("fps=10,scale=1024:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];"
          "[b][p]paletteuse=dither=none:diff_mode=rectangle")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(src / "list.txt"), "-vf", vf,
                    "-loop", "0", str(ASSETS / "demo.gif")], check=True)
    poster = sorted(src.glob("f-*.png"))[-1]  # last frame: the social feed
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(poster), "-vf", "scale=1024:-1:flags=lanczos",
                    str(ASSETS / "demo-poster.png")], check=True)
    report("demo.gif", "demo-poster.png")


def report(*names: str) -> None:
    for n in names:
        print(f"{n:16s} {(ASSETS / n).stat().st_size / 1024:8.0f} KB")


if __name__ == "__main__":
    if len(sys.argv) not in (2, 3) or not shutil.which("ffmpeg"):
        sys.exit("usage: python3 scripts/readme_media.py [--demo] FRAMES_DIR  (ffmpeg on PATH)")
    demo(Path(sys.argv[2])) if sys.argv[1] == "--demo" else main(Path(sys.argv[1]))
