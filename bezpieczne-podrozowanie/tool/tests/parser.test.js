const LEGACY = `
<section class="py-5 travel-overview" id="travel-overview">
  <div class="container-xxl"><div class="row g-5"><div class="col-12 col-lg-7">
    <div class="d-flex align-items-center gap-4 mb-7 travel-overview__heade">
      <div class="rounded-2 overflow-hidden travel-overview__flag"><img class="img-fluid" src="https://cdn/base/flags/Turcja.png"></div>
      <div class="travel-overview__titles">
        <h1 class="travel-overview__title">Turcja</h1>
        <p class="travel-overview__subtitle">Aktualne wymagania podróżne</p>
      </div>
    </div>
    <section class="mb-5" id="wymagania">
      <div class="d-flex align-items-center gap-3 mb-4 overview-section__head">
        <h2 class="overview-section__title"><strong>Wymagania wyjazdowe</strong></h2>
      </div>
      <div class="gap-3 overview-section__cards vstack">
        <article class="overview-card card"><div class="card-body">
          <h3 class="overview-card__title">Paszport</h3>
          <p class="overview-card__text">Ważny minimum 150 dni od daty wjazdu.</p>
        </div></article>
      </div>
    </section>
    <section id="info" class="overview-section overview-section--practical">
      <div class="d-flex align-items-center gap-3 mb-4 overview-section__head">
        <h2 class="overview-section__title"><strong>Informacje praktyczne</strong></h2>
      </div>
      <div class="overview-section__box card"><div class="card-body">
        <ul class="list-unstyled mb-4 overview-list">
          <li class="d-flex align-items-start gap-2 overview-list__item"><span class="overview-list__dot"></span>
            <div><p class="overview-card__text">Zwykły punkt bez nagłówka.</p></div>
          </li>
          <li class="d-flex align-items-start gap-2 overview-list__item"><span class="overview-list__dot"></span>
            <div>
              <p class="overview-card__title">Gniazdka elektryczne</p>
              <p class="overview-card__text">Takie jak w Polsce (220 V).</p>
            </div>
          </li>
        </ul>
      </div></div>
    </section>
  </div>
  <div class="col-12 col-lg-5">
    <div class="position-relative overflow-hidden mb-5 overview-side__image-wrapper card">
      <img class="img-fluid" src="https://cdn/base/photos/Turcja_.jpg">
      <p class="position-absolute overview-side__img-text">Fethiye, Turcja</p>
    </div>
  </div></div></div>
</section>`;

function legacyWithMoreLink(extraClass) {
  return LEGACY.replace(
    /<\/ul>\s*<\/div><\/div>\s*<\/section>/,
    '</ul>' +
      '<div class="' + extraClass + ' overview-section__more-info">' +
      '<p class="overview-section__more-label">Więcej informacji:</p>' +
      '<div><a class="d-flex overview-section__more-link" href="https://www.gov.pl/web/turcja/informacje-dla-podrozujacych">Informacje dla podróżujących</a></div>' +
      '</div>' +
      '</div></div></section>'
  );
}

test('parser czyta nazwę, podtytuł i flagę ze starego HTML-a', () => {
  const res = CT.parser.parse(LEGACY, 'https://cdn/base/');
  assertEqual(res.destination.name, 'Turcja');
  assertEqual(res.destination.subtitle, 'Aktualne wymagania podróżne');
  assertEqual(res.destination.flag, 'flags/Turcja.png');
});

test('parser zachowuje nietypową nazwę pliku zdjęcia', () => {
  const res = CT.parser.parse(LEGACY, 'https://cdn/base/');
  assertEqual(res.destination.photo.src, 'photos/Turcja_.jpg');
  assertEqual(res.destination.photo.caption, 'Fethiye, Turcja');
});

test('parser czyta tytuł sekcji wymagań i karty', () => {
  const res = CT.parser.parse(LEGACY, 'https://cdn/base/');
  assertEqual(res.destination.entryRequirements.title, 'Wymagania wyjazdowe');
  assertEqual(res.destination.entryRequirements.cards.length, 1);
  assertEqual(res.destination.entryRequirements.cards[0].title, 'Paszport');
});

test('parser rozróżnia punkt z nagłówkiem i bez', () => {
  const items = CT.parser.parse(LEGACY, 'https://cdn/base/').destination.practicalInfo.items;
  assertEqual(items.length, 2);
  assertEqual(items[0].term, undefined);
  assertEqual(items[0].desc, 'Zwykły punkt bez nagłówka.');
  assertEqual(items[1].term, 'Gniazdka elektryczne');
});

