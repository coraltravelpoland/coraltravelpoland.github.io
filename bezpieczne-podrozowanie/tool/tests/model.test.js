const CDN = 'https://cdn.example/base/';

function dbFixture() {
  return {
    version: 1,
    cdnBase: CDN,
    arrowIcon: 'icon_arrow.svg',
    hero: { title: 'Hero', subtitle: 'Sub', image: 'hero.jpg', imageAlt: '', ctaLabel: 'CTA', ctaHref: '#x' },
    nav: { title: 'Inne kierunki', visibleCount: 5, expandLabel: 'Zobacz wszystkie', collapseLabel: 'Zwiń' },
    officialSource: { title: 'Oficjalne źródło', text: 'Tekst', ctaLabel: 'Otwórz', ctaHref: 'https://gov.pl' },
    destinations: [
      { slug: 'a', name: 'A', url: 'https://x/a/', published: true },
      { slug: 'b', name: 'B', url: 'https://x/b/', published: true },
      { slug: 'c', name: 'C', url: 'https://x/c/', published: false }
    ]
  };
}

test('assetUrl dokleja cdnBase do ścieżki względnej', () => {
  assertEqual(CT.model.assetUrl(CDN, 'flags/Turcja.png'), CDN + 'flags/Turcja.png');
});

test('assetUrl zostawia pełny URL bez zmian', () => {
  const full = 'https://other.example/x.png';
  assertEqual(CT.model.assetUrl(CDN, full), full);
});

test('assetUrl nie dubluje ukośnika', () => {
  assertEqual(CT.model.assetUrl('https://cdn/', '/flags/x.png'), 'https://cdn/flags/x.png');
});

test('assetUrl zwraca pusty string dla pustej ścieżki', () => {
  assertEqual(CT.model.assetUrl(CDN, ''), '');
});

test('find zwraca kierunek pasujący do sluga', () => {
  const dest = CT.model.find(dbFixture(), 'b');
  assertEqual(dest.slug, 'b');
  assertEqual(dest.name, 'B');
});

test('find zwraca null dla nieistniejącego sluga', () => {
  assertEqual(CT.model.find(dbFixture(), 'zzz'), null);
});

test('menuFor pomija bieżący kierunek', () => {
  const names = CT.model.menuFor(dbFixture(), 'a').map((d) => d.slug);
  assertEqual(names, ['b']);
});

test('menuFor pomija kierunki nieopublikowane', () => {
  const names = CT.model.menuFor(dbFixture(), 'zzz').map((d) => d.slug);
  assertEqual(names, ['a', 'b']);
});

test('heroFor zwraca hero wspólne, gdy kierunek go nie nadpisuje', () => {
  assertEqual(CT.model.heroFor(dbFixture(), 'a').title, 'Hero');
});

test('heroFor scala nadpisanie kierunku z hero wspólnym', () => {
  const db = dbFixture();
  db.destinations[0].hero = { title: 'Własny' };
  const hero = CT.model.heroFor(db, 'a');
  assertEqual(hero.title, 'Własny');
  assertEqual(hero.subtitle, 'Sub');
});

test('validate przyjmuje poprawne dane', () => {
  assertEqual(CT.model.validate(dbFixture()).ok, true);
});

test('validate odrzuca duplikat sluga', () => {
  const db = dbFixture();
  db.destinations[1].slug = 'a';
  const res = CT.model.validate(db);
  assertEqual(res.ok, false);
  assertIncludes(JSON.stringify(res.errors), 'duplikat');
});

test('validate odrzuca slug w złym formacie', () => {
  const db = dbFixture();
  db.destinations[0].slug = 'Sri Lanka';
  const res = CT.model.validate(db);
  assertEqual(res.ok, false);
  assertIncludes(JSON.stringify(res.errors), 'format');
});

test('validate odrzuca brak nazwy', () => {
  const db = dbFixture();
  db.destinations[0].name = '';
  assertEqual(CT.model.validate(db).ok, false);
});

test('validate odrzuca brak adresu URL', () => {
  const db = dbFixture();
  delete db.destinations[0].url;
  assertEqual(CT.model.validate(db).ok, false);
});

