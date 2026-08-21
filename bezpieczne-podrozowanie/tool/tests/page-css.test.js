function cssDb() {
  return {
    cdnBase: 'https://cdn/',
    nav: { visibleCount: 5 },
    destinations: [
      {
        slug: 'a', name: 'A', url: 'https://x/a/', published: true,
        photo: { src: 'p.jpg', alt: '', caption: 'Podpis' },
        entryRequirements: { title: 'W', cards: [{ title: 'T', text: 'X' }] },
        practicalInfo: { title: 'I', items: [{ desc: 'D' }], moreLink: null }
      },
      { slug: 'b', name: 'B', url: 'https://x/b/', published: true }
    ]
  };
}

test('CSS jest opakowany w znacznik style', () => {
  const css = CT.pageCss.build(cssDb(), 'a', { includeSync: false });
  assert(css.startsWith('<style>'), 'brak otwarcia <style>');
  assert(css.trimEnd().endsWith('</style>'), 'brak zamknięcia </style>');
});

test('CSS nie zawiera komentarzy', () => {
  assertNotIncludes(CT.pageCss.build(cssDb(), 'a', { includeSync: false }), '/*');
});

test('CSS nie zawiera klas Bootstrapa', () => {
  const css = CT.pageCss.build(cssDb(), 'a', { includeSync: false });
  ['.container', '.row', '.col-', '.d-flex', '.card', '.btn ', '.vstack', '.d-none'].forEach((c) => {
    assertNotIncludes(css, c, 'pozostałość Bootstrapa');
  });
});

test('CSS trzyma wartości referencyjne wyglądu', () => {
  const css = CT.pageCss.build(cssDb(), 'a', { includeSync: false });
  assertIncludes(css, '--ct-maxw: 82.5rem');
  assertIncludes(css, '--ct-row-min: 3.5rem');
  assertIncludes(css, '--ct-radius-lg: 0.875rem');
  assertIncludes(css, 'rgba(0, 0, 0, 0.175)');
});

test('CSS zawiera regułę odwracającą kolejność w details', () => {
  assertIncludes(CT.pageCss.build(cssDb(), 'a', { includeSync: true }), 'column-reverse');
});

test('CSS zawiera obsługę prefers-reduced-motion i focus-visible', () => {
  const css = CT.pageCss.build(cssDb(), 'a', { includeSync: false });
  assertIncludes(css, 'prefers-reduced-motion');
  assertIncludes(css, ':focus-visible');
});

test('CSS pomija sekcję more-link, gdy kierunek jej nie ma', () => {
  assertNotIncludes(CT.pageCss.build(cssDb(), 'a', { includeSync: false }), '.more-link');
});

test('CSS dodaje sekcję more-link, gdy kierunek ją ma', () => {
  const db = cssDb();
  db.destinations[0].practicalInfo.moreLink = { label: 'L', href: 'https://gov.pl' };
  assertIncludes(CT.pageCss.build(db, 'a', { includeSync: false }), '.more-link');
});

test('CSS pomija sekcję details, gdy kierunków jest mało', () => {
  const db = cssDb();
  assertNotIncludes(CT.pageCss.build(db, 'a', { includeSync: false }), '.destinations-nav__more');
});

test('CSS dodaje sekcję details, gdy kierunków jest więcej niż visibleCount', () => {
  const db = cssDb();
  for (let i = 0; i < 8; i++) db.destinations.push({ slug: 's' + i, name: 'S' + i, url: 'https://x/', published: true });
  assertIncludes(CT.pageCss.build(db, 'a', { includeSync: false }), '.destinations-nav__more');
});

test('CSS dodaje sekcję details, gdy mało kierunków ale włączona synchronizacja', () => {
  const db = cssDb();
  assertIncludes(CT.pageCss.build(db, 'a', { includeSync: true }), '.destinations-nav__more');
});

test('CSS nie zawiera martwych reguł z obecnego arkusza', () => {
  const css = CT.pageCss.build(cssDb(), 'a', { includeSync: false });
  ['.prep-card', '.icon-wrapper', '.section-title', '.mt-4', '!important'].forEach((c) => {
    assertNotIncludes(css, c, 'martwy kod');
  });
});

test('brak opts traktowany jest jak {includeSync: false}', () => {
  assertNotIncludes(CT.pageCss.build(cssDb(), 'a'), '.destinations-nav__more');
});

