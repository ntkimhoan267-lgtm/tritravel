/* TriTravel – hành vi dùng chung: ngôn ngữ, menu, hiệu ứng, form liên hệ, lọc blog. */
(function () {
  var doc = document, root = doc.documentElement;
  var PHONE = '84935191394', ZALO = 'https://zalo.me/0935191394', EMAIL = 'TriTravel.vn@gmail.com';

  function isEn() { return root.classList.contains('en'); }
  function setLang(l) {
    root.classList.toggle('en', l === 'en');
    root.lang = l;
    try { localStorage.setItem('TriTravel-lang', l); } catch (e) {}
  }
  doc.addEventListener('click', function (e) {
    var b = e.target.closest('[data-set]');
    if (b) setLang(b.getAttribute('data-set'));
  });

  // Header
  var header = doc.querySelector('.site-header');
  if (header) {
    var onScroll = function () { header.classList.toggle('scrolled', window.scrollY > 40); };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
    var mb = header.querySelector('.menu-btn');
    if (mb) mb.addEventListener('click', function () {
      var open = header.classList.toggle('open');
      mb.setAttribute('aria-expanded', open);
    });
    header.addEventListener('click', function (e) {
      if (e.target.closest('.mobile-nav a')) header.classList.remove('open');
    });
  }

  // Header ẩn khi cuộn xuống, hiện khi cuộn lên
  if (header && !header.classList.contains('solid')) {
    var lastY = window.scrollY;
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      if (!header.classList.contains('open')) header.classList.toggle('hide', y > lastY && y > 320);
      lastY = y;
    }, { passive: true });
  }

  // Đổi tông màu cả trang theo phần đang ở giữa màn hình (trang chủ)
  var themed = doc.querySelectorAll('section[data-theme]');
  if (themed.length) {
    var body = doc.body, base = body.getAttribute('data-theme') || 'paper', ticking = false;
    root.classList.add('fx');
    var pick = function () {
      ticking = false;
      var mid = window.innerHeight * 0.55, t = base;
      for (var i = 0; i < themed.length; i++) {
        var r = themed[i].getBoundingClientRect();
        if (r.top < mid && r.bottom > mid) { t = themed[i].getAttribute('data-theme'); break; }
        if (r.top < mid) t = themed[i].getAttribute('data-theme');
      }
      if (body.getAttribute('data-theme') !== t) body.setAttribute('data-theme', t);
    };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(pick); } }, { passive: true });
    window.addEventListener('resize', pick);
    pick();
  }

  // Hiệu ứng xuất hiện khi cuộn
  var items = doc.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    items.forEach(function (el) { io.observe(el); });
  } else items.forEach(function (el) { el.classList.add('in'); });

  // Nút "Đặt tour" / "Tư vấn" điền sẵn dịch vụ + ghi chú vào form
  doc.addEventListener('click', function (e) {
    var a = e.target.closest('[data-service]');
    if (!a) return;
    var sel = doc.getElementById('f-service'), note = doc.getElementById('f-note');
    if (sel) sel.value = a.getAttribute('data-service');
    var n = a.getAttribute(isEn() ? 'data-note-en' : 'data-note') || a.getAttribute('data-note');
    if (note && n && !note.value) note.value = n;
  });

  // Form liên hệ: soạn sẵn tin nhắn rồi mở Zalo / WhatsApp / email.
  // Nếu form có data-endpoint (vd. Google Apps Script) thì gửi thêm một bản về đó.
  var form = doc.getElementById('contact-form');
  if (form) {
    var msg = form.querySelector('.form-msg');
    var say = function (vi, en, err) {
      msg.textContent = isEn() ? en : vi;
      msg.className = 'form-msg show' + (err ? ' err' : '');
    };
    var compose = function () {
      var v = function (id) { return (doc.getElementById(id).value || '').trim(); };
      var name = v('f-name'), phone = v('f-phone');
      if (!name || !phone) {
        say('Bạn vui lòng điền họ tên và số điện thoại nhé.', 'Please fill in your name and phone number.', true);
        doc.getElementById(name ? 'f-phone' : 'f-name').focus();
        return null;
      }
      var sel = doc.getElementById('f-service');
      var service = sel.value ? sel.options[sel.selectedIndex].text.trim() : '';
      var lines = ['Chào TriTravel, mình cần tư vấn:', '• Họ tên: ' + name, '• Điện thoại: ' + phone];
      if (v('f-email')) lines.push('• Email: ' + v('f-email'));
      if (service) lines.push('• Dịch vụ: ' + service);
      if (v('f-note')) lines.push('• Ghi chú: ' + v('f-note'));
      var text = lines.join('\n');
      var ep = form.getAttribute('data-endpoint');
      if (ep) { try { fetch(ep, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ name: name, phone: phone, email: v('f-email'), service: service, note: v('f-note'), page: location.href }) }); } catch (e) {} }
      return text;
    };
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    form.addEventListener('click', function (e) {
      var b = e.target.closest('[data-send]');
      if (!b) return;
      e.preventDefault();
      var text = compose();
      if (!text) return;
      var how = b.getAttribute('data-send');
      if (how === 'whatsapp') {
        window.open('https://wa.me/' + PHONE + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
        say('Đã mở WhatsApp với nội dung soạn sẵn – bạn bấm Gửi là xong.', 'WhatsApp opened with your message – just press Send.');
      } else if (how === 'email') {
        location.href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent('Yêu cầu tư vấn – TriTravel') + '&body=' + encodeURIComponent(text);
        say('Đã mở ứng dụng email với nội dung soạn sẵn.', 'Your email app opened with the message ready.');
      } else {
        var open = function () { window.open(ZALO, '_blank', 'noopener'); };
        var done = function () { say('Đã sao chép nội dung. Zalo đang mở – bạn dán (Paste) vào khung chat và gửi nhé.', 'Message copied. Zalo is opening – paste it into the chat and send.'); open(); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, done); else done();
      }
    });
  }

  // Lọc bài viết theo chuyên mục (blog.html)
  var filters = doc.querySelector('.filters');
  if (filters) filters.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var cat = b.getAttribute('data-cat'), shown = 0;
    filters.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
    doc.querySelectorAll('.posts .post-card').forEach(function (c) {
      var ok = cat === 'all' || c.getAttribute('data-cat') === cat;
      c.hidden = !ok; if (ok) shown++;
      c.classList.toggle('feature', false);
    });
    var first = doc.querySelector('.posts .post-card:not([hidden])');
    if (first && cat === 'all') first.classList.add('feature');
    var empty = doc.querySelector('.posts-empty'); if (empty) empty.hidden = shown > 0;
  });

  // Sao chép link bài viết
  doc.addEventListener('click', function (e) {
    var b = e.target.closest('[data-copy]'); if (!b) return;
    var done = function () { var old = b.innerHTML; b.textContent = isEn() ? 'Copied!' : 'Đã sao chép!'; setTimeout(function () { b.innerHTML = old; }, 1800); };
    if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(done, done);
  });
})();
