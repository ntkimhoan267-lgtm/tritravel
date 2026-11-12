#!/usr/bin/env python3
"""Sinh lại bộ favicon từ images/logo/tritravel-icon-512.png.

    python3 scripts/make-favicon.py

Biểu tượng TR được đặt trên ô trắng bo góc để chữ R navy vẫn rõ khi thanh tab
trình duyệt màu tối (trên nền trong suốt, R gần như chìm mất). Không dùng nền navy.
Sinh: favicon.ico (16/32/48), favicon-32.png, apple-touch-icon.png (180, ô vuông
không bo vì iOS tự bo góc).
"""
import os
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = Image.open(os.path.join(ROOT, "images", "logo", "tritravel-icon-512.png")).convert("RGBA")
sym = src.crop(src.getbbox())


def tile(size, pad, radius):
    S = size * 16  # vẽ to rồi thu nhỏ cho mịn
    t = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    ImageDraw.Draw(t).rounded_rectangle((0, 0, S - 1, S - 1), radius=int(S * radius), fill=(255, 255, 255, 255))
    w = S - 2 * int(S * pad)
    h = round(sym.height * w / sym.width)
    t.alpha_composite(sym.resize((w, h), Image.LANCZOS), ((S - w) // 2, (S - h) // 2))
    out = t.resize((size, size), Image.LANCZOS)
    if size <= 48:
        out = out.filter(ImageFilter.UnsharpMask(radius=0.6, percent=60, threshold=0))
    return out


i16, i32, i48 = tile(16, 0.07, 0.22), tile(32, 0.09, 0.22), tile(48, 0.10, 0.22)
i32.save(os.path.join(ROOT, "favicon-32.png"), optimize=True)
i48.save(os.path.join(ROOT, "favicon.ico"), sizes=[(16, 16), (32, 32), (48, 48)], append_images=[i16, i32])
tile(180, 0.14, 0).convert("RGB").save(os.path.join(ROOT, "apple-touch-icon.png"), optimize=True)
print("favicon.ico, favicon-32.png, apple-touch-icon.png")