test('CSS nie ma selektora potomka celującego w img, który mógłby przebić klasy komponentów', () => {
  const css = CT.pageCss.build(cssDb(), 'a', { includeSync: false });
  assert(!/\.[\w-]+(,\n\.[\w-]+)*\s+img\b/.test(css), 'znaleziono selektor potomka dla img — przebija specyficzność klas typu .travel-hero__img');
});

test('CSS zostawia klasom obrazów kontrolę nad własną wysokością', () => {
  const css = CT.pageCss.build(cssDb(), 'a', { includeSync: false });
  assertIncludes(css, '.travel-hero__img {\n  display: block;\n  width: 100%;\n  max-width: 100%;\n  height: 100%;');
  assertIncludes(css, '.destination-photo__img {\n  display: block;\n  position: absolute;\n  inset: 0;\n  width: 100%;\n  max-width: 100%;\n  height: 100%;');
});

test('CSS zeruje domyślny margines figure dla zdjęcia kierunku', () => {
  const css = CT.pageCss.build(cssDb(), 'a', { includeSync: false });
  assertIncludes(css, '.destination-photo {\n  position: relative;\n  height: 17.5rem;\n  margin: 0 0 var(--ct-space-xl);');
  assertNotIncludes(css, 'margin-bottom: var(--ct-space-xl);\n  background: #F2F3FF;');
});

test('CSS nie ustawia już koloru przycisku wewnątrz płaskiej reguły .button--primary', () => {
  const css = CT.pageCss.build(cssDb(), 'a', { includeSync: false });
  assertIncludes(css, '.button--primary {\n  min-height: 3.5rem;\n  padding: 1rem 2.5rem;\n  font-size: 1.125rem;\n  background: linear-gradient(180deg, #25AFEB, #0093D0);\n}');
});

function ruleBody(css, selector) {
  const at = css.indexOf(selector + ' {');
  assert(at !== -1, 'brak reguły dla selektora: ' + selector);
  return css.slice(at + selector.length + 2, css.indexOf('}', at));
}

test('CSS podnosi specyficzność koloru przycisków (hero i CTA gov.pl) ponad regułę linku w wrapperze CMS-a', () => {
  const css = CT.pageCss.build(cssDb(), 'a', { includeSync: false });
  assertIncludes(
    ruleBody(css, '.travel-hero a.button--primary,\n.travel-page a.button--primary'),
    'color: var(--ct-c-white);',
    'reguła kolorowa przycisków musi być zakotwiczona w .travel-hero/.travel-page z kwalifikatorem elementu a'
  );
});

test('CSS podnosi specyficzność koloru linku w menu kierunków ponad regułę CMS-a', () => {
  const css = CT.pageCss.build(cssDb(), 'a', { includeSync: false });
  assertIncludes(
    ruleBody(css, '.destinations-nav a.destinations-nav__item'),
    'color: var(--ct-c-link);',
    'reguła kolorowa menu musi być zakotwiczona w .destinations-nav z kwalifikatorem elementu a'
  );
  assertNotIncludes(
    css,
    '.destinations-nav__item {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: var(--ct-space-sm);\n  min-height: var(--ct-row-min);\n  padding: var(--ct-space-xs) var(--ct-space-sm);\n  border-radius: var(--ct-radius-lg);\n  color:',
    'kolor nie powinien już siedzieć w płaskiej regule .destinations-nav__item'
  );
});

test('CSS podnosi specyficzność koloru linku "więcej informacji" oraz jego stanu hover', () => {
  const db = cssDb();
  db.destinations[0].practicalInfo.moreLink = { label: 'L', href: 'https://gov.pl' };
  const css = CT.pageCss.build(db, 'a', { includeSync: false });
  assertIncludes(
    css,
    '.travel-page a.more-link {\n  color: var(--ct-c-heading);\n}',
    'brak reguły kolorowej dla .more-link zakotwiczonej w .travel-page z kwalifikatorem elementu a'
  );
  assertIncludes(
    css,
    '.travel-page a.more-link:hover {\n  color: #23CB71;\n  text-decoration: underline;\n}',
    ':hover musi mieć specyficzność co najmniej tak wysoką jak podniesiona reguła bazowa, inaczej zginie pod nią'
  );
});