test('parser zgłasza ostrzeżenie, gdy brakuje zdjęcia', () => {
  const res = CT.parser.parse(LEGACY.replace(/<img class="img-fluid" src="https:\/\/cdn\/base\/photos[^>]*>/, ''), 'https://cdn/base/');
  assert(res.warnings.length > 0, 'oczekiwano ostrzeżenia');
  assertIncludes(res.warnings.join(' '), 'zdjęc');
});

test('parser czyta wynik własnego generatora', () => {
  const db = htmlDb();
  db.destinations[0].photo = { src: 'photos/A.jpg', alt: 'Alt', caption: 'Podpis' };
  db.destinations[0].practicalInfo.items = [{ term: 'T', desc: 'D' }];
  const html = CT.pageHtml.build(db, 'a');
  const res = CT.parser.parse(html, db.cdnBase);
  assertEqual(res.destination.name, 'A');
  assertEqual(res.destination.photo.caption, 'Podpis');
  assertEqual(res.destination.entryRequirements.cards[0].title, 'T');
  assertEqual(res.destination.practicalInfo.items[0].term, 'T');
});

test('parser nie wykonuje skryptów z wklejonego kodu', () => {
  delete globalThis.__pwned;
  CT.parser.parse('<img src=x onerror="globalThis.__pwned=1"><script>globalThis.__pwned=1</' + 'script>', 'https://cdn/');
  assertEqual(globalThis.__pwned, undefined);
});

test('parser pomija ukryty (d-none) link "więcej informacji" i zgłasza ostrzeżenie', () => {
  const res = CT.parser.parse(legacyWithMoreLink('d-none'), 'https://cdn/base/');
  assertEqual(res.destination.practicalInfo.moreLink, null);
  assertIncludes(res.warnings.join(' '), 'więcej informacji');
  assertIncludes(res.warnings.join(' '), 'https://www.gov.pl/web/turcja/informacje-dla-podrozujacych');
});

test('parser importuje widoczny link "więcej informacji"', () => {
  const res = CT.parser.parse(legacyWithMoreLink('d-flex'), 'https://cdn/base/');
  assertEqual(res.destination.practicalInfo.moreLink, {
    label: 'Informacje dla podróżujących',
    href: 'https://www.gov.pl/web/turcja/informacje-dla-podrozujacych'
  });
});

const NESTED_LIST_INFO = `
<section id="info" class="overview-section overview-section--practical">
  <div class="overview-section__box card"><div class="card-body">
    <ul class="list-unstyled mb-4 overview-list">
      <li class="d-flex align-items-start gap-2 overview-list__item"><span class="overview-list__dot"></span>
        <div>
          <p class="overview-card__title">Opłata turystyczna</p>
          <p><span>Zapłata za obowiązkowy podatek turystyczny odbywa się podczas zakwaterowania i wynosi odpowiednio:</span></p>
          <p class="mt-3 overview-card__title"></p>
          <ul>
            <li><span>Osoba dorosła - 1,50 EUR os./doba</span></li>
            <li><span>Młodzież w wieku 12-18 lat - 1,00 EUR os./doba</span></li>
            <li><span>Dziecko do 12 lat - 0,50 EUR os./doba</span></li>
          </ul>
        </div>
      </li>
    </ul>
  </div></div>
</section>`;

test('parser rozwija zagnieżdżoną listę wewnątrz punktu na osobne pozycje', () => {
  const res = CT.parser.parse(NESTED_LIST_INFO, 'https://cdn/base/');
  const items = res.destination.practicalInfo.items;
  assertEqual(items.length, 4);
  assertEqual(items[0].term, 'Opłata turystyczna');
  assertEqual(items[0].desc, 'Zapłata za obowiązkowy podatek turystyczny odbywa się podczas zakwaterowania i wynosi odpowiednio:');
  assertEqual(items[1].term, undefined);
  assertEqual(items[1].desc, 'Osoba dorosła - 1,50 EUR os./doba');
  assertEqual(items[2].desc, 'Młodzież w wieku 12-18 lat - 1,00 EUR os./doba');
  assertEqual(items[3].desc, 'Dziecko do 12 lat - 0,50 EUR os./doba');
});

const SIBLING_CONTENT_INFO = `
<section id="info" class="overview-section overview-section--practical">
  <div class="overview-section__box card"><div class="card-body">
    <ul class="list-unstyled mb-4 overview-list">
      <li class="d-flex align-items-start gap-2 overview-list__item"><span class="overview-list__dot"></span>
        <div>
          <p class="overview-card__title">Podatek środowiskowy</p>
          <p class="overview-card__text"></p>
        </div>
      </li>
    </ul>
    <p><span>Obowiązuje podatek środowiskowy, płatny bezpośrednio w hotelu. Wynosi on odpowiednio</span></p>
    <ul>
      <li><span>ok. 2 USD za zakwaterowanie w obiektach posiadających do 24 pokoi włącznie,</span></li>
      <li><span>ok. 6 USD w obiektach od 25 do 50 pokoi włącznie,</span></li>
      <li><span>ok. 8 USD w obiektach powyżej 51 pokoi.</span></li>
    </ul>
    <p style="color: var(--c-body);"><span>Podane ceny są za osobę za dzień pobytu.</span>Na miejscu klienci pozostają pod opieką anglojęzycznego przedstawiciela.</p>
    <p></p>
    <div class="d-none gap-3 overview-section__more-info">
      <p class="overview-section__more-label">Więcej informacji:</p>
      <div><a class="d-flex overview-section__more-link" href="https://www.gov.pl/web/turcja/informacje-dla-podrozujacych">Informacje dla podróżujących</a></div>
    </div>
  </div></div>
</section>`;

test('parser dokleja treść stojącą obok listy punktów, pomijając ukryty blok d-none', () => {
  const res = CT.parser.parse(SIBLING_CONTENT_INFO, 'https://cdn/base/');
  const items = res.destination.practicalInfo.items;
  assertEqual(items.length, 6);
  assertEqual(items[0].term, 'Podatek środowiskowy');
  assertEqual(items[0].desc, '');
  assertEqual(items[1].desc, 'Obowiązuje podatek środowiskowy, płatny bezpośrednio w hotelu. Wynosi on odpowiednio');
  assertEqual(items[2].desc, 'ok. 2 USD za zakwaterowanie w obiektach posiadających do 24 pokoi włącznie,');
  assertEqual(items[3].desc, 'ok. 6 USD w obiektach od 25 do 50 pokoi włącznie,');
  assertEqual(items[4].desc, 'ok. 8 USD w obiektach powyżej 51 pokoi.');
  assertEqual(items[5].desc, 'Podane ceny są za osobę za dzień pobytu.Na miejscu klienci pozostają pod opieką anglojęzycznego przedstawiciela.');
  assertEqual(res.destination.practicalInfo.moreLink, null);
  assertIncludes(res.warnings.join(' '), 'więcej informacji');
});

const BR_INFO = `
<section id="info" class="overview-section overview-section--practical">
  <div class="overview-section__box card"><div class="card-body">
    <ul class="list-unstyled mb-4 overview-list">
      <li class="d-flex align-items-start gap-2 overview-list__item"><span class="overview-list__dot"></span>
        <div>
          <p class="overview-card__title">Dowód osobisty</p>
          <p class="overview-card__text">Ważny 3 miesiące od planowanej daty wyjazdu.<br><br>Dzieci i młodzież do 18. roku życia wjeżdżają na tych samych warunkach.</p>
        </div>
      </li>
    </ul>
  </div></div>
</section>`;

test('parser zamienia <br> na spację zamiast sklejać zdania', () => {
  const items = CT.parser.parse(BR_INFO, 'https://cdn/base/').destination.practicalInfo.items;
  assertEqual(items.length, 1);
  assertEqual(
    items[0].desc,
    'Ważny 3 miesiące od planowanej daty wyjazdu. Dzieci i młodzież do 18. roku życia wjeżdżają na tych samych warunkach.'
  );
});

test('parser zamienia <br> na spację także w kartach wymagań', () => {
  const html = '<section id="wymagania"><article class="overview-card card">' +
    '<h3 class="overview-card__title">Paszport</h3>' +
    '<p class="overview-card__text">Ważny 6 miesięcy.<br>W paszporcie muszą być dwie puste strony.</p>' +
    '</article></section>';
  const cards = CT.parser.parse(html, 'https://cdn/base/').destination.entryRequirements.cards;
  assertEqual(cards[0].text, 'Ważny 6 miesięcy. W paszporcie muszą być dwie puste strony.');
});
