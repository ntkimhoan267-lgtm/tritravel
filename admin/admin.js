/* TriTravel Dashboard – soạn và đăng bài blog.
   Không có máy chủ: trình duyệt dựng HTML bằng assets/render.js rồi commit lên GitHub
   (data/posts/<slug>.json, blog/<slug>.html, blog.html, sitemap.xml, index.html, ảnh). */
(function () {
  'use strict';
  var R = window.TTRender, $ = function (id) { return document.getElementById(id); };
  var KEY = 'TriTravel-admin', DRAFT = 'TriTravel-admin-draft';
  var cfg = null, posts = [], cur = null, pending = {}, coverSrc = null, corner = 'top-right', logos = {};

  /* ---------- tiện ích ---------- */
  function toast(msg, err, keep) {
    var t = $('toast'); t.textContent = msg; t.className = 'toast' + (err ? ' err' : ''); t.hidden = false;
    clearTimeout(toast.t); if (!keep) toast.t = setTimeout(function () { t.hidden = true; }, err ? 9000 : 4000);
  }
  function show(v) { ['v-login', 'v-list', 'v-edit'].forEach(function (x) { $(x).hidden = x !== v; }); $('logout').hidden = v === 'v-login'; window.scrollTo(0, 0); }
  function today() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function b64utf8(s) { var b = new TextEncoder().encode(s), o = ''; for (var i = 0; i < b.length; i += 0x8000) o += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(o); }
  function utf8b64(s) { var bin = atob(s.replace(/\s/g, '')), b = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i); return new TextDecoder().decode(b); }
  function busy(on, msg) { document.querySelector('.adm').classList.toggle('busy', on); if (on) toast(msg || 'Đang xử lý…', false, true); }

  /* ---------- GitHub ---------- */
  function api(path, opt) {
    opt = opt || {};
    var h = { Authorization: 'Bearer ' + cfg.token, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
    if (opt.body) h['Content-Type'] = 'application/json';
    return fetch('https://api.github.com/repos/' + cfg.repo + path, { method: opt.method || 'GET', headers: h, body: opt.body ? JSON.stringify(opt.body) : undefined, cache: 'no-store' })
      .then(function (r) {
        if (r.ok) return r.status === 204 ? null : r.json();
        return r.json().catch(function () { return {}; }).then(function (j) {
          var m = j.message || r.statusText;
          if (r.status === 401) m = 'Token không hợp lệ hoặc đã hết hạn.';
          if (r.status === 403) m = 'Token không có quyền với kho mã này (cần Contents: Read and write). ' + m;
          if (r.status === 404) m = 'Không tìm thấy ' + (path.split('?')[0] || 'kho mã') + ' trên nhánh ' + cfg.branch + ' – kiểm tra tên kho, nhánh và quyền của token.';
          var e = new Error(m); e.status = r.status; throw e;
        });
      });
  }
  function getText(path) { return api('/contents/' + path + '?ref=' + encodeURIComponent(cfg.branch)).then(function (j) { return utf8b64(j.content); }); }
  function getJSON(path) { return getText(path).then(JSON.parse); }
  /* files: [{path, text} | {path, base64} | {path, remove:true}] -> một commit duy nhất */
  function commit(files, message) {
    var ref = '/git/refs/heads/' + cfg.branch, head;
    return api('/git/ref/heads/' + cfg.branch).then(function (r) {
      head = r.object.sha; return api('/git/commits/' + head);
    }).then(function (c) {
      return Promise.all(files.map(function (f) {
        if (f.remove) return { path: f.path, mode: '100644', type: 'blob', sha: null };
        return api('/git/blobs', { method: 'POST', body: f.base64 ? { content: f.base64, encoding: 'base64' } : { content: b64utf8(f.text), encoding: 'base64' } })
          .then(function (b) { return { path: f.path, mode: '100644', type: 'blob', sha: b.sha }; });
      })).then(function (tree) { return api('/git/trees', { method: 'POST', body: { base_tree: c.tree.sha, tree: tree } }); });
    }).then(function (t) {
      return api('/git/commits', { method: 'POST', body: { message: message, tree: t.sha, parents: [head] } });
    }).then(function (c) { return api(ref, { method: 'PATCH', body: { sha: c.sha } }); });
  }

  /* ---------- ảnh: cắt cỡ + đóng logo (cùng quy tắc với scripts/stamp-logo.py) ---------- */
  function loadImg(src) { return new Promise(function (ok, no) { var i = new Image(); i.onload = function () { ok(i); }; i.onerror = function () { no(new Error('Không đọc được ảnh')); }; i.src = src; }); }
  function fileUrl(file) { return new Promise(function (ok) { var r = new FileReader(); r.onload = function () { ok(r.result); }; r.readAsDataURL(file); }); }
  function getLogos() {
    if (logos.navy) return Promise.resolve(logos);
    return Promise.all([loadImg('/images/logo/tritravel-logo.png'), loadImg('/images/logo/tritravel-logo-white.png')]).then(function (a) { logos.navy = a[0]; logos.white = a[1]; return logos; });
  }
  /* size = [w,h] để cắt đúng cỡ (ảnh bìa); null = giữ tỉ lệ, rộng tối đa 1400 (ảnh trong bài) */
  function processImage(img, size, where, focus) {
    return getLogos().then(function (lg) {
      var W, H, c = document.createElement('canvas'), x = c.getContext('2d');
      if (size) {
        W = size[0]; H = size[1];
        var s = Math.max(W / img.width, H / img.height), dw = img.width * s, dh = img.height * s, f = (focus == null ? 50 : focus) / 100;
        c.width = W; c.height = H; x.drawImage(img, (W - dw) * f, (H - dh) * f, dw, dh);
      } else {
        W = Math.min(1400, img.width); H = Math.round(img.height * W / img.width);
        c.width = W; c.height = H; x.drawImage(img, 0, 0, W, H);
      }
      var lw = Math.max(48, Math.round(W * 0.22)), lh = Math.round(lw * lg.navy.height / lg.navy.width), m = Math.round(W * 0.03);
      var px = where.indexOf('left') >= 0 ? m : W - lw - m, py = where.indexOf('top') >= 0 ? m : H - lh - m;
      var d = x.getImageData(px, py, lw, lh).data, sum = 0, n = 0;
      for (var i = 0; i < d.length; i += 16) { sum += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; n++; }
      var light = sum / n > 140, logo = light ? lg.navy : lg.white;
      x.save(); x.shadowColor = light ? 'rgba(255,255,255,.95)' : 'rgba(8,20,50,.95)'; x.shadowBlur = Math.max(12, lw / 10);
      for (var k = 0; k < 3; k++) x.drawImage(logo, px, py, lw, lh);
      x.restore(); x.drawImage(logo, px, py, lw, lh);
      return c.toDataURL('image/jpeg', 0.86);
    });
  }

  /* ---------- làm sạch HTML ---------- */
  var ALLOW = { P: 1, H2: 1, H3: 1, STRONG: 1, EM: 1, A: 1, UL: 1, OL: 1, LI: 1, BLOCKQUOTE: 1, FIGURE: 1, FIGCAPTION: 1, IMG: 1, DIV: 1, DL: 1, DT: 1, DD: 1, TABLE: 1, THEAD: 1, TBODY: 1, TR: 1, TH: 1, TD: 1, DETAILS: 1, SUMMARY: 1, HR: 1, BR: 1 };
  var CLASSES = { note: 1, warn: 1, facts: 1, meta: 1, 'steps-list': 1 };
  function clean(html) {
    var doc = new DOMParser().parseFromString('<div id="r">' + html + '</div>', 'text/html'), root = doc.getElementById('r');
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (el) {
        if (el.nodeType === 8) { el.remove(); return; }
        if (el.nodeType !== 1) return;
        var tag = el.tagName;
        if (/^(SCRIPT|STYLE|META|LINK|IFRAME|OBJECT|TITLE|SVG|FORM|INPUT|BUTTON)$/.test(tag)) { el.remove(); return; }
        walk(el);
        var map = { B: 'strong', I: 'em', H1: 'h2', H4: 'h3', H5: 'h3', H6: 'h3' }[tag];
        if (map) { var n = doc.createElement(map); while (el.firstChild) n.appendChild(el.firstChild); el.replaceWith(n); el = n; tag = n.tagName; }
        var cls = (el.getAttribute('class') || '').split(/\s+/).filter(function (c) { return CLASSES[c]; }).join(' ');
        if (!ALLOW[tag] || (tag === 'DIV' && !cls)) { while (el.firstChild) el.parentNode.insertBefore(el.firstChild, el); el.remove(); return; }
        var keep = {};
        if (tag === 'A') { var h = el.getAttribute('href') || ''; if (/^(https?:|mailto:|tel:|\/|#)/i.test(h)) keep.href = h; if (/^https?:/i.test(h) && h.indexOf('tritravel.vn') < 0) { keep.target = '_blank'; keep.rel = 'noopener'; } }
        if (tag === 'IMG') { keep.src = el.getAttribute('data-path') || el.getAttribute('src') || ''; keep.alt = el.getAttribute('alt') || ''; keep.loading = 'lazy'; if (el.getAttribute('data-path')) keep['data-path'] = el.getAttribute('data-path'); }
        if (cls) keep['class'] = cls;
        Array.prototype.slice.call(el.attributes).forEach(function (a) { el.removeAttribute(a.name); });
        Object.keys(keep).forEach(function (k) { el.setAttribute(k, keep[k]); });
      });
    })(root);
    // chữ trần ở cấp ngoài cùng -> bọc vào <p>
    Array.prototype.slice.call(root.childNodes).forEach(function (n) {
      if ((n.nodeType === 3 && n.textContent.trim()) || (n.nodeType === 1 && /^(STRONG|EM|A|BR)$/.test(n.tagName))) { var p = doc.createElement('p'); n.replaceWith(p); p.appendChild(n); }
    });
    root.querySelectorAll('p,h2,h3,li').forEach(function (e) { if (!e.textContent.trim() && !e.querySelector('img')) e.remove(); });
    return root.innerHTML.replace(/&nbsp;/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  }
  /* HTML để lưu: ảnh mới dùng đường dẫn thật thay cho data URL */
  function bodyForSave() {
    if (!$('html').hidden) $('editor').innerHTML = bodyForEditor(clean($('html').value));
    return clean($('editor').innerHTML).replace(/ data-path="[^"]*"/g, '');
  }
  function bodyForEditor(html) {
    var d = document.createElement('div'); d.innerHTML = html;
    d.querySelectorAll('img').forEach(function (i) { var p = i.getAttribute('src'); if (pending[p.replace(/^\//, '')]) { i.setAttribute('data-path', p); i.src = 'data:image/jpeg;base64,' + pending[p.replace(/^\//, '')]; } });
    return d.innerHTML;
  }

  /* ---------- danh sách ---------- */
  function loadList() {
    busy(true, 'Đang tải danh sách bài…');
    return getJSON('data/posts.json').then(function (l) { posts = l; renderList(); show('v-list'); $('toast').hidden = true; })
      .catch(function (e) { if (e.status === 401) { logout(); } toast('Không tải được danh sách: ' + e.message, true); })
      .then(function () { busy(false); });
  }
  function renderList() {
    var pub = posts.filter(function (p) { return !p.draft; }).length;
    $('list-sub').textContent = pub + ' bài đã đăng' + (posts.length - pub ? ' · ' + (posts.length - pub) + ' bản nháp' : '');
    $('rows').innerHTML = posts.length ? posts.map(function (p) {
      return '<tr><td style="width:128px">' + (p.cover ? '<img src="' + R.esc(p.cover) + '" alt="" loading="lazy">' : '') + '</td>' +
        '<td><b>' + R.esc(p.title) + '</b><span class="muted">' + R.fmtDate(p.date) + ' · ' + ((R.CATS[p.category] || {}).vi || '') + '</span></td>' +
        '<td><span class="pill' + (p.draft ? ' draft' : '') + '">' + (p.draft ? 'Bản nháp' : 'Đã đăng') + '</span></td>' +
        '<td><div class="acts">' + (p.draft ? '' : '<a class="mini" target="_blank" rel="noopener" href="' + R.postUrl(p) + '">Xem</a>') +
        '<button class="mini" data-edit="' + p.slug + '">Sửa</button><button class="mini danger" data-del="' + p.slug + '">Xoá</button></div></td></tr>';
    }).join('') : '<tr><td class="muted" style="padding:28px 10px">Chưa có bài nào. Bấm “Viết bài mới” để bắt đầu.</td></tr>';
  }

  /* ---------- soạn bài ---------- */
  function openEditor(post) {
    cur = post; pending = {}; coverSrc = null; corner = 'top-right';
    $('p-title').value = post.title || ''; $('p-excerpt').value = post.excerpt || '';
    $('p-alt').value = post.cover_alt || ''; $('p-cat').value = post.category || 'diem-den';
    $('p-date').value = post.date || today(); $('p-title-en').value = post.title_en || ''; $('p-excerpt-en').value = post.excerpt_en || '';
    $('editor').innerHTML = post.body || ''; $('html').hidden = true; $('editor').hidden = !!post.url; $('tb').hidden = !!post.url;
    $('own-page').hidden = !post.url; if (post.url) $('own-page-link').href = post.url;
    $('cover-box').innerHTML = post.cover ? '<img src="' + R.esc(post.cover) + '" alt="">' : '<span>Bấm để chọn ảnh<br>Tự cắt đúng cỡ và đóng logo TriTravel</span>';
    $('focus').value = 50; setCorner('top-right');
    $('publish-btn').textContent = post._published ? 'Cập nhật bài đã đăng' : 'Đăng bài';
    $('draft-btn').textContent = post._published ? 'Gỡ về bản nháp' : 'Lưu nháp (chưa hiện trên web)';
    counts(); slugHint(); show('v-edit');
  }
  function counts() { $('c-excerpt').textContent = $('p-excerpt').value.length + '/200'; }
  function slugFor() {
    if (cur.slug) return cur.slug;
    var base = R.slugify($('p-title').value) || 'bai-viet', s = base, i = 2;
    while (posts.some(function (p) { return p.slug === s; })) s = base + '-' + i++;
    return s;
  }
  function slugHint() { $('p-url').textContent = $('p-title').value ? 'Địa chỉ: tritravel.vn/blog/' + slugFor() + '.html' : ''; }
  function setCorner(v) { corner = v; $('corner').querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-v') === v); }); }
  function redrawCover() {
    if (!coverSrc) return;
    processImage(coverSrc, [1200, 630], corner, +$('focus').value).then(function (url) {
      cur._cover = url; $('cover-box').innerHTML = '<img src="' + url + '" alt="">';
    }).catch(function (e) { toast(e.message, true); });
  }
  function collect(draft) {
    var slug = slugFor(), body = bodyForSave();
    var p = {
      slug: slug, title: $('p-title').value.trim(), title_en: $('p-title-en').value.trim(), excerpt: $('p-excerpt').value.trim(), excerpt_en: $('p-excerpt-en').value.trim(),
      category: $('p-cat').value, date: $('p-date').value || today(), read_min: R.readMinutes(body),
      cover: cur._cover ? '/images/blog/' + slug + '.jpg' : (cur.cover || ''), cover_alt: $('p-alt').value.trim() || $('p-title').value.trim(), body: body
    };
    if (cur.body_en) p.body_en = cur.body_en;
    if (cur.legacy) p.legacy = cur.legacy;
    if (cur.url) p.url = cur.url;
    if (cur._published && !draft) p.updated = today();
    if (draft) p.draft = true;
    return p;
  }
  function validate(p, draft) {
    if (!p.title) return 'Bài viết cần có tiêu đề.';
    if (draft) return '';
    if (!p.excerpt) return 'Thêm mô tả ngắn – phần này hiện trên Google và khi chia sẻ.';
    if (!p.cover) return 'Chọn ảnh bìa trước khi đăng.';
    if (!p.url && p.body.replace(/<[^>]+>/g, '').trim().length < 80) return 'Nội dung bài còn quá ngắn.';
    return '';
  }

  function save(draft) {
    var p = collect(draft), err = validate(p, draft);
    if (err) { toast(err, true); return; }
    if (cur._published && draft && !confirm('Gỡ bài này khỏi website và chuyển về bản nháp?')) return;
    busy(true, draft ? 'Đang lưu nháp…' : 'Đang đăng bài…');
    var files = [], wasPublished = !!cur._published;
    getJSON('data/posts.json').then(function (list) {
      var i = list.findIndex(function (x) { return x.slug === p.slug; });
      if (i >= 0) list[i] = R.summary(p); else list.unshift(R.summary(p));
      posts = list;
      files.push({ path: 'data/posts/' + p.slug + '.json', text: JSON.stringify(p, null, 1) + '\n' });
      if (cur._cover) files.push({ path: 'images/blog/' + p.slug + '.jpg', base64: cur._cover.split(',')[1] });
      Object.keys(pending).forEach(function (k) { if (p.body.indexOf('/' + k) >= 0) files.push({ path: k, base64: pending[k] }); });
      if (draft && wasPublished && !p.url) files.push({ path: 'blog/' + p.slug + '.html', remove: true });
      return rebuild(list, p, files);
    }).then(function () {
      return commit(files, (draft ? 'Lưu nháp: ' : wasPublished ? 'Cập nhật bài: ' : 'Đăng bài: ') + p.title);
    }).then(function () {
      try { localStorage.removeItem(DRAFT); } catch (e) {}
      busy(false); renderList(); show('v-list');
      toast(draft ? 'Đã lưu bản nháp.' : 'Đã đăng! Website sẽ cập nhật sau 1–2 phút.');
    }).catch(function (e) { busy(false); toast('Chưa lưu được: ' + e.message, true); });
  }

  /* Dựng lại mọi trang phụ thuộc danh sách bài. changed = bài vừa sửa (đã có nội dung). */
  function rebuild(list, changed, files) {
    var pub = list.filter(function (x) { return !x.draft && !x.url; });
    return Promise.all(pub.map(function (s) {
      return changed && s.slug === changed.slug ? changed : getJSON('data/posts/' + s.slug + '.json');
    })).then(function (full) {
      full.forEach(function (fp) { files.push({ path: 'blog/' + fp.slug + '.html', text: R.postPage(fp, list) }); });
      files.push({ path: 'data/posts.json', text: JSON.stringify(list, null, 1) + '\n' });
      files.push({ path: 'blog.html', text: R.blogIndex(list) });
      files.push({ path: 'sitemap.xml', text: R.sitemap(list) });
      return getText('index.html');
    }).then(function (home) {
      files.push({ path: 'index.html', text: R.inject(home, 'latest-posts', R.latest(list, '')) });
    });
  }

  function removePost(slug) {
    var p = posts.find(function (x) { return x.slug === slug; });
    if (!p || !confirm('Xoá hẳn bài “' + p.title + '”? Không khôi phục được từ dashboard.')) return;
    busy(true, 'Đang xoá…');
    var files = [{ path: 'data/posts/' + slug + '.json', remove: true }];
    if (!p.draft && !p.url) files.push({ path: 'blog/' + slug + '.html', remove: true });
    getJSON('data/posts.json').then(function (list) {
      list = list.filter(function (x) { return x.slug !== slug; }); posts = list;
      return rebuild(list, null, files);
    }).then(function () { return commit(files, 'Xoá bài: ' + p.title); })
      .then(function () { busy(false); renderList(); toast('Đã xoá bài.'); })
      .catch(function (e) { busy(false); toast('Chưa xoá được: ' + e.message, true); });
  }

  /* ---------- thanh công cụ ---------- */
  function insertHtml(h) { $('editor').focus(); document.execCommand('insertHTML', false, h); }
  function tool(b) {
    var c = b.getAttribute('data-c'), blk = b.getAttribute('data-b'), a = b.getAttribute('data-a');
    if (a === 'html') {
      var on = $('html').hidden;
      if (on) $('html').value = clean($('editor').innerHTML).replace(/></g, '>\n<'); else $('editor').innerHTML = bodyForEditor(clean($('html').value));
      $('html').hidden = !on; $('editor').hidden = on; b.textContent = on ? '← Soạn thảo' : 'HTML'; return;
    }
    if (!$('html').hidden) return;
    $('editor').focus();
    if (c) document.execCommand(c);
    else if (blk) document.execCommand('formatBlock', false, blk);
    else if (a === 'link') { var u = prompt('Dán đường link (https://…):'); if (u) document.execCommand('createLink', false, u.trim()); }
    else if (a === 'note') insertHtml('<div class="note"><p><strong>Mẹo:</strong> viết mẹo ở đây.</p></div><p><br></p>');
    else if (a === 'warn') insertHtml('<div class="note warn"><p><strong>Lưu ý:</strong> viết lưu ý ở đây.</p></div><p><br></p>');
    else if (a === 'meta') insertHtml('<p class="meta">Địa điểm · Giờ đẹp nhất · Cách đi</p><p><br></p>');
    else if (a === 'steps') insertHtml('<ol class="steps-list"><li><strong>Bước 1.</strong> Mô tả.</li><li><strong>Bước 2.</strong> Mô tả.</li></ol><p><br></p>');
    else if (a === 'faq') insertHtml('<details open><summary>Câu hỏi?</summary><p>Câu trả lời.</p></details><p><br></p>');
    else if (a === 'img') $('img-file').click();
  }

  /* ---------- sự kiện ---------- */
  function logout() { try { localStorage.removeItem(KEY); } catch (e) {} cfg = null; show('v-login'); }
  function login() {
    var t = $('token').value.trim(); if (!t) { toast('Dán token vào ô trước đã.', true); return; }
    cfg = { token: t, repo: $('repo').value.trim(), branch: $('branch').value.trim() || 'main' };
    busy(true, 'Đang kiểm tra…');
    api('').then(function (r) {
      if (r.permissions && r.permissions.push === false) throw new Error('Token chưa có quyền ghi (Contents: Read and write).');
      try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch (e) {}
      $('token').value = ''; busy(false); return loadList();
    }).catch(function (e) { busy(false); cfg = null; toast(e.message, true); });
  }

  document.addEventListener('DOMContentLoaded', function () {
    $('p-cat').innerHTML = Object.keys(R.CATS).map(function (k) { return '<option value="' + k + '">' + R.CATS[k].vi + '</option>'; }).join('');
    $('login-btn').onclick = login; $('logout').onclick = function () { if (confirm('Đăng xuất và xoá token khỏi máy này?')) logout(); };
    $('token').addEventListener('keydown', function (e) { if (e.key === 'Enter') login(); });
    $('new-btn').onclick = function () {
      var d = null; try { d = JSON.parse(localStorage.getItem(DRAFT)); } catch (e) {}
      if (d && d.title && confirm('Có bản đang viết dở “' + d.title + '”. Mở lại?')) openEditor(d); else openEditor({});
    };
    $('back-btn').onclick = function () { show('v-list'); };
    $('rows').addEventListener('click', function (e) {
      var ed = e.target.closest('[data-edit]'), del = e.target.closest('[data-del]');
      if (del) removePost(del.getAttribute('data-del'));
      if (ed) { busy(true, 'Đang mở bài…'); getJSON('data/posts/' + ed.getAttribute('data-edit') + '.json').then(function (p) { p._published = !p.draft; busy(false); $('toast').hidden = true; openEditor(p); }).catch(function (er) { busy(false); toast(er.message, true); }); }
    });
    $('tb').addEventListener('mousedown', function (e) { if (e.target.closest('button')) e.preventDefault(); });
    $('tb').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) tool(b); });
    $('editor').addEventListener('paste', function (e) {
      var h = e.clipboardData.getData('text/html'), tx = e.clipboardData.getData('text/plain');
      e.preventDefault();
      insertHtml(h ? clean(h) : tx.split(/\n{2,}/).map(function (s) { return '<p>' + R.esc(s).replace(/\n/g, '<br>') + '</p>'; }).join(''));
    });
    $('p-title').addEventListener('input', slugHint); $('p-excerpt').addEventListener('input', counts);
    $('cover-box').onclick = function () { $('cover-file').click(); };
    $('cover-file').onchange = function () { var f = this.files[0]; this.value = ''; if (!f) return; fileUrl(f).then(loadImg).then(function (i) { coverSrc = i; redrawCover(); }).catch(function (e) { toast(e.message, true); }); };
    $('focus').addEventListener('input', redrawCover);
    $('corner').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) { setCorner(b.getAttribute('data-v')); redrawCover(); } });
    $('img-file').onchange = function () {
      var f = this.files[0]; this.value = ''; if (!f) return;
      var alt = prompt('Mô tả ngắn cho ảnh (hiện làm chú thích):', '') || '';
      fileUrl(f).then(loadImg).then(function (i) { return processImage(i, null, 'top-right'); }).then(function (url) {
        var path = 'images/blog/' + slugFor() + '-' + Date.now().toString(36) + '.jpg';
        pending[path] = url.split(',')[1];
        insertHtml('<figure><img src="' + url + '" data-path="/' + path + '" alt="' + R.esc(alt) + '">' + (alt ? '<figcaption>' + R.esc(alt) + '</figcaption>' : '') + '</figure><p><br></p>');
      }).catch(function (e) { toast(e.message, true); });
    };
    $('publish-btn').onclick = function () { save(false); }; $('draft-btn').onclick = function () { save(true); };
    $('preview-btn').onclick = function () {
      var p = collect(false); if (!p.title) { toast('Thêm tiêu đề để xem trước.', true); return; }
      var html = R.postPage(p, posts.filter(function (x) { return x.slug !== p.slug; }).concat([R.summary(p)]));
      html = html.replace('<head>', '<head><base href="' + location.origin + '/">');
      if (cur._cover) html = html.split('"' + p.cover + '"').join('"' + cur._cover + '"');
      Object.keys(pending).forEach(function (k) { html = html.split('"/' + k + '"').join('"data:image/jpeg;base64,' + pending[k] + '"'); });
      $('pv').srcdoc = html; $('modal').hidden = false;
    };
    $('modal-close').onclick = function () { $('modal').hidden = true; $('pv').srcdoc = ''; };
    $('modal').addEventListener('click', function (e) { var b = e.target.closest('[data-pv]'); if (b) $('pv').classList.toggle('phone', b.getAttribute('data-pv') === 'phone'); });
    // tự lưu bản đang viết vào máy (không gồm ảnh mới) phòng khi lỡ đóng tab
    setInterval(function () {
      if ($('v-edit').hidden || !cur || cur._published || !$('p-title').value) return;
      try { var d = collect(true); delete d.draft; d.body = d.body.replace(/<figure>.*?<\/figure>/g, ''); localStorage.setItem(DRAFT, JSON.stringify(d)); } catch (e) {}
    }, 8000);
    window.addEventListener('beforeunload', function (e) { if (!$('v-edit').hidden && $('p-title').value) { e.preventDefault(); e.returnValue = ''; } });

    try { cfg = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
    if (cfg && cfg.token) loadList(); else show('v-login');
  });
})();
