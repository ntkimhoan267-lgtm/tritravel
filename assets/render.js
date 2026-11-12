/* TriTravel – bộ dựng trang blog. Dùng chung cho:
   - dashboard /admin/ (chạy trong trình duyệt, dựng HTML rồi commit lên GitHub)
   - scripts/build-blog.js (chạy bằng Node để dựng lại toàn bộ)
   Nguồn dữ liệu: data/posts.json (danh sách) + data/posts/<slug>.json (nội dung). */
(function (rootObj, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else rootObj.TTRender = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  var SITE = 'https://tritravel.vn';
  var CATS = {
    'diem-den': { vi: 'Điểm đến', en: 'Destinations' },
    'visa': { vi: 'Visa & Hướng dẫn', en: 'Visa & Guides' },
    'kinh-nghiem': { vi: 'Kinh nghiệm', en: 'Travel tips' },
    'am-thuc': { vi: 'Ẩm thực', en: 'Food' },
    'tin-tuc': { vi: 'Tin tức', en: 'News' }
  };

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function t(vi, en) { return '<span lang="vi">' + vi + '</span><span lang="en">' + (en || vi) + '</span>'; }
  function icon(n) { return '<svg class="icon" aria-hidden="true"><use href="#i-' + n + '"/></svg>'; }
  function slugify(s) {
    return String(s).toLowerCase().replace(/đ/g, 'd').normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70);
  }
  function fmtDate(iso, en) {
    var d = new Date(iso + 'T00:00:00Z'), m = d.getUTCMonth(), y = d.getUTCFullYear(), day = d.getUTCDate();
    if (en) return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m] + ' ' + day + ', ' + y;
    return day + ' tháng ' + (m + 1) + ', ' + y;
  }
  function catLabel(p) { var c = CATS[p.category] || CATS['kinh-nghiem']; return t(c.vi, c.en); }
  function postUrl(p) { return '/blog/' + p.slug + '.html'; }
  function sortPosts(posts) { return posts.filter(function (p) { return !p.draft; }).sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; }); }

  var SPRITE = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' +
    '<symbol id="i-compass" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/></symbol>' +
    '<symbol id="i-visa" viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M9 17h6"/></symbol>' +
    '<symbol id="i-car" viewBox="0 0 24 24"><path d="M4 16v-3l2-5a2 2 0 0 1 2-1h8a2 2 0 0 1 2 1l2 5v3M3 16h18v2H3zM7 13h10"/><circle cx="7.5" cy="18" r="1.5"/><circle cx="16.5" cy="18" r="1.5"/></symbol>' +
    '<symbol id="i-plane" viewBox="0 0 24 24"><path d="M10.5 13.5 3 11l1.5-1.5 7 .5 4.6-4.6a2 2 0 0 1 2.8 2.8L14.300 12.800l.5 7L13.300 21.300z"/></symbol>' +
    '<symbol id="i-arrow" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></symbol>' +
    '<symbol id="i-check" viewBox="0 0 24 24"><path d="m5 12.500 4.500 4.500L19 7.500"/></symbol>' +
    '<symbol id="i-phone" viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.500 1.500a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></symbol>' +
    '<symbol id="i-chat" viewBox="0 0 24 24"><path d="M21 12a8 8 0 0 1-11.800 7L4 20l1.200-4.500A8 8 0 1 1 21 12z"/></symbol>' +
    '<symbol id="i-mail" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></symbol>' +
    '<symbol id="i-menu" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></symbol>' +
    '<symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></symbol>' +
    '<symbol id="i-link" viewBox="0 0 24 24"><path d="M10 14a4 4 0 0 0 5.700 0l3-3a4 4 0 0 0-5.700-5.700l-1 1M14 10a4 4 0 0 0-5.700 0l-3 3a4 4 0 0 0 5.700 5.700l1-1"/></symbol>' +
    '</defs></svg>';

  /* r = '' cho trang ở gốc (đường dẫn tương đối), '/' cho trang con (đường dẫn tuyệt đối) */
  function header(r, current, solid) {
    var home = r === '/' ? '/' : './';
    var nav = [
      [home + '#tours', 'Tour', 'Tours', 'tours'],
      [home + '#visa', 'Visa & Dịch thuật', 'Visa & Translation', 'visa'],
      [home + '#transport', 'Thuê xe & Vé bay', 'Cars & Flights', 'transport'],
      [home + '#about', 'Về TriTravel', 'About', 'about'],
      [r + 'blog.html', 'Blog', 'Blog', 'blog'],
      [r + 'gdpt/', 'Truyền tin GĐPT', 'GĐPT Signaling', 'gdpt']
    ];
    var links = nav.map(function (n) { return '<a href="' + n[0] + '"' + (current === n[3] ? ' aria-current="page"' : '') + '>' + t(n[1], n[2]) + '</a>'; }).join('');
    return SPRITE + '\n<header class="site-header' + (solid ? ' solid' : '') + '">\n  <div class="wrap bar">\n' +
      '    <a class="logo" href="' + home + '" aria-label="TriTravel – Trang chủ"><img src="' + r + 'images/logo/tritravel-logo-white.png" alt="TriTravel – Da Nang, Vietnam" width="171" height="42"></a>\n' +
      '    <nav class="nav" aria-label="Chính">' + links + '</nav>\n' +
      '    <div class="head-tools">\n' +
      '      <div class="lang" role="group" aria-label="Ngôn ngữ"><button type="button" data-set="vi">VI</button><button type="button" data-set="en">EN</button></div>\n' +
      '      <a class="btn btn-gold btn-sm head-cta" href="' + home + '#contact">' + t('Tư vấn miễn phí', 'Free consultation') + '</a>\n' +
      '      <button class="menu-btn" type="button" aria-label="Menu" aria-expanded="false">' + icon('menu') + '</button>\n' +
      '    </div>\n  </div>\n' +
      '  <nav class="mobile-nav" aria-label="Di động">' + links + '<a class="btn btn-gold" href="' + home + '#contact">' + t('Tư vấn miễn phí', 'Free consultation') + '</a></nav>\n</header>';
  }

  function footer(r) {
    var home = r === '/' ? '/' : './';
    return '<footer class="site-footer">\n  <div class="wrap">\n    <div class="foot-grid">\n' +
      '      <div><img src="' + r + 'images/logo/tritravel-logo-white.png" alt="TriTravel" width="179" height="44" loading="lazy"><p>' + '<b style="color:#fff;font-family:var(--serif);font-weight:500;font-size:1.15rem">Born in Da Nang. Built for the world.</b><br>' + t('Người dẫn đường Đà Nẵng – tour riêng, visa, dịch thuật, thuê xe và vé máy bay, lo trọn từ lúc lên kế hoạch đến khi bạn về nhà.', 'Your Da Nang local guide – private tours, visas, translation, car rental and flights, handled end to end.') + '</p></div>\n' +
      '      <div><h4>' + t('Dịch vụ', 'Services') + '</h4><ul>' +
      '<li><a href="' + home + '#tours">' + t('Tour Đà Nẵng – Hội An – Huế', 'Da Nang – Hoi An – Hue tours') + '</a></li>' +
      '<li><a href="' + r + 'visa/">' + t('Nộp hồ sơ visa online', 'Online visa application') + '</a></li>' +
      '<li><a href="' + r + 'visamy/">' + t('Hồ sơ visa Mỹ', 'US visa application') + '</a></li>' +
      '<li><a href="' + home + '#visa">' + t('Dịch thuật công chứng', 'Certified translation') + '</a></li>' +
      '<li><a href="' + home + '#transport">' + t('Thuê xe tự lái', 'Self-drive car rental') + '</a></li>' +
      '<li><a href="' + home + '#transport">' + t('Vé máy bay', 'Flight tickets') + '</a></li></ul></div>\n' +
      '      <div><h4>' + t('Khám phá', 'Explore') + '</h4><ul>' +
      '<li><a href="' + home + '#about">' + t('Về TriTravel', 'About TriTravel') + '</a></li>' +
      '<li><a href="' + r + 'cau-chuyen.html">' + t('Câu chuyện TriTravel', 'Our story') + '</a></li>' +
      '<li><a href="' + r + 'blog.html">Blog</a></li>' +
      '<li><a href="' + home + '#faq">' + t('Câu hỏi thường gặp', 'FAQ') + '</a></li>' +
      '<li><a href="' + r + 'gdpt/">' + t('Truyền tin GĐPT', 'GĐPT Signaling') + '</a></li>' +
      '<li><a href="https://facebook.com/tritravel.vn" rel="noopener">Facebook</a> · <a href="https://tiktok.com/@TriTravel" rel="noopener">TikTok</a></li>' +
      '<li><a href="https://instagram.com/tritravel.vn" rel="noopener">Instagram</a> · <a href="https://youtube.com/@TriTravel" rel="noopener">YouTube</a></li></ul></div>\n' +
      '      <div><h4>' + t('Liên hệ', 'Contact') + '</h4><ul>' +
      '<li>' + t('Đà Nẵng, Việt Nam', 'Da Nang, Vietnam') + '</li>' +
      '<li><a href="tel:+84935191394">0935 191 394</a></li>' +
      '<li><a href="https://zalo.me/0935191394" rel="noopener">Zalo</a> · <a href="https://wa.me/84935191394" rel="noopener">WhatsApp</a> · <a href="https://m.me/tritravel.vn" rel="noopener">Messenger</a></li>' +
      '<li><a href="mailto:TriTravel.vn@gmail.com">TriTravel.vn@gmail.com</a></li></ul></div>\n' +
      '    </div>\n    <div class="foot-base"><span>© ' + new Date().getFullYear() + ' TriTravel. ' + t('Làm tại Đà Nẵng, với tất cả sự tử tế.', 'Made in Da Nang, with care.') + '</span><span>T · R · I · P — Thankful · Responsible · Innovative · Professional</span></div>\n  </div>\n</footer>\n' +
      '<div class="dock"><a href="tel:+84935191394" aria-label="Gọi 0935 191 394">' + icon('phone') + '<span>' + t('Gọi', 'Call') + '</span></a>' +
      '<a href="https://zalo.me/0935191394" rel="noopener" aria-label="Chat Zalo">' + icon('chat') + '<span>Zalo</span></a>' +
      '<a class="main" href="' + home + '#contact"><span>' + t('Tư vấn miễn phí', 'Free consultation') + '</span></a></div>';
  }

  function headTags(o) {
    var img = SITE + o.image;
    return '<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
      '<title>' + esc(o.title) + '</title>\n<meta name="description" content="' + esc(o.desc) + '">\n' +
      '<meta name="robots" content="index, follow">\n<link rel="canonical" href="' + SITE + o.path + '">\n' +
      '<link rel="icon" href="/favicon.ico?v=2" type="image/x-icon">\n<link rel="icon" href="/favicon-32.png?v=2" type="image/png" sizes="32x32">\n<link rel="apple-touch-icon" href="/apple-touch-icon.png?v=2">\n' +
      '<meta property="og:site_name" content="TriTravel">\n<meta property="og:locale" content="vi_VN">\n<meta property="og:type" content="' + (o.type || 'website') + '">\n' +
      '<meta property="og:title" content="' + esc(o.ogTitle || o.title) + '">\n<meta property="og:description" content="' + esc(o.desc) + '">\n<meta property="og:url" content="' + SITE + o.path + '">\n' +
      '<meta property="og:image" content="' + img + '">\n<meta property="og:image:width" content="' + (o.imageW || 1200) + '">\n<meta property="og:image:height" content="' + (o.imageH || 630) + '">\n<meta property="og:image:alt" content="' + esc(o.imageAlt || o.title) + '">\n' +
      '<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:title" content="' + esc(o.ogTitle || o.title) + '">\n<meta name="twitter:description" content="' + esc(o.desc) + '">\n<meta name="twitter:image" content="' + img + '">\n' +
      '<script>(function(d){d.classList.add("js");try{if(localStorage.getItem("TriTravel-lang")==="en"){d.classList.add("en");d.lang="en"}}catch(e){}})(document.documentElement)</script>\n' +
      '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
      '<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=Fraunces:ital,opsz,wght@0,9..144,400..700;1,9..144,400..700&display=swap" rel="stylesheet">\n' +
      '<link rel="stylesheet" href="/assets/site.css">';
  }

  function postCard(p, r, feature) {
    return '<a class="post-card reveal' + (feature ? ' feature' : '') + '" data-cat="' + esc(p.category) + '" href="' + (r === '/' ? '' : '') + (r + 'blog/' + p.slug + '.html') + '">' +
      '<div class="thumb"><img src="' + r + String(p.cover).replace(/^\//, '') + '" alt="' + esc(p.cover_alt || p.title) + '" width="1200" height="630" loading="lazy"></div>' +
      '<div class="txt"><div class="post-meta"><span>' + catLabel(p) + '</span><span>' + t(p.read_min + ' phút đọc', p.read_min + ' min read') + '</span></div>' +
      '<h3>' + t(esc(p.title), esc(p.title_en || p.title)) + '</h3><p>' + t(esc(p.excerpt), esc(p.excerpt_en || p.excerpt)) + '</p></div></a>';
  }

  function latest(posts, r) {
    var list = sortPosts(posts).slice(0, 3);
    if (!list.length) return '<p class="posts-empty">' + t('Bài viết đầu tiên sắp lên sóng.', 'First posts coming soon.') + '</p>';
    return list.map(function (p) { return postCard(p, r, false); }).join('\n');
  }

  function blogIndex(posts) {
    var list = sortPosts(posts), used = {};
    list.forEach(function (p) { used[p.category] = 1; });
    var filters = '<button type="button" data-cat="all" aria-pressed="true">' + t('Tất cả', 'All') + '</button>' +
      Object.keys(CATS).filter(function (k) { return used[k]; }).map(function (k) { return '<button type="button" data-cat="' + k + '" aria-pressed="false">' + t(CATS[k].vi, CATS[k].en) + '</button>'; }).join('');
    var cards = list.map(function (p, i) { return postCard(p, '', i === 0); }).join('\n');
    var cover = list[0] ? list[0].cover : '/images/poster-danang-og.jpg';
    var head = headTags({ title: 'Blog du lịch Đà Nẵng, visa & kinh nghiệm – TriTravel', ogTitle: 'Blog TriTravel – Đà Nẵng qua góc nhìn người bản địa', desc: 'Kinh nghiệm thực tế từ người Đà Nẵng: điểm đến, lịch trình, visa, ẩm thực và những góc mà chỉ dân địa phương mới biết.', path: '/blog.html', image: cover })
      .replace(/href="\/(favicon|apple|assets)/g, 'href="$1');
    return '<!DOCTYPE html>\n<html lang="vi">\n<head>\n' + head + '\n</head>\n<body>\n' + header('', 'blog', true) + '\n<main>\n' +
      '<section class="page-hero"><div class="wrap"><p class="eyebrow">' + t('Blog · Góc nhìn địa phương', 'Blog · A local point of view') + '</p>' +
      '<h1>' + t('Đà Nẵng, kể bởi <em>người ở đây</em>.', 'Da Nang, told by <em>someone who lives here</em>.') + '</h1>' +
      '<p>' + t('Điểm đến, lịch trình, visa và những mẹo nhỏ đúc kết từ hơn 8 năm dẫn khách – viết để bạn dùng được ngay.', 'Destinations, itineraries, visas and small tips from 8+ years of guiding – written to be used.') + '</p></div></section>\n' +
      '<section class="section"><div class="wrap">\n<div class="filters">' + filters + '</div>\n<div class="posts">\n' + cards +
      '\n<p class="posts-empty" hidden>' + t('Chưa có bài trong chuyên mục này.', 'No posts in this category yet.') + '</p>\n</div>\n' +
      '<div class="cta-band"><div><h2>' + t('Cần người lên lịch trình giúp?', 'Want someone to plan it for you?') + '</h2><p>' + t('Nhắn TriTravel số người, ngày đi và điều bạn thích – nhận lịch trình gợi ý và báo giá miễn phí.', 'Tell TriTravel your group size, dates and interests – get a suggested itinerary and quote for free.') + '</p></div>' +
      '<a class="btn btn-gold" href="./#contact">' + t('Nhận tư vấn miễn phí', 'Get free advice') + ' ' + icon('arrow') + '</a></div>\n' +
      '</div></section>\n</main>\n' + footer('') + '\n<script src="assets/site.js" defer></script>\n</body>\n</html>\n';
  }

  function withIds(body) {
    var toc = [], seen = {};
    var html = String(body || '').replace(/<h2(\s[^>]*)?>([\s\S]*?)<\/h2>/g, function (m, attrs, inner) {
      var text = inner.replace(/<[^>]+>/g, '').trim(), id = slugify(text) || 'muc';
      while (seen[id]) id += '-2';
      seen[id] = 1; toc.push([id, text]);
      return '<h2 id="' + id + '">' + inner + '</h2>';
    });
    return { html: html, toc: toc };
  }

  function postPage(post, posts) {
    var vi = withIds(post.body), hasEn = !!(post.body_en && post.body_en.replace(/<[^>]+>/g, '').trim());
    var en = hasEn ? withIds(post.body_en) : null;
    var isVisa = post.category === 'visa';
    var cta = isVisa
      ? { h: t('Cần người soát hồ sơ visa?', 'Need a second pair of eyes on your visa file?'), p: t('TriTravel tư vấn hồ sơ miễn phí, hỗ trợ dịch thuật công chứng và kiểm tra lại trước khi nộp.', 'TriTravel reviews your documents for free and handles certified translation before you submit.'), b: t('Tư vấn visa miễn phí', 'Free visa advice') }
      : { h: t('Muốn đi những nơi này cùng người bản địa?', 'Want to see these places with a local?'), p: t('Xe riêng, lịch trình theo ý bạn, và những góc không có trong brochure.', 'Private car, an itinerary shaped around you, and corners no brochure mentions.'), b: t('Đặt lịch tư vấn', 'Book a consultation') };
    var tocHtml = function (x) { return x.toc.map(function (i) { return '<li><a href="#' + i[0] + '">' + esc(i[1]) + '</a></li>'; }).join(''); };
    var toc = vi.toc.length ? '<aside class="toc"><h2>' + t('Trong bài này', 'In this article') + '</h2>' +
      (hasEn ? '<ol lang="vi">' + tocHtml(vi) + '</ol><ol lang="en">' + tocHtml(en) + '</ol>' : '<ol>' + tocHtml(vi) + '</ol>') +
      '<a class="btn btn-navy btn-sm" href="/#contact">' + cta.b + '</a></aside>' : '<div></div>';
    var related = sortPosts(posts).filter(function (p) { return p.slug !== post.slug; }).slice(0, 3);
    var url = SITE + postUrl(post);
    var ld = { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: post.title, description: post.excerpt, image: SITE + post.cover, datePublished: post.date, dateModified: post.updated || post.date, mainEntityOfPage: url, author: { '@type': 'Organization', name: 'TriTravel', url: SITE }, publisher: { '@type': 'Organization', name: 'TriTravel', logo: { '@type': 'ImageObject', url: SITE + '/images/logo/tritravel-logo.png' } } };
    return '<!DOCTYPE html>\n<html lang="vi">\n<head>\n' +
      headTags({ title: post.title + ' – TriTravel', ogTitle: post.title, desc: post.excerpt, path: postUrl(post), image: post.cover, imageAlt: post.cover_alt, type: 'article' }) +
      '\n<meta property="article:published_time" content="' + post.date + '">\n<script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, '\\u003c') + '</script>\n</head>\n<body>\n' +
      header('/', 'blog', true) + '\n<main>\n<article>\n' +
      '<header class="article-head"><div class="wrap">' +
      '<p class="crumbs"><a href="/">' + t('Trang chủ', 'Home') + '</a> / <a href="/blog.html">Blog</a></p>' +
      '<div class="post-meta"><span>' + catLabel(post) + '</span><span>' + t(fmtDate(post.date), fmtDate(post.date, true)) + '</span><span>' + t(post.read_min + ' phút đọc', post.read_min + ' min read') + '</span></div>' +
      '<h1>' + t(esc(post.title), esc(post.title_en || post.title)) + '</h1>' +
      '<p class="dek">' + t(esc(post.excerpt), esc(post.excerpt_en || post.excerpt)) + '</p>' +
      '<div class="byline"><img src="/images/TriTravel-portrait.jpg" alt="" width="42" height="42"><div><b>TriTravel</b>' + t('Người dẫn đường Đà Nẵng', 'Da Nang local guide') + '</div></div>' +
      '</div></header>\n' +
      '<div class="cover"><img src="' + esc(post.cover) + '" alt="' + esc(post.cover_alt || post.title) + '" width="1200" height="630"></div>\n' +
      '<div class="wrap article-grid">\n' + toc + '\n<div>\n' +
      (hasEn ? '<div class="prose" lang="vi">\n' + vi.html + '\n</div>\n<div class="prose" lang="en">\n' + en.html + '\n</div>' : '<div class="prose">\n' + vi.html + '\n</div>') +
      '\n<div class="share"><span>' + t('Chia sẻ bài viết:', 'Share:') + '</span>' +
      '<a class="btn btn-line btn-sm" href="https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url) + '" target="_blank" rel="noopener">Facebook</a>' +
      '<a class="btn btn-line btn-sm" href="https://wa.me/?text=' + encodeURIComponent(post.title + ' ' + url) + '" target="_blank" rel="noopener">WhatsApp</a>' +
      '<button class="btn btn-line btn-sm" type="button" data-copy>' + icon('link') + t('Sao chép link', 'Copy link') + '</button></div>\n' +
      '<div class="author"><img src="/images/TriTravel-portrait.jpg" alt="TriTravel" width="64" height="64" loading="lazy"><div><b>TriTravel</b><p>' +
      t('Sinh ra và lớn lên tại Đà Nẵng, hơn 8 năm dẫn tour, tư vấn visa và dịch thuật. Mọi bài viết đều từ trải nghiệm thực tế.', 'Born and raised in Da Nang, 8+ years guiding tours and advising on visas and translation. Every post comes from first-hand experience.') +
      '</p></div></div>\n</div>\n</div>\n</article>\n' +
      '<div class="wrap"><div class="cta-band"><div><h2>' + cta.h + '</h2><p>' + cta.p + '</p></div><a class="btn btn-gold" href="/#contact">' + cta.b + ' ' + icon('arrow') + '</a></div></div>\n' +
      (related.length ? '<section class="section"><div class="wrap"><div class="sec-head"><h2 class="h2">' + t('Đọc tiếp', 'Keep reading') + '</h2></div><div class="posts">' + related.map(function (p) { return postCard(p, '/', false); }).join('\n') + '</div></div></section>\n' : '<div style="height:96px"></div>\n') +
      '</main>\n' + footer('/') + '\n<script src="/assets/site.js" defer></script>\n</body>\n</html>\n';
  }

  function redirect(to) {
    return '<!DOCTYPE html>\n<html lang="vi">\n<head>\n<meta charset="UTF-8">\n<title>TriTravel</title>\n<link rel="canonical" href="' + SITE + to + '">\n<meta http-equiv="refresh" content="0; url=' + to + '">\n<meta name="robots" content="noindex">\n<script>location.replace(' + JSON.stringify(to) + ')</script>\n</head>\n<body><p>Bài viết đã chuyển sang <a href="' + to + '">' + SITE + to + '</a>.</p></body>\n</html>\n';
  }

  function sitemap(posts) {
    var urls = [['/', ''], ['/cau-chuyen.html', ''], ['/blog.html', ''], ['/visa/', ''], ['/visamy/', '']].concat(sortPosts(posts).map(function (p) { return [postUrl(p), p.updated || p.date]; }));
    return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      urls.map(function (u) { return '  <url><loc>' + SITE + u[0] + '</loc>' + (u[1] ? '<lastmod>' + u[1] + '</lastmod>' : '') + '</url>'; }).join('\n') + '\n</urlset>\n';
  }

  /* Thay nội dung giữa <!-- name:start --> và <!-- name:end --> */
  function inject(html, name, content) {
    var a = '<!-- ' + name + ':start -->', b = '<!-- ' + name + ':end -->';
    var i = html.indexOf(a), j = html.indexOf(b);
    if (i < 0 || j < 0) return html;
    return html.slice(0, i + a.length) + '\n' + content + '\n' + html.slice(j);
  }

  function summary(p) {
    var o = {};
    ['slug', 'title', 'title_en', 'excerpt', 'excerpt_en', 'category', 'date', 'updated', 'read_min', 'cover', 'cover_alt', 'draft'].forEach(function (k) { if (p[k] !== undefined && p[k] !== '') o[k] = p[k]; });
    return o;
  }
  function readMinutes(body) { var w = String(body || '').replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length; return Math.max(1, Math.round(w / 230)); }

  return { SITE: SITE, CATS: CATS, esc: esc, slugify: slugify, fmtDate: fmtDate, sortPosts: sortPosts, header: header, footer: footer, headTags: headTags, postCard: postCard, latest: latest, blogIndex: blogIndex, postPage: postPage, redirect: redirect, sitemap: sitemap, inject: inject, summary: summary, readMinutes: readMinutes, postUrl: postUrl };
});