test('validate odrzuca brak tytułu listy kierunków', () => {
  const db = dbFixture();
  db.nav.title = '';
  const res = CT.model.validate(db);
  assertEqual(res.ok, false);
  assertIncludes(JSON.stringify(res.errors), 'nav.title');
});

test('validate odrzuca brak etykiety rozwinięcia listy', () => {
  const db = dbFixture();
  db.nav.expandLabel = '   ';
  const res = CT.model.validate(db);
  assertEqual(res.ok, false);
  assertIncludes(JSON.stringify(res.errors), 'nav.expandLabel');
});

test('validate odrzuca brak etykiety zwinięcia listy', () => {
  const db = dbFixture();
  delete db.nav.collapseLabel;
  const res = CT.model.validate(db);
  assertEqual(res.ok, false);
  assertIncludes(JSON.stringify(res.errors), 'nav.collapseLabel');
});

test('emptyDestination ma komplet kluczy i jest opublikowany', () => {
  const d = CT.model.emptyDestination();
  assertEqual(Object.keys(d).sort(), [
    'entryRequirements', 'flag', 'name', 'photo', 'practicalInfo', 'published', 'slug', 'subtitle', 'url'
  ]);
  assertEqual(d.published, true);
});

test('validate odrzuca dane, które nie są obiektem', () => {
  assertEqual(CT.model.validate(null).ok, false);
});

test('validate odrzuca brak listy kierunków', () => {
  const res = CT.model.validate({ cdnBase: CDN });
  assertEqual(res.ok, false);
  assertIncludes(JSON.stringify(res.errors), 'destinations');
});

test('validate odrzuca brak sekcji powitalnej — generator emitowałby puste src i h1', () => {
  const db = dbFixture();
  delete db.hero;
  const res = CT.model.validate(db);
  assertEqual(res.ok, false);
  assertIncludes(JSON.stringify(res.errors), 'hero');
});

test('validate odrzuca hero bez obrazu, tytułu i adresu przycisku', () => {
  ['image', 'title', 'ctaHref', 'ctaLabel', 'subtitle'].forEach((key) => {
    const db = dbFixture();
    delete db.hero[key];
    const res = CT.model.validate(db);
    assertEqual(res.ok, false, 'brak hero.' + key + ' powinien być błędem');
    assertIncludes(JSON.stringify(res.errors), 'hero.' + key);
  });
});

test('validate odrzuca brak ikony strzałki — generator emitowałby src=""', () => {
  const db = dbFixture();
  delete db.arrowIcon;
  const res = CT.model.validate(db);
  assertEqual(res.ok, false);
  assertIncludes(JSON.stringify(res.errors), 'arrowIcon');
});

test('validate odrzuca brak sekcji oficjalnego źródła', () => {
  const db = dbFixture();
  delete db.officialSource;
  const res = CT.model.validate(db);
  assertEqual(res.ok, false);
  assertIncludes(JSON.stringify(res.errors), 'officialSource');
});

test('validate odrzuca niekompletne oficjalne źródło', () => {
  ['title', 'text', 'ctaLabel', 'ctaHref'].forEach((key) => {
    const db = dbFixture();
    delete db.officialSource[key];
    assertEqual(CT.model.validate(db).ok, false, 'brak officialSource.' + key + ' powinien być błędem');
  });
});

test('validate odrzuca brak sekcji listy kierunków', () => {
  const db = dbFixture();
  delete db.nav;
  const res = CT.model.validate(db);
  assertEqual(res.ok, false);
  assertIncludes(JSON.stringify(res.errors), 'nav');
});

test('validate odrzuca informacje praktyczne bez tablicy pozycji', () => {
  const db = dbFixture();
  db.destinations[0].practicalInfo = { title: 'I' };
  const res = CT.model.validate(db);
  assertEqual(res.ok, false);
  assertIncludes(JSON.stringify(res.errors), 'practicalInfo.items');
});

test('validate odrzuca wymagania wjazdowe bez tablicy kart', () => {
  const db = dbFixture();
  db.destinations[0].entryRequirements = { title: 'W' };
  const res = CT.model.validate(db);
  assertEqual(res.ok, false);
  assertIncludes(JSON.stringify(res.errors), 'entryRequirements.cards');
});

