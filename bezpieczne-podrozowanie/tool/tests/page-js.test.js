function navRoot(currentSlug) {
  const el = document.createElement('nav');
  el.className = 'destinations-nav';
  el.setAttribute('data-current', currentSlug);
  el.innerHTML = '<h2 class="destinations-nav__title">Inne kierunki</h2><ul class="destinations-nav__list"></ul>';
  return el;
}

function payload(slugs) {
  return {
    version: 1,
    cdnBase: 'https://cdn/',
    arrowIcon: 'icon_arrow.svg',
    nav: { title: 'Inne kierunki', visibleCount: 5, expandLabel: 'Zobacz wszystkie', collapseLabel: 'Zwiń' },
    destinations: slugs.map((s) => ({ slug: s, name: s.toUpperCase(), url: 'https://x/' + s + '/', published: true }))
  };
}

test('blok JS jest pusty, gdy synchronizacja wyłączona', () => {
  assertEqual(CT.pageJs.build(htmlDb(), 'a', { includeSync: false }), '');
});

test('blok JS nie ładuje bootstrapa ani żadnego pliku zewnętrznego', () => {
  const js = CT.pageJs.build(htmlDb(), 'a', { includeSync: true });
  assertNotIncludes(js, 'bootstrap');
  assertNotIncludes(js, '<script src');
});

test('blok JS startuje po zdarzeniu load i nie zakłada nasłuchów', () => {
  const js = CT.pageJs.build(htmlDb(), 'a', { includeSync: true });
  assertIncludes(js, "addEventListener('load'");
  assertNotIncludes(js, 'MutationObserver');
  assertNotIncludes(js, 'setInterval');
  assertNotIncludes(js, 'setTimeout');
  assertNotIncludes(js, 'sessionStorage');
  assertNotIncludes(js, 'localStorage');
});

test('applyRefresh podmienia listę, gdy doszedł nowy kierunek', () => {
  const root = navRoot('a');
  assertEqual(CT.pageJs.applyRefresh(root, payload(['a', 'b', 'c']), 1), true);
  assertIncludes(root.innerHTML, 'https://x/b/');
  assertIncludes(root.innerHTML, 'https://x/c/');
});

test('applyRefresh pomija bieżący kierunek', () => {
  const root = navRoot('a');
  CT.pageJs.applyRefresh(root, payload(['a', 'b']), 1);
  assertNotIncludes(root.innerHTML, 'https://x/a/');
});

test('applyRefresh odrzuca niezgodną wersję', () => {
  const root = navRoot('a');
  assertEqual(CT.pageJs.applyRefresh(root, Object.assign(payload(['a', 'b']), { version: 2 }), 1), false);
});

test('applyRefresh odrzuca pustą listę', () => {
  const root = navRoot('a');
  assertEqual(CT.pageJs.applyRefresh(root, payload([]), 1), false);
});

test('applyRefresh odrzuca dane bez tablicy kierunków', () => {
  const root = navRoot('a');
  assertEqual(CT.pageJs.applyRefresh(root, { version: 1 }, 1), false);
});

test('applyRefresh nie rusza DOM-u, gdy zestaw slugów się nie zmienił', () => {
  const root = navRoot('a');
  CT.pageJs.applyRefresh(root, payload(['a', 'b']), 1);
  const before = root.innerHTML;
  assertEqual(CT.pageJs.applyRefresh(root, payload(['a', 'b']), 1), false);
  assertEqual(root.innerHTML, before);
});

test('applyRefresh buduje details przy nadmiarze kierunków', () => {
  const root = navRoot('a');
  CT.pageJs.applyRefresh(root, payload(['a', 'b', 'c', 'd', 'e', 'f', 'g']), 1);
  assertIncludes(root.innerHTML, 'destinations-nav__more');
});

test('wygenerowany skrypt parsuje się jako poprawny JavaScript', () => {
  const block = CT.pageJs.build(htmlDb(), 'a', { includeSync: true });
  const code = block.replace(/^<script>\n?/, '').replace(/<\/script>\s*$/, '');
  new Function(code);
});

test('wygenerowany skrypt nie odwołuje się do CT — jest samowystarczalny', () => {
  const block = CT.pageJs.build(htmlDb(), 'a', { includeSync: true });
  const code = block.replace(/^<script>\n?/, '').replace(/<\/script>\s*$/, '');
  assert(!/\bCT\b/.test(code), 'wygenerowany blok odwołuje się do CT');
});

test('treść skryptu nie zawiera dosłownego znaku < — CMS parsuje <script> jak markup', () => {
  const block = CT.pageJs.build(htmlDb(), 'a', { includeSync: true });
  const code = block.replace(/^<script>\n?/, '').replace(/<\/script>\s*$/, '');
  assertEqual(code.includes('<'), false, 'treść skryptu zawiera dosłowny znak <, może orphanować tag w walidatorze CMS-a');
});

test('escape \\u003c w skrypcie odtwarza prawdziwy znak < w czasie działania', () => {
  const block = CT.pageJs.build(htmlDb(), 'a', { includeSync: true });
  const code = block.replace(/^<script>\n?/, '').replace(/<\/script>\s*$/, '');
  const start = code.indexOf('function esc(');
  const end = code.lastIndexOf('});');
  const fns = code.slice(start, end);
  const data = {
    cdnBase: 'https://cdn/',
    arrowIcon: 'icon_arrow.svg',
    nav: { title: 'Inne kierunki', expandLabel: 'Zobacz wszystkie', collapseLabel: 'Zwiń' }
  };
  const rows = [{ url: 'https://x/b/', name: 'B' }];
  const run = new Function('data', 'rows', fns + '\nreturn markup(data, rows);');
  const html = run(data, rows);
  assertIncludes(html, '<li>');
  assertIncludes(html, '</li>');
});

