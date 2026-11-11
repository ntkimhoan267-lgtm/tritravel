#!/usr/bin/env python3
"""Đóng logo TriTravel lên ảnh (thumbnail blog, poster, ảnh đăng mạng xã hội...).

Dùng:
    python3 scripts/stamp-logo.py input.jpg                 # ghi đè input.jpg
    python3 scripts/stamp-logo.py input.jpg -o output.jpg   # ghi ra file khác
    python3 scripts/stamp-logo.py images/*.jpg              # nhiều ảnh, ghi đè

Tuỳ chọn:
    --corner  top-right | top-left | bottom-right | bottom-left   (mặc định top-right)
    --size    bề rộng logo tính theo % bề rộng ảnh, mặc định 22
    --variant auto | navy | white   (auto: chọn theo độ sáng của góc đặt logo)
    --symbol  chỉ đóng biểu tượng TR (dùng cho ảnh vuông / rất nhỏ)
    --margin  khoảng cách mép, % bề rộng ảnh, mặc định 3

Quy tắc chọn màu: nền sáng -> logo navy (tritravel-logo.png),
nền tối -> logo chữ trắng (tritravel-logo-white.png). Luôn thêm quầng
sáng/tối mờ sau logo để rõ trên nền ảnh rối.
"""
import argparse, os, sys
from PIL import Image, ImageFilter, ImageStat

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOGO_DIR = os.path.join(ROOT, "images", "logo")
FILES = {
    "navy": "tritravel-logo.png",
    "white": "tritravel-logo-white.png",
    "symbol": "tritravel-symbol.png",
}


def corner_brightness(img, box):
    region = img.convert("L").crop(box)
    return ImageStat.Stat(region).mean[0]


def stamp(path, out, corner, size_pct, variant, symbol, margin_pct):
    img = Image.open(path).convert("RGBA")
    W, H = img.size
    lw = max(48, round(W * size_pct / 100))
    margin = round(W * margin_pct / 100)

    key = "symbol" if symbol else "navy"
    logo = Image.open(os.path.join(LOGO_DIR, FILES[key])).convert("RGBA")
    logo = logo.crop(logo.getbbox())
    lh = round(lw * logo.height / logo.width)
    x = margin if "left" in corner else W - lw - margin
    y = margin if "top" in corner else H - lh - margin

    if variant == "auto":
        bright = corner_brightness(img, (x, y, x + lw, y + lh))
        variant = "navy" if bright > 140 else "white"
    if not symbol and variant == "white":
        logo = Image.open(os.path.join(LOGO_DIR, FILES["white"])).convert("RGBA")
        logo = logo.crop(logo.getbbox())
        lh = round(lw * logo.height / logo.width)
        y = margin if "top" in corner else H - lh - margin
    logo = logo.resize((lw, lh), Image.LANCZOS)

    # quầng mờ sau logo: trắng cho logo navy, navy đậm cho logo trắng
    pad = max(12, lw // 10)
    alpha = Image.new("L", (lw + 2 * pad, lh + 2 * pad), 0)
    alpha.paste(logo.split()[3], (pad, pad))
    alpha = alpha.filter(ImageFilter.GaussianBlur(pad * 0.9)).point(lambda a: min(255, int(a * 1.5)))
    glow_col = (255, 255, 255, 255) if variant == "navy" else (8, 20, 50, 255)
    glow = Image.new("RGBA", alpha.size, glow_col)
    glow.putalpha(alpha)
    img.alpha_composite(glow, (x - pad, y - pad))
    img.alpha_composite(logo, (x, y))

    ext = os.path.splitext(out)[1].lower()
    if ext in (".jpg", ".jpeg"):
        img.convert("RGB").save(out, quality=90, optimize=True)
    elif ext == ".webp":
        img.save(out, quality=88)
    else:
        img.save(out, optimize=True)
    print(f"{path} -> {out}  ({variant}, {corner}, {lw}px)")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("images", nargs="+")
    ap.add_argument("-o", "--output", help="file đầu ra (chỉ khi có 1 ảnh vào)")
    ap.add_argument("--corner", default="top-right",
                    choices=["top-right", "top-left", "bottom-right", "bottom-left"])
    ap.add_argument("--size", type=float, default=22)
    ap.add_argument("--margin", type=float, default=3)
    ap.add_argument("--variant", default="auto", choices=["auto", "navy", "white"])
    ap.add_argument("--symbol", action="store_true")
    a = ap.parse_args()
    if a.output and len(a.images) != 1:
        sys.exit("-o chỉ dùng với 1 ảnh")
    for p in a.images:
        stamp(p, a.output or p, a.corner, a.size, a.variant, a.symbol, a.margin)


if __name__ == "__main__":
    main()