test('validate wymaga tytułu sekcji, gdy sekcja ma treść', () => {
  const db = dbFixture();
  db.destinations[0].entryRequirements = { title: '', cards: [{ title: 'T', text: 'X' }] };
  db.destinations[1].practicalInfo = { title: '', items: [{ desc: 'D' }], moreLink: null };
  const res = CT.model.validate(db);
  assertEqual(res.ok, false);
  assertIncludes(JSON.stringify(res.errors), 'entryRequirements.title');
  assertIncludes(JSON.stringify(res.errors), 'practicalInfo.title');
});

test('validate odrzuca adres javascript: w hero, oficjalnym źródle i linku więcej informacji', () => {
  const cases = [
    ['hero.ctaHref', (db) => { db.hero.ctaHref = 'javascript:alert(1)'; }],
    ['officialSource.ctaHref', (db) => { db.officialSource.ctaHref = 'JavaScript:alert(1)'; }],
    ['practicalInfo.moreLink.href', (db) => {
      db.destinations[0].practicalInfo = { title: 'I', items: [], moreLink: { label: 'x', href: 'java\tscript:alert(1)' } };
    }]
  ];
  cases.forEach(([path, mutate]) => {
    const db = dbFixture();
    mutate(db);
    const res = CT.model.validate(db);
    assertEqual(res.ok, false, path + ' powinien być odrzucony');
    assertIncludes(JSON.stringify(res.errors), path);
  });
});

test('validate przyjmuje adres względny i kotwicę', () => {
  const db = dbFixture();
  db.hero.ctaHref = '#travel-overview';
  db.officialSource.ctaHref = 'https://gov.pl';
  db.destinations[0].practicalInfo = { title: 'I', items: [], moreLink: { label: 'x', href: '/informacje' } };
  assertEqual(CT.model.validate(db).ok, true);
});

test('findAll zwraca wszystkie kierunki o tym samym slugu', () => {
  const db = dbFixture();
  db.destinations[1].slug = 'a';
  assertEqual(CT.model.findAll(db, 'a').map((d) => d.name), ['A', 'B']);
});

test('findAllByName dopasowuje po nazwie, bez względu na wielkość liter i odstępy', () => {
  const db = dbFixture();
  db.destinations[0].name = 'Tanzania - Zanzibar';
  assertEqual(CT.model.findAllByName(db, '  tanzania -\u00a0zanzibar ').map((d) => d.slug), ['a']);
});

test('findAllByName zwraca wszystkie kierunki o tej samej nazwie', () => {
  const db = dbFixture();
  db.destinations[1].name = 'A';
  assertEqual(CT.model.findAllByName(db, 'a').length, 2);
});

test('nextSlug zwraca bazę, gdy jest wolna', () => {
  assertEqual(CT.model.nextSlug(dbFixture(), 'nowy-kierunek'), 'nowy-kierunek');
});

test('nextSlug omija slugi zajęte, nie licząc długości listy', () => {
  const db = dbFixture();
  db.destinations = [{ slug: 'nowy-kierunek' }, { slug: 'nowy-kierunek-2' }];
  assertEqual(CT.model.nextSlug(db, 'nowy-kierunek'), 'nowy-kierunek-3');
});

test('loadProblem przepuszcza poprawne dane', () => {
  assertEqual(CT.model.loadProblem(dbFixture()), null);
});

test('loadProblem odrzuca kształty, na których narzędzie by się wywróciło', () => {
  ['', 'null', '[]', '{}', '"tekst"', '{"destinations":{}}', '{"destinations":[{}]}'].forEach((raw) => {
    const data = raw === '' ? undefined : JSON.parse(raw);
    assert(CT.model.loadProblem(data), 'oczekiwano komunikatu dla: ' + raw);
  });
});

test('loadProblem przepuszcza pustą listę — to stan po usunięciu ostatniego kierunku', () => {
  assertEqual(CT.model.loadProblem({ destinations: [] }), null);
});
