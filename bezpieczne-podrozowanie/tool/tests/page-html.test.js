function htmlDb() {
  const db = cssDb();
  db.hero = { title: 'Hero', subtitle: 'Sub', image: 'hero.jpg', imageAlt: 'Alt hero', ctaLabel: 'CTA', ctaHref: '#travel-overview' };
  db.nav = { title: 'Inne kierunki', visibleCount: 5, expandLabel: 'Zobacz wszystkie', collapseLabel: 'Zwiń' };
  db.officialSource = { title: 'Oficjalne źródło', text: 'Tekst', ctaLabel: 'Otwórz gov.pl', ctaHref: 'https://gov.pl' };
  db.arrowIcon = 'icon_arrow.svg';
  db.destinations[0].flag = 'flags/A.png';
  db.destinations[0].subtitle = 'Aktualne wymagania podróżne';
  return db;
}

test('HTML ma dokładnie jeden nagłówek h1', () => {
  const html = CT.pageHtml.build(htmlDb(), 'a');
  assertEqual((html.match(/<h1[ >]/g) || []).length, 1);
});

test('HTML nie zawiera klas Bootstrapa', () => {
  const html = CT.pageHtml.build(htmlDb(), 'a');
  ['class="container', 'class="row', 'col-lg-', 'd-flex', 'card-body', 'btn-blue', 'vstack', 'd-none'].forEach((c) => {
    assertNotIncludes(html, c);
  });
});

test('HTML nie zawiera komentarzy', () => {
  assertNotIncludes(CT.pageHtml.build(htmlDb(), 'a'), '<!--');
});

test('każdy obraz treściowy ma alt, wymiary i lazy poza hero', () => {
  const html = CT.pageHtml.build(htmlDb(), 'a');
  const imgs = html.match(/<img[^>]*>/g) || [];
  assert(imgs.length > 0, 'brak obrazów');
  imgs.forEach((img) => {
    assertIncludes(img, ' alt="');
    assertIncludes(img, ' width="');
    assertIncludes(img, ' height="');
  });
  const heroImgs = imgs.filter((img) => img.includes('travel-hero__img'));
  const otherImgs = imgs.filter((img) => !img.includes('travel-hero__img'));
  assertEqual(heroImgs.length, 1);
  heroImgs.forEach((img) => assertNotIncludes(img, 'loading="lazy"'));
  assert(otherImgs.length > 0, 'brak obrazów poza hero');
  otherImgs.forEach((img) => assertIncludes(img, 'loading="lazy"'));
});

test('przycisk hero jest linkiem, nie linkiem w przycisku', () => {
  const html = CT.pageHtml.build(htmlDb(), 'a');
  assertNotIncludes(html, '<button');
  assertIncludes(html, '<a class="button button--primary" href="#travel-overview">');
});

test('lista kierunków pomija bieżący kierunek', () => {
  const html = CT.pageHtml.build(htmlDb(), 'a');
  assertNotIncludes(html, 'https://x/a/');
  assertIncludes(html, 'https://x/b/');
});

test('nav niesie slug bieżącej podstrony', () => {
  assertIncludes(CT.pageHtml.build(htmlDb(), 'a'), 'data-current="a"');
});

test('bez nadmiaru kierunków nie powstaje details', () => {
  assertNotIncludes(CT.pageHtml.build(htmlDb(), 'a'), '<details');
});

test('przy nadmiarze kierunków powstaje details z resztą pozycji', () => {
  const db = htmlDb();
  for (let i = 0; i < 8; i++) db.destinations.push({ slug: 's' + i, name: 'S' + i, url: 'https://x/s' + i + '/', published: true });
  const html = CT.pageHtml.build(db, 'a');
  assertIncludes(html, '<details class="destinations-nav__more">');
  assertIncludes(html, 'Zobacz wszystkie');
  assertIncludes(html, 'Zwiń');
  const firstList = html.split('<details')[0];
  assertEqual((firstList.match(/destinations-nav__item/g) || []).length, 5);
});

test('punkt informacji bez nagłówka nie emituje pustego akapitu', () => {
  const html = CT.pageHtml.build(htmlDb(), 'a');
  assertNotIncludes(html, 'fact-list__term"></p>');
});

test('sekcja więcej informacji pojawia się tylko przy wypełnionym linku', () => {
  const db = htmlDb();
  assertNotIncludes(CT.pageHtml.build(db, 'a'), 'more-info');
  db.destinations[0].practicalInfo.moreLink = { label: 'Informacje', href: 'https://gov.pl/x' };
  assertIncludes(CT.pageHtml.build(db, 'a'), 'more-info');
});

test('treść jest escapowana', () => {
  const db = htmlDb();
  db.destinations[0].entryRequirements.cards[0].text = 'a < b & "c"';
  const html = CT.pageHtml.build(db, 'a');
  assertIncludes(html, 'a &lt; b &amp; &quot;c&quot;');
});

test('kierunek bez opcjonalnych danych nie emituje src="" ani pustych sekcji', () => {
  const db = htmlDb();
  db.destinations[0] = Object.assign(CT.model.emptyDestination(), {
    slug: 'a', name: 'A', url: 'https://x/a/', published: true
  });
  const html = CT.pageHtml.build(db, 'a');
  assertNotIncludes(html, 'src=""');
  assertNotIncludes(html, 'destination-header__flag');
  assertNotIncludes(html, 'id="wymagania"');
  assertNotIncludes(html, 'id="info"');
  assertNotIncludes(html, 'class="destination-photo"');
});

test('dwie generacje tych samych danych dają identyczny ciąg', () => {
  const db = htmlDb();
  assertEqual(CT.pageHtml.build(db, 'a'), CT.pageHtml.build(db, 'a'));
});

test('kształty, na których generator wywala się albo emituje puste atrybuty, odrzuca validate', () => {
  const cases = [
    ['officialSource', (db) => { delete db.officialSource; }],
    ['nav', (db) => { delete db.nav; }],
    ['hero', (db) => { delete db.hero; }],
    ['arrowIcon', (db) => { delete db.arrowIcon; }],
    ['practicalInfo.items', (db) => { delete db.destinations[0].practicalInfo.items; }],
    ['entryRequirements.cards', (db) => { delete db.destinations[0].entryRequirements.cards; }]
  ];
  cases.forEach(([label, mutate]) => {
    const db = htmlDb();
    mutate(db);
    assertEqual(CT.model.validate(db).ok, false, 'validate powinno odrzucić brak ' + label);
  });
});

test('brak obrazu hero to błąd walidacji, a nie ciche src="" w HTML-u', () => {
  const db = htmlDb();
  db.hero.image = '';
  const res = CT.model.validate(db);
  assertEqual(res.ok, false);
  assertIncludes(JSON.stringify(res.errors), 'hero.image');
  assertIncludes(CT.pageHtml.build(db, 'a'), 'class="travel-hero__img" src=""');
});
