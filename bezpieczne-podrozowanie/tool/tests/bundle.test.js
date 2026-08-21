// Each block carries one comment of its own, so the "no comments" test below
// measures join, not the fixture: it has to find exactly those three and no
// fourth one introduced between the blocks.
const PARTS = {
  css: '<style>\n/* komentarz CSS */\n.a { color: red; }\n</style>\n',
  html: '<header class="travel-hero"><!-- komentarz HTML --></header>\n',
  js: '<script>\n// komentarz JS\nwindow.x = 1;\n</' + 'script>\n'
};

test('join zachowuje kolejność CSS, HTML, JS', () => {
  const out = CT.bundle.join(PARTS);
  assert(out.indexOf('<style>') < out.indexOf('<header'), 'CSS musi być pierwszy');
  assert(out.indexOf('<header') < out.indexOf('<script>'), 'HTML musi być przed JS');
});

test('join nie wstawia komentarzy', () => {
  const out = CT.bundle.join(PARTS);
  assertEqual((out.match(/\/\*/g) || []).length, 1, 'komentarz /* pochodzi tylko z bloku CSS');
  assertEqual((out.match(/<!--/g) || []).length, 1, 'komentarz <!-- pochodzi tylko z bloku HTML');
  assertEqual((out.match(/\/\//g) || []).length, 1, 'komentarz // pochodzi tylko z bloku JS');
  assertEqual(out.replace(PARTS.css, '').replace(PARTS.html, '').replace(PARTS.js, '').trim(), '');
});

test('split odtwarza trzy bloki co do znaku', () => {
  assertEqual(CT.bundle.split(CT.bundle.join(PARTS)), PARTS);
});

test('split radzi sobie z pustym blokiem JS', () => {
  const parts = { css: PARTS.css, html: PARTS.html, js: '' };
  assertEqual(CT.bundle.split(CT.bundle.join(parts)), parts);
});

test('split zwraca puste bloki dla tekstu bez znaczników', () => {
  assertEqual(CT.bundle.split('zwykły tekst'), { css: '', html: 'zwykły tekst', js: '' });
});

test('split(join(...)) odtwarza rzeczywiste bloki wygenerowane dla kierunku, sync włączony', () => {
  const db = htmlDb();
  const parts = {
    css: CT.pageCss.build(db, 'a', { includeSync: true }),
    html: CT.pageHtml.build(db, 'a'),
    js: CT.pageJs.build(db, 'a', { includeSync: true })
  };
  assertEqual(CT.bundle.split(CT.bundle.join(parts)), parts);
});

test('split(join(...)) odtwarza rzeczywiste bloki wygenerowane dla kierunku, sync wyłączony', () => {
  const db = htmlDb();
  const parts = {
    css: CT.pageCss.build(db, 'a', { includeSync: false }),
    html: CT.pageHtml.build(db, 'a'),
    js: CT.pageJs.build(db, 'a', { includeSync: false })
  };
  assertEqual(parts.js, '');
  assertEqual(CT.bundle.split(CT.bundle.join(parts)), parts);
});
