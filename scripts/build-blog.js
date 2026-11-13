#!/usr/bin/env node
/* Dựng lại toàn bộ blog từ data/posts/*.json:
     node scripts/build-blog.js
   Sinh: blog/<slug>.html, blog.html, sitemap.xml, data/posts.json,
   và chèn header / footer / bài mới nhất vào index.html.
   Dashboard /admin/ làm đúng việc này trong trình duyệt bằng cùng file assets/render.js. */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const R = require(path.join(ROOT, 'assets', 'render.js'));
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const wr = (f, s) => { fs.mkdirSync(path.dirname(path.join(ROOT, f)), { recursive: true }); fs.writeFileSync(path.join(ROOT, f), s); console.log('  ' + f); };

const order = JSON.parse(rd('data/posts.json')).map(p => p.slug);
const posts = fs.readdirSync(path.join(ROOT, 'data/posts')).filter(f => f.endsWith('.json')).map(f => JSON.parse(rd('data/posts/' + f)));
posts.sort((a, b) => (order.indexOf(a.slug) + 1 || 1e9) - (order.indexOf(b.slug) + 1 || 1e9));
const list = posts.map(R.summary);

wr('data/posts.json', JSON.stringify(list, null, 1) + '\n');
posts.filter(p => !p.draft && !p.url).forEach(p => {
  wr('blog/' + p.slug + '.html', R.postPage(p, list));
  if (p.legacy) wr(p.legacy.replace(/^\//, ''), R.redirect(R.postUrl(p)));
});
wr('blog.html', R.blogIndex(list));
wr('sitemap.xml', R.sitemap(list));
let home = rd('index.html');
home = R.inject(home, 'header', R.header('', '', false));
home = R.inject(home, 'footer', R.footer(''));
home = R.inject(home, 'latest-posts', R.latest(list, ''));
wr('index.html', home);
let story = rd('cau-chuyen.html');
story = R.inject(story, 'header', R.header('', 'about', false));
story = R.inject(story, 'footer', R.footer(''));
wr('cau-chuyen.html', story);
let nf = rd('404.html');
nf = R.inject(nf, 'header', R.header('/', '', false));
nf = R.inject(nf, 'footer', R.footer('/'));
wr('404.html', nf);
