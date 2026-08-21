(function (g) {
  const CT = (g.CT = g.CT || {});
  const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const SAFE_SCHEME_RE = /^(?:https?|mailto|tel)$/i;
  const HREF_MESSAGE = 'niedozwolony schemat adresu, dozwolone: http, https, mailto, tel albo adres względny';

  function assetUrl(cdnBase, path) {
    if (!path) return '';
    if (/^https?:\/\//i.test(path) || path.startsWith('data:')) return path;
    return String(cdnBase).replace(/\/+$/, '') + '/' + String(path).replace(/^\/+/, '');
  }

  function emptyDestination() {
    return {
      slug: '',
      name: '',
      url: '',
      published: true,
      subtitle: 'Aktualne wymagania podróżne',
      flag: '',
      photo: { src: '', alt: '', caption: '' },
      entryRequirements: { title: 'Wymagania wjazdowe', cards: [] },
      practicalInfo: { title: 'Informacje praktyczne', items: [], moreLink: null }
    };
  }

  function all(db) {
    return db && Array.isArray(db.destinations) ? db.destinations : [];
  }

  function findAll(db, slug) {
    return all(db).filter((d) => d.slug === slug);
  }

  function find(db, slug) {
    return findAll(db, slug)[0] || null;
  }

  // Names are what a pasted CMS page can be recognised by: the parser derives
  // its slug from the name, so "Tanzania - Zanzibar" never matches the stored
  // slug "tanzania". Bulk import (Task 6b) matched on the name for the same
  // reason, whitespace-normalised and case-insensitively.
  function normalizeName(name) {
    return String(name == null ? '' : name).replace(/ /g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  function findAllByName(db, name) {
    const wanted = normalizeName(name);
    return all(db).filter((d) => normalizeName(d.name) === wanted);
  }

  function nextSlug(db, base) {
    const taken = new Set(all(db).map((d) => d.slug));
    if (!taken.has(base)) return base;
    let n = 2;
    while (taken.has(base + '-' + n)) n++;
    return base + '-' + n;
  }

  function menuFor(db, slug) {
    return all(db).filter((d) => d.published !== false && d.slug !== slug);
  }

  function heroFor(db, slug) {
    const dest = find(db, slug);
    return Object.assign({}, db.hero, (dest && dest.hero) || {});
  }

  // A browser strips whitespace inside a scheme, so "java\tscript:" runs as
  // javascript:; collapse before reading the scheme off the front.
  function unsafeHref(value) {
    const match = /^([a-z][a-z0-9+.-]*):/i.exec(String(value == null ? '' : value).replace(/\s+/g, ''));
    return !!match && !SAFE_SCHEME_RE.test(match[1]);
  }

  function requireText(errors, obj, path, key, message) {
    const value = obj ? obj[key] : null;
    if (!value || !String(value).trim()) errors.push({ path: path + '.' + key, message: message });
  }

  function checkHref(errors, obj, path, key) {
    if (obj && obj[key] && unsafeHref(obj[key])) errors.push({ path: path + '.' + key, message: HREF_MESSAGE });
  }

  function validateHero(errors, hero, path) {
    requireText(errors, hero, path, 'title', 'tytuł sekcji powitalnej jest wymagany');
    requireText(errors, hero, path, 'subtitle', 'podtytuł sekcji powitalnej jest wymagany');
    requireText(errors, hero, path, 'image', 'obraz sekcji powitalnej jest wymagany');
    requireText(errors, hero, path, 'ctaLabel', 'etykieta przycisku sekcji powitalnej jest wymagana');
    requireText(errors, hero, path, 'ctaHref', 'adres przycisku sekcji powitalnej jest wymagany');
    checkHref(errors, hero, path, 'ctaHref');
  }

  function validateDestination(errors, db, d, at) {
    if (!d.name || !d.name.trim()) errors.push({ path: at + '.name', message: 'nazwa jest wymagana' });
    if (!d.url || !/^https?:\/\//i.test(d.url)) {
      errors.push({ path: at + '.url', message: 'adres URL jest wymagany i musi zaczynać się od http' });
    }
    if (d.hero) validateHero(errors, Object.assign({}, db.hero, d.hero), at + '.hero');

    const req = d.entryRequirements;
    if (req) {
      if (!Array.isArray(req.cards)) {
        errors.push({ path: at + '.entryRequirements.cards', message: 'karty wymagań muszą być tablicą' });
      } else if (req.cards.length) {
        requireText(errors, req, at + '.entryRequirements', 'title', 'tytuł sekcji wymagań jest wymagany');
      }
    }

    const info = d.practicalInfo;
    if (info) {
      if (!Array.isArray(info.items)) {
        errors.push({ path: at + '.practicalInfo.items', message: 'lista informacji praktycznych musi być tablicą' });
      } else if (info.items.length || (info.moreLink && info.moreLink.href)) {
        requireText(errors, info, at + '.practicalInfo', 'title', 'tytuł sekcji informacji praktycznych jest wymagany');
      }
      checkHref(errors, info.moreLink, at + '.practicalInfo.moreLink', 'href');
    }
  }

  // Ruling 6: the generated code carries no runtime fallbacks, so every shape
  // the generators dereference has to be a validation error here instead.
  function validate(db) {
    const errors = [];
    const seen = new Set();
    if (!db || typeof db !== 'object') return { ok: false, errors: [{ path: '', message: 'dane muszą być obiektem' }] };
    if (!Array.isArray(db.destinations)) {
      errors.push({ path: 'destinations', message: 'lista kierunków musi być tablicą' });
    }
    all(db).forEach((d, i) => {
      const at = 'destinations[' + i + ']';
      if (!d.slug || !SLUG_RE.test(d.slug)) {
        errors.push({ path: at + '.slug', message: 'zły format sluga, dozwolone: a-z, 0-9 i myślnik' });
      } else if (seen.has(d.slug)) {
        errors.push({ path: at + '.slug', message: 'duplikat sluga: ' + d.slug });
      } else {
        seen.add(d.slug);
      }
      validateDestination(errors, db, d, at);
    });

    if (!db.cdnBase) errors.push({ path: 'cdnBase', message: 'adres bazowy CDN jest wymagany' });
    if (!db.arrowIcon || !String(db.arrowIcon).trim()) {
      errors.push({ path: 'arrowIcon', message: 'ścieżka ikony strzałki jest wymagana' });
    }

    if (!db.hero) errors.push({ path: 'hero', message: 'sekcja powitalna jest wymagana' });
    else validateHero(errors, db.hero, 'hero');

    if (!db.nav) {
      errors.push({ path: 'nav', message: 'sekcja listy kierunków jest wymagana' });
    } else {
      requireText(errors, db.nav, 'nav', 'title', 'tytuł listy kierunków jest wymagany');
      requireText(errors, db.nav, 'nav', 'expandLabel', 'etykieta rozwinięcia listy jest wymagana');
      requireText(errors, db.nav, 'nav', 'collapseLabel', 'etykieta zwinięcia listy jest wymagana');
    }

    if (!db.officialSource) {
      errors.push({ path: 'officialSource', message: 'sekcja oficjalnego źródła jest wymagana' });
    } else {
      requireText(errors, db.officialSource, 'officialSource', 'title', 'tytuł oficjalnego źródła jest wymagany');
      requireText(errors, db.officialSource, 'officialSource', 'text', 'opis oficjalnego źródła jest wymagany');
      requireText(errors, db.officialSource, 'officialSource', 'ctaLabel', 'etykieta przycisku oficjalnego źródła jest wymagana');
      requireText(errors, db.officialSource, 'officialSource', 'ctaHref', 'adres oficjalnego źródła jest wymagany');
      checkHref(errors, db.officialSource, 'officialSource', 'ctaHref');
    }

    return { ok: errors.length === 0, errors: errors };
  }

  // Structural gate for data arriving from outside the tool: enough to know the
  // rest of the app can render it. Content problems stay validate()'s job.
  function loadProblem(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return 'oczekiwano obiektu z danymi';
    if (!Array.isArray(data.destinations)) return 'brak listy kierunków (pole "destinations")';
    const bad = data.destinations.findIndex((d) => !d || typeof d !== 'object' || !d.slug || typeof d.slug !== 'string');
    if (bad !== -1) return 'kierunek nr ' + (bad + 1) + ' nie ma sluga';
    return null;
  }

  CT.model = {
    assetUrl, emptyDestination, find, findAll, findAllByName, nextSlug, normalizeName,
    menuFor, heroFor, validate, loadProblem, unsafeHref, SLUG_RE
  };
})(globalThis);
