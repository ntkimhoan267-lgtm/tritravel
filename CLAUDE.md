# TriTravel – quy tắc cho mọi phiên làm việc

## Logo và nhận diện (bắt buộc)
- Bộ logo chính thức nằm ở `images/logo/`. Đọc `images/logo/README.md` để biết
  file nào dùng cho nền nào.
- **Mọi hình ảnh mới thêm vào website đều phải có logo TriTravel**: thumbnail
  bài blog, ảnh tour, poster, ảnh chia sẻ (og:image / twitter:image), ảnh đăng
  mạng xã hội, banner. Không có ngoại lệ trừ khi chủ site nói rõ.
- Đóng logo bằng script có sẵn, không vẽ tay:
  `python3 scripts/stamp-logo.py <ảnh> [--corner top-right] [--symbol]`
  Mặc định: góc trên phải, rộng 22% bề rộng ảnh, tự chọn bản navy/trắng theo
  độ sáng nền.
- Khi viết bài blog mới: ảnh thumbnail và ảnh trong bài đều đóng logo trước
  khi chèn, rồi mới cập nhật `og:image` / `twitter:image` của bài.
- Header và footer trang mới phải dùng `images/logo/tritravel-logo-white.png`
  (cao 40–44px), cùng bộ favicon ở thư mục gốc:
  `favicon.ico`, `favicon-32.png`, `apple-touch-icon.png`.
- Favicon chỉ được sinh lại từ `images/logo/tritravel-icon-512.png`
  (biểu tượng TR trên nền trong suốt). Không dùng nền navy phía sau.
- Không thay đổi màu, tỉ lệ hay cắt xén logo. Không đặt logo đè lên mặt người
  hoặc chữ tiêu đề của ảnh.

## Cấu trúc site
- Site tĩnh HTML, deploy GitHub Pages từ nhánh `main` (domain trong `CNAME`).
- Trang chính: `index.html`, blog `blog.html` + `blog-*.html`, form visa
  `visa/`, `visamy/`, trang Truyền Tin GĐPT `gdpt/`.
- Trang con dùng đường dẫn tuyệt đối (`/images/...`), trang ở gốc dùng tương đối.
