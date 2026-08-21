(function (g) {
  const CT = (g.CT = g.CT || {});

  // <br> carries a line break that textContent drops entirely, gluing the
  // surrounding sentences together; the model has no way to express a break
  // inside desc/text, so a space is the closest faithful reading.
  function textOf(node) {
    if (!node) return '';
    const copy = node.cloneNode(true);
    copy.querySelectorAll('br').forEach((br) => {
      br.replaceWith(br.ownerDocument.createTextNode(' '));
    });
    return copy.textContent.replace(/\s+/g, ' ').trim();
  }

  function relative(src, cdnBase) {
    if (!src) return '';
    const base = String(cdnBase).replace(/\/+$/, '') + '/';
    return src.startsWith(base) ? src.slice(base.length) : src;
  }

  function pick(doc, selectors) {
    for (const sel of selectors) {
      const el = doc.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  function isHidden(el) {
    return !!(el.closest && el.closest('.d-none'));
  }

  // Term-less items pulled from a <ul>/<ol> that sits either nested inside a
  // practical-info <li> (rate tables under an intro line) or as a sibling of
  // the item list itself (content the CMS authors left outside the <li>s).
  function listToItems(listEl) {
    return Array.from(listEl.children)
      .filter((child) => child.tagName === 'LI')
      .map((li) => textOf(li))
      .filter(Boolean)
      .map((desc) => ({ desc: desc }));
  }

  function parseItem(li) {
    const wrapper = li.querySelector('div') || li;
    const termEl = wrapper.querySelector('.fact-list__term, .overview-card__title');
    const term = textOf(termEl);
    const extras = [];
    let desc = '';
    let descTaken = false;

    Array.from(wrapper.children).forEach((el) => {
      if (el === termEl) return;
      if (el.tagName === 'UL' || el.tagName === 'OL') {
        extras.push(...listToItems(el));
        return;
      }
      const text = textOf(el);
      if (!text) return;
      if (!descTaken) {
        desc = text;
        descTaken = true;
      } else {
        extras.push({ desc: text });
      }
    });

    const item = term ? { term: term, desc: desc } : { desc: desc };
    return [item].concat(extras);
  }

  // Paragraphs and lists that sit alongside the item <ul> (before or after
  // it) rather than inside one of its <li>s. The hidden "więcej informacji"
  // block is a sibling too, so anything under .d-none is skipped here —
  // that stays handled by the moreLink warning below.
  function siblingFlowItems(topLists) {
    if (!topLists.length) return { before: [], after: [] };
    const container = topLists[0].parentElement;
    if (!container) return { before: [], after: [] };
    const before = [];
    const after = [];
    let pastLists = false;
    Array.from(container.children).forEach((el) => {
      if (topLists.indexOf(el) !== -1) {
        pastLists = true;
        return;
      }
      if (isHidden(el)) return;
      const bucket = pastLists ? after : before;
      if (el.tagName === 'UL' || el.tagName === 'OL') {
        bucket.push(...listToItems(el));
      } else if (el.tagName === 'P') {
        const text = textOf(el);
        if (text) bucket.push({ desc: text });
      }
    });
    return { before: before, after: after };
  }

  function parse(html, cdnBase) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const warnings = [];
    const dest = CT.model.emptyDestination();

    const nameEl = pick(doc, ['.destination-header__title', '.travel-overview__title']);
    dest.name = textOf(nameEl);
    if (!dest.name) warnings.push('nie znaleziono nazwy kierunku');
    dest.slug = dest.name
      .toLowerCase()
      .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e').replace(/ł/g, 'l')
      .replace(/ń/g, 'n').replace(/ó/g, 'o').replace(/ś/g, 's').replace(/[żź]/g, 'z')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    dest.subtitle = textOf(pick(doc, ['.destination-header__subtitle', '.travel-overview__subtitle'])) || dest.subtitle;

    const flagEl = pick(doc, ['.destination-header__flag', '.travel-overview__flag img']);
    dest.flag = flagEl ? relative(flagEl.getAttribute('src'), cdnBase) : '';
    if (!dest.flag) warnings.push('nie znaleziono flagi');

    const photoEl = pick(doc, ['.destination-photo__img', '.overview-side__image-wrapper img']);
    const captionEl = pick(doc, ['.destination-photo__caption', '.overview-side__img-text']);
    dest.photo = {
      src: photoEl ? relative(photoEl.getAttribute('src'), cdnBase) : '',
      alt: photoEl ? photoEl.getAttribute('alt') || '' : '',
      caption: textOf(captionEl)
    };
    if (!dest.photo.src) warnings.push('nie znaleziono zdjęcia kierunku');

    const reqSection = doc.querySelector('#wymagania');
    if (reqSection) {
      dest.entryRequirements.title =
        textOf(reqSection.querySelector('.info-section__title, .overview-section__title')) || dest.entryRequirements.title;
      dest.entryRequirements.cards = Array.from(
        reqSection.querySelectorAll('.info-card, .overview-card.card')
      ).map((card) => ({
        title: textOf(card.querySelector('.info-card__title, .overview-card__title')),
        text: textOf(card.querySelector('.info-card__text, .overview-card__text'))
      }));
    } else {
      warnings.push('nie znaleziono sekcji wymagań wjazdowych');
    }

    const infoSection = doc.querySelector('#info');
    if (infoSection) {
      dest.practicalInfo.title =
        textOf(infoSection.querySelector('.info-section__title, .overview-section__title')) || dest.practicalInfo.title;
      const topLists = Array.from(infoSection.querySelectorAll('.fact-list, .overview-list'));
      const itemEls = Array.from(infoSection.querySelectorAll('.fact-list__item, .overview-list__item'));
      const flow = siblingFlowItems(topLists);
      dest.practicalInfo.items = flow.before.concat(
        itemEls.reduce((acc, li) => acc.concat(parseItem(li)), []),
        flow.after
      );

      const moreEl = infoSection.querySelector('.more-link, .overview-section__more-link');
      if (moreEl && moreEl.closest('.d-none')) {
        // Legacy pages always ship this block as a hidden copy-paste artefact pointing
        // at the Turkey gov.pl page; importing it would misattribute it to every country.
        dest.practicalInfo.moreLink = null;
        warnings.push(
          'pominięto ukryty link "więcej informacji" (klasa d-none), wskazywał na: ' +
            (moreEl.getAttribute('href') || '(brak href)')
        );
      } else {
        dest.practicalInfo.moreLink = moreEl
          ? { label: textOf(moreEl), href: moreEl.getAttribute('href') }
          : null;
      }
    } else {
      warnings.push('nie znaleziono sekcji informacji praktycznych');
    }

    return { destination: dest, warnings: warnings };
  }

  CT.parser = { parse };
})(globalThis);
