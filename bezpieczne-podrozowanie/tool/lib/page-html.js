(function (g) {
  const CT = (g.CT = g.CT || {});

  const ICON_DOC =
    '<svg class="info-section__icon" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<path d="M7 18H17V16H7V18Z" fill="currentColor"></path>' +
    '<path d="M17 14H7V12H17V14Z" fill="currentColor"></path>' +
    '<path d="M7 10H11V8H7V10Z" fill="currentColor"></path>' +
    '<path fill-rule="evenodd" clip-rule="evenodd" d="M6 2C4.34315 2 3 3.34315 3 5V19C3 20.6569 4.34315 22 6 22H18C19.6569 22 21 20.6569 21 19V9C21 5.13401 17.866 2 14 2H6ZM6 4H13V9H19V19C19 19.5523 18.5523 20 18 20H6C5.44772 20 5 19.5523 5 19V5C5 4.44772 5.44772 4 6 4ZM15 4.10002C16.6113 4.4271 17.9413 5.52906 18.584 7H15V4.10002Z" fill="currentColor"></path>' +
    '</svg>';

  const ICON_SHIELD =
    '<svg class="info-section__icon" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
    '<circle cx="17" cy="15.5" r="1.12"></circle>' +
    '<path d="M17,17.5c-0.73,0-2.19,0.36-2.24,1.08c0.5,0.71,1.32,1.17,2.24,1.17s1.74-0.46,2.24-1.17C19.19,17.86,17.73,17.5,17,17.5z"></path>' +
    '<path d="M18,11.09V6.27L10.5,3L3,6.27v4.91c0,4.54,3.2,8.79,7.5,9.82c0.55-0.13,1.08-0.32,1.6-0.55C13.18,21.99,14.97,23,17,23c3.31,0,6-2.69,6-6C23,14.03,20.84,11.57,18,11.09z M11,17c0,0.56,0.08,1.11,0.23,1.62c-0.24,0.11-0.48,0.22-0.73,0.3c-3.17-1-5.5-4.24-5.5-7.74v-3.6l5.5-2.4l5.5,2.4v3.51C13.16,11.57,11,14.03,11,17z M17,21c-2.21,0-4-1.79-4-4c0-2.21,1.79-4,4-4s4,1.79,4,4C21,19.21,19.21,21,17,21z"></path>' +
    '</svg>';

  const ICON_EXTERNAL =
    '<svg class="official-source__icon" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
    '<path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"></path>' +
    '</svg>';

  function escape(text) {
    return String(text == null ? '' : text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // The three paragraph fields carry sanitised markup on purpose. Sanitising
  // again here means a hand-edited destinations.json cannot reach the output.
  function rich(value) {
    return CT.richText.sanitize(value);
  }

  function navItem(db, dest) {
    const arrow = CT.model.assetUrl(db.cdnBase, db.arrowIcon);
    return (
      '      <li>\n' +
      '        <a class="destinations-nav__item" href="' + escape(dest.url) + '">\n' +
      '          <span class="destinations-nav__name">' + escape(dest.name) + '</span>\n' +
      '          <img class="destinations-nav__arrow" src="' + escape(arrow) + '" width="24" height="24" alt="" loading="lazy">\n' +
      '        </a>\n' +
      '      </li>\n'
    );
  }

  function navList(db, slug, items) {
    return (
      '    <ul class="destinations-nav__list">\n' +
      items.map((d) => navItem(db, d)).join('') +
      '    </ul>\n'
    );
  }

  function nav(db, slug) {
    const items = CT.model.menuFor(db, slug);
    const visible = db.nav.visibleCount || 5;
    let out =
      '  <nav class="destinations-nav" data-current="' + escape(slug) + '">\n' +
      '    <h2 class="destinations-nav__title">' + escape(db.nav.title) + '</h2>\n' +
      navList(db, slug, items.slice(0, visible));
    if (items.length > visible) {
      out +=
        '    <details class="destinations-nav__more">\n' +
        '      <summary class="destinations-nav__toggle">\n' +
        '        <span class="destinations-nav__toggle-more">' + escape(db.nav.expandLabel) + '</span>\n' +
        '        <span class="destinations-nav__toggle-less">' + escape(db.nav.collapseLabel) + '</span>\n' +
        '      </summary>\n' +
        navList(db, slug, items.slice(visible)) +
        '    </details>\n';
    }
    return out + '  </nav>\n';
  }

  function requirements(dest) {
    if (!dest.entryRequirements || !dest.entryRequirements.cards.length) return '';
    return (
      '      <section class="info-section" id="wymagania">\n' +
      '        <div class="info-section__head">' + ICON_DOC +
      '<h2 class="info-section__title">' + escape(dest.entryRequirements.title) + '</h2></div>\n' +
      '        <div class="info-section__body">\n' +
      dest.entryRequirements.cards
        .map(
          (c) =>
            '          <article class="info-card">\n' +
            '            <h3 class="info-card__title">' + escape(c.title) + '</h3>\n' +
            '            <div class="info-card__text">' + rich(c.text) + '</div>\n' +
            '          </article>\n'
        )
        .join('') +
      '        </div>\n' +
      '      </section>\n'
    );
  }

  function practical(db, dest) {
    const info = dest.practicalInfo;
    if (!info || (!info.items.length && !(info.moreLink && info.moreLink.href))) return '';
    let out =
      '      <section class="info-section" id="info">\n' +
      '        <div class="info-section__head">' + ICON_SHIELD +
      '<h2 class="info-section__title">' + escape(info.title) + '</h2></div>\n' +
      '        <div class="fact-box">\n' +
      '          <ul class="fact-list">\n' +
      info.items
        .map((it) => {
          const term = it.term ? '              <p class="fact-list__term">' + escape(it.term) + '</p>\n' : '';
          return (
            '            <li class="fact-list__item">\n' +
            '              <span class="fact-list__marker" aria-hidden="true"></span>\n' +
            '              <div>\n' +
            term +
            '                <div class="fact-list__desc">' + rich(it.desc) + '</div>\n' +
            '              </div>\n' +
            '            </li>\n'
          );
        })
        .join('') +
      '          </ul>\n';
    if (info.moreLink && info.moreLink.href) {
      out +=
        '          <div class="more-info">\n' +
        '            <p class="more-info__label">Więcej informacji:</p>\n' +
        '            <a class="more-link" href="' + escape(info.moreLink.href) + '">' + escape(info.moreLink.label) + '</a>\n' +
        '          </div>\n';
    }
    return out + '        </div>\n      </section>\n';
  }

  function build(db, slug) {
    const dest = CT.model.find(db, slug);
    if (!dest) throw new Error('nie ma kierunku o slugu: ' + slug);
    const hero = CT.model.heroFor(db, slug);
    const photo = dest.photo || {};

    let out =
      '<header class="travel-hero">\n' +
      '  <div class="travel-hero__bg">\n' +
      '    <img class="travel-hero__img" src="' + escape(CT.model.assetUrl(db.cdnBase, hero.image)) + '" width="1920" height="1080" alt="' + escape(hero.imageAlt) + '">\n' +
      '    <div class="travel-hero__overlay"></div>\n' +
      '  </div>\n' +
      '  <div class="travel-hero__content">\n' +
      '    <h1 class="travel-hero__title">' + escape(hero.title) + '</h1>\n' +
      '    <p class="travel-hero__subtitle">' + escape(hero.subtitle) + '</p>\n' +
      '    <a class="button button--primary" href="' + escape(hero.ctaHref) + '">' + escape(hero.ctaLabel) + '</a>\n' +
      '  </div>\n' +
      '</header>\n' +
      '<section class="travel-page" id="travel-overview">\n' +
      '  <div class="travel-page__inner">\n' +
      '    <div class="travel-page__main">\n' +
      '      <div class="destination-header">\n' +
      (dest.flag
        ? '        <img class="destination-header__flag" src="' + escape(CT.model.assetUrl(db.cdnBase, dest.flag)) + '" width="84" height="60" alt="Flaga: ' + escape(dest.name) + '" loading="lazy">\n'
        : '') +
      '        <div>\n' +
      '          <h2 class="destination-header__title">' + escape(dest.name) + '</h2>\n' +
      '          <p class="destination-header__subtitle">' + escape(dest.subtitle) + '</p>\n' +
      '        </div>\n' +
      '      </div>\n' +
      requirements(dest) +
      practical(db, dest) +
      '    </div>\n' +
      '    <aside class="travel-page__aside">\n';

    if (photo.src) {
      out +=
        '      <figure class="destination-photo">\n' +
        '        <img class="destination-photo__img" src="' + escape(CT.model.assetUrl(db.cdnBase, photo.src)) + '" width="512" height="280" alt="' + escape(photo.alt) + '" loading="lazy">\n' +
        '        <div class="destination-photo__overlay"></div>\n' +
        '        <figcaption class="destination-photo__caption">' + escape(photo.caption) + '</figcaption>\n' +
        '      </figure>\n';
    }

    out +=
      nav(db, slug)
        .split('\n')
        .map((l) => (l ? '    ' + l : l))
        .join('\n') +
      '      <section class="official-source">\n' +
      '        ' + ICON_EXTERNAL + '\n' +
      '        <h2 class="official-source__title">' + escape(db.officialSource.title) + '</h2>\n' +
      '        <div class="official-source__text">' + rich(db.officialSource.text) + '</div>\n' +
      '        <a class="button button--primary button--block" href="' + escape(db.officialSource.ctaHref) + '">' + escape(db.officialSource.ctaLabel) + '</a>\n' +
      '      </section>\n' +
      '    </aside>\n' +
      '  </div>\n' +
      '</section>\n';

    return out;
  }

  CT.pageHtml = { build, escape, rich, navList };
})(globalThis);
