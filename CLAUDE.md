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
- Ngoại lệ chủ site đã duyệt (không cần đóng logo): ảnh nền đầu trang
  `images/hero-danang.jpg`, poster `images/poster-danang.jpg` (và bản thu nhỏ
  `poster-danang-900.jpg`), ảnh chân dung `images/TriTravel-portrait.jpg`
  (và avatar `TriTravel-portrait-160.jpg`).
- Header và footer trang mới phải dùng `images/logo/tritravel-logo-white.png`
  (cao 40–44px), cùng bộ favicon ở thư mục gốc:
  `favicon.ico`, `favicon-32.png`, `apple-touch-icon.png`.
- Favicon chỉ được sinh lại từ `images/logo/tritravel-icon-512.png` bằng
  `python3 scripts/make-favicon.py`: biểu tượng TR đặt trên ô trắng bo góc để
  chữ R navy không chìm khi thanh tab màu tối. Không dùng nền navy phía sau.
- Không thay đổi màu, tỉ lệ hay cắt xén logo. Không đặt logo đè lên mặt người
  hoặc chữ tiêu đề của ảnh.

## Cấu trúc site
- Site tĩnh HTML, deploy GitHub Pages từ nhánh `main` (domain trong `CNAME`).
- Trang chính: `index.html`, blog `blog.html` + `blog/<slug>.html`, form visa
  `visa/`, `visamy/`, trang Truyền Tin GĐPT `gdpt/`, dashboard đăng bài `admin/`.
- Trang con dùng đường dẫn tuyệt đối (`/images/...`), trang ở gốc dùng tương đối.
- Trang `cau-chuyen.html` (câu chuyện TriTravel) và `404.html` cũng nhận header/footer
  sinh ra từ `render.js`; `404.html` dùng đường dẫn tuyệt đối.
- Giao diện dùng chung: `assets/site.css` + `assets/site.js` (không dùng Tailwind
  CDN). Màu lấy từ logo: navy `#0C254D`, teal `#4EABB0`, vàng `#E9B949`; font
  Fraunces (tiêu đề) + Be Vietnam Pro (nội dung).
- Song ngữ: đặt cặp `<span lang="vi">…</span><span lang="en">…</span>`.

## Blog (không sửa tay các file sinh ra)
- Nguồn: `data/posts/<slug>.json` (nội dung) + `data/posts.json` (danh sách).
- `blog/<slug>.html`, `blog.html`, `sitemap.xml` và phần giữa các dấu
  `<!-- header|footer|latest-posts:start/end -->` trong `index.html` là file
  **sinh ra** bởi `assets/render.js`. Sửa header/footer/khuôn bài ở `render.js`
  rồi chạy `node scripts/build-blog.js`.
- Dashboard `/admin/` dùng đúng `render.js` đó trong trình duyệt và commit thẳng
  lên `main` qua GitHub API; ảnh tải lên được cắt 1200×630 và đóng logo tự động.
- Ảnh bìa bài: `images/blog/<slug>.jpg` (1200×630) kèm bản thu nhỏ 800px `<slug>-sm.jpg`
  (trường `cover_sm`) cho thẻ bài viết. Ảnh thẻ trang chủ:
  `images/web/`. `blog-*.html` ở gốc chỉ là trang chuyển hướng link cũ.
