# Bộ logo TriTravel

Nguồn: `TRITRAVEL_Web_Assets.zip` (Concept A). Mọi hình ảnh đăng lên website
hoặc mạng xã hội đều phải có logo. Dùng `scripts/stamp-logo.py` để đóng logo.

| File | Dùng cho | Nền |
|---|---|---|
| `tritravel-logo.png` | Logo đầy đủ (biểu tượng + chữ TRITRAVEL, DA NANG • VIETNAM), 920×226 | Nền sáng: ảnh trời, giấy, poster sáng, in ấn |
| `tritravel-logo-white.png` | Logo đầy đủ bản chữ trắng (tạo từ bản gốc) | Nền tối: header/footer navy, ảnh tối, video |
| `tritravel-logo-white-360.png` | Bản thu nhỏ (360px) của logo chữ trắng, chỉ dùng trong `srcset` của header/footer để trang tải nhanh; file gốc vẫn là `src` | Nền tối |
| `tritravel-symbol.png` | Biểu tượng TR đứng riêng, 270×232 | Chỗ hẹp: avatar, icon, huy hiệu trang GĐPT, ảnh vuông nhỏ |
| `tritravel-icon-512.png` | Biểu tượng TR trên nền trong suốt, vuông 512 | Nguồn gốc để sinh favicon, icon app, avatar mạng xã hội |
| `tritravel-icon-192.png` | Bản 192 của icon trên | Web app manifest, Android |

Favicon ở thư mục gốc (`favicon.ico`, `favicon-32.png`, `apple-touch-icon.png`)
được sinh từ `tritravel-icon-512.png` bằng `python3 scripts/make-favicon.py`:
biểu tượng đặt trên ô trắng bo góc, vì trên nền trong suốt chữ R navy chìm mất khi
thanh tab trình duyệt màu tối. Không dùng file favicon 512 trong zip gốc
(chữ navy trên nền navy, thu nhỏ bị mờ).

## Quy tắc đặt logo
- Header và footer mọi trang: `tritravel-logo-white.png`, cao 40–44px, `width:auto`.
- Ảnh chia sẻ (og:image), thumbnail blog, poster, ảnh tour, ảnh đăng Facebook/TikTok:
  đóng logo góc trên phải, rộng ~22% bề rộng ảnh, lề 3%. Script tự chọn bản navy
  hay trắng theo độ sáng của góc.
- Ảnh vuông hoặc rất nhỏ (dưới 400px): dùng `--symbol`.
- Không kéo méo tỉ lệ, không đổi màu, không đặt logo đè lên mặt người hay chữ tiêu đề.