// The block pasted into the CMS is a second implementation of applyRefresh;
// these tests run that block, not the tool-side mirror.
function shippedFns(db) {
  const block = CT.pageJs.build(db || htmlDb(), 'a', { includeSync: true });
  const code = block.replace(/^<script>\n?/, '').replace(/<\/script>\s*$/, '');
  return code.slice(code.indexOf('function esc('), code.lastIndexOf('});'));
}

function shipped(expr) {
  return new Function('data', 'rows', shippedFns() + '\nreturn ' + expr + ';');
}

function collapse(html) {
  return String(html).replace(/>\s+</g, '><').trim();
}

test('asset() z wklejanego bloku zgadza się z CT.model.assetUrl', () => {
  const asset = shipped('asset(data, rows)');
  const data = { cdnBase: 'https://cdn/base/' };
  ['icon_arrow.svg', '/icon_arrow.svg', '', 'data:image/svg+xml,x', 'https://other/x.svg'].forEach((path) => {
    assertEqual(asset(data, path), CT.model.assetUrl(data.cdnBase, path), 'rozjazd dla ścieżki: ' + JSON.stringify(path));
  });
});

test('markup() z wklejanego bloku daje ten sam HTML co applyRefresh', () => {
  const data = payload(['a', 'b', 'c']);
  const rootA = navRoot('a');
  assertEqual(CT.pageJs.applyRefresh(rootA, data, 1), true);
  const rootB = navRoot('a');
  rootB.innerHTML = shipped('markup(data, rows)')(data, data.destinations.filter((d) => d.slug !== 'a'));
  assertEqual(collapse(rootB.innerHTML), collapse(rootA.innerHTML));
});

test('markup() z wklejanego bloku daje ten sam HTML co applyRefresh także z details', () => {
  const data = payload(['a', 'b', 'c', 'd', 'e', 'f', 'g']);
  const rootA = navRoot('a');
  CT.pageJs.applyRefresh(rootA, data, 1);
  const rootB = navRoot('a');
  rootB.innerHTML = shipped('markup(data, rows)')(data, data.destinations.filter((d) => d.slug !== 'a'));
  assertIncludes(rootB.innerHTML, 'destinations-nav__more');
  assertEqual(collapse(rootB.innerHTML), collapse(rootA.innerHTML));
});

test('markup() z wklejanego bloku escapuje znaczniki w nazwie kierunku', () => {
  const data = payload(['a']);
  const rows = [{ url: 'https://x/b/', name: '<img src=x onerror=1>' }];
  const html = shipped('markup(data, rows)')(data, rows);
  assertIncludes(html, '&lt;img src=x onerror=1&gt;');
  assertNotIncludes(html, '<img src=x');
  const root = navRoot('a');
  root.innerHTML = html;
  assertEqual(root.querySelectorAll('img[onerror]').length, 0);
  assertEqual(root.querySelector('.destinations-nav__name').textContent, '<img src=x onerror=1>');
});

test('markup() z wklejanego bloku escapuje znaczniki w adresie i etykietach nav', () => {
  const data = payload(['a']);
  data.nav.title = '<script>x</' + 'script>';
  const rows = [{ url: 'https://x/"><img src=y onerror=1>', name: 'B' }];
  const html = shipped('markup(data, rows)')(data, rows);
  assertNotIncludes(html, '<img src=y');
  assertNotIncludes(html, '<script>x');
  assertIncludes(html, '&quot;&gt;&lt;img src=y onerror=1&gt;');
});

// Imperva serves the CDN copy of destinations.json without Access-Control-Allow-Origin
// on a cache hit, so the fetch has to miss the edge cache on every page load.
function shippedFetchUrls(db) {
  const block = CT.pageJs.build(db || htmlDb(), 'a', { includeSync: true });
  const code = block.replace(/^<script>\n?/, '').replace(/<\/script>\s*$/, '');
  const urls = [];
  const win = {
    addEventListener: (name, fn) => {
      if (name === 'load') fn();
    }
  };
  const doc = {
    querySelector: () => ({
      isConnected: true,
      getAttribute: () => 'a',
      querySelectorAll: () => []
    })
  };
  const chain = {
    then() {
      return this;
    },
    catch() {
      return this;
    }
  };
  const fetchStub = (url) => {
    urls.push(url);
    return chain;
  };
  new Function('window', 'document', 'fetch', code)(win, doc, fetchStub);
  return urls;
}

test('wklejany skrypt pobiera destinations.json spod adresu z cdnBase', () => {
  const urls = shippedFetchUrls();
  assertEqual(urls.length, 1);
  assertIncludes(urls[0], CT.model.assetUrl(htmlDb().cdnBase, 'destinations.json'));
});

test('każde wywołanie fetch omija cache CDN-u innym adresem', () => {
  const first = shippedFetchUrls()[0];
  const second = shippedFetchUrls()[0];
  const base = CT.model.assetUrl(htmlDb().cdnBase, 'destinations.json');
  assertIncludes(first, base + '?');
  assert(
    first !== second,
    'dwa kolejne żądania trafiły pod ten sam adres — Imperva odda kopię z cache bez nagłówka Access-Control-Allow-Origin'
  );
});
