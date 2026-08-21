(function () {
  const STORAGE_KEY = 'ct-destinations-db';
  // Ruling 21: localStorage is the only store, so every structural change
  // parks the state it replaces here and #restoreBackup swaps it back.
  const BACKUP_KEY = 'ct-destinations-db-backup';
  const FONT_LINK =
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap">';
  // Ruling 9: importing into an existing destination only touches these
  // fields — the parser cannot recover slug/name/url/published from a
  // pasted page fragment, so those stay as the operator already set them.
  const CONTENT_FIELDS = ['subtitle', 'flag', 'photo', 'entryRequirements', 'practicalInfo'];

  let db = null;
  let currentSlug = null;

  const $ = (sel) => document.querySelector(sel);

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  }

  function snapshot() {
    const prev = localStorage.getItem(STORAGE_KEY);
    if (prev === null) localStorage.removeItem(BACKUP_KEY);
    else localStorage.setItem(BACKUP_KEY, prev);
  }

  function saveStructural() {
    snapshot();
    save();
  }

  function load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (err) {
      return null;
    }
  }

  function current() {
    return db ? CT.model.find(db, currentSlug) : null;
  }

  // A duplicate slug makes every slug lookup — the form, the preview, the
  // delete index — silently pick the first row, so destructive work refuses
  // to run until the operator has made the selection unambiguous again.
  function ambiguous() {
    return !db || CT.model.findAll(db, currentSlug).length !== 1;
  }

  function blocks() {
    const opts = { includeSync: $('#includeSync').checked };
    // page-html.js throws when there is no matching destination — guard here
    // rather than in tool/lib/, which is reviewed and locked. An empty list
    // (currentSlug === null, e.g. right after deleting the last destination)
    // must render an empty preview, not throw.
    if (!current()) return { css: '', html: '', js: '' };
    return {
      css: CT.pageCss.build(db, currentSlug, opts),
      html: CT.pageHtml.build(db, currentSlug),
      js: CT.pageJs.build(db, currentSlug, opts)
    };
  }

  function renderPreview() {
    const b = blocks();
    $('#preview').srcdoc =
      '<!doctype html><html lang="pl"><head><meta charset="utf-8">' + FONT_LINK + b.css + '</head><body>' + b.html + b.js + '</body></html>';
  }

  function renderValidation() {
    if (!db) {
      $('#validation').textContent = '';
      return;
    }
    const res = CT.model.validate(db);
    $('#validation').textContent = res.ok
      ? ''
      : res.errors.map((e) => e.path + ': ' + e.message).join(' • ');
  }

  function message(text) {
    $('#validation').textContent = text;
  }

  // Ruling 7: a browser does not execute a <script> inserted via innerHTML,
  // so the single-field "copy everything" mode may silently drop the menu
  // refresh script depending on how the CMS injects the pasted content.
  function updateJoinWarning() {
    $('#joinWarning').hidden = !db || !$('#includeSync').checked;
  }

  // Ruling 15, widened: every control whose handler dereferences db is
  // marked data-needs-db in the markup and gets its enabled state from the
  // data here, on every render — never from a markup default.
  function renderControls() {
    document.querySelectorAll('[data-needs-db]').forEach((el) => { el.disabled = !db; });
    $('#deleteDest').disabled = ambiguous();
    $('#restoreBackup').disabled = localStorage.getItem(BACKUP_KEY) === null;
  }

  function renderList() {
    const ul = $('#destList');
    ul.innerHTML = '';
    const visibleCount = (db.nav && db.nav.visibleCount) || 5;
    // Ruling 17: the fold only ever matches CT.model.menuFor(db, currentSlug) — that
    // filter drops the previewed destination's own row and any unpublished row, so
    // those rows must not consume a visible slot when we count toward visibleCount.
    // The boundary is therefore per-selection, not a fixed row of the raw array.
    const menuSlugs = new Set(CT.model.menuFor(db, currentSlug).map((d) => d.slug));
    let menuSeen = 0;
    let boundaryPlaced = false;
    db.destinations.forEach((d, i) => {
      const li = document.createElement('li');
      li.className = 'dest-row';
      li.dataset.slug = d.slug;
      if (d.published === false) li.classList.add('is-unpublished');

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'dest-name';
      btn.textContent = d.name || '(bez nazwy)';
      if (d.slug === currentSlug) btn.classList.add('is-active');
      btn.addEventListener('click', () => {
        currentSlug = d.slug;
        renderAll();
      });
      li.appendChild(btn);
      li.appendChild(orderButtons(d, i));
      ul.appendChild(li);

      if (menuSlugs.has(d.slug)) menuSeen++;
      if (!boundaryPlaced && menuSeen === visibleCount) {
        boundaryPlaced = true;
        const expandLabel = (db.nav && db.nav.expandLabel) || 'Zobacz wszystkie';
        const boundary = document.createElement('li');
        boundary.className = 'list-boundary';
        boundary.textContent =
          'Kierunki poniżej są widoczne w podglądzie tej podstrony dopiero po rozwinięciu listy „' + expandLabel + '"';
        ul.appendChild(boundary);
      }
    });
  }

  function orderButtons(d, i) {
    const label = d.name || '(bez nazwy)';
    const group = document.createElement('div');
    group.className = 'dest-order';

    const up = document.createElement('button');
    up.type = 'button';
    up.textContent = '▲';
    up.setAttribute('aria-label', 'Przenieś wyżej: ' + label);
    up.disabled = i === 0;
    up.addEventListener('click', () => move(i, -1));

    const down = document.createElement('button');
    down.type = 'button';
    down.textContent = '▼';
    down.setAttribute('aria-label', 'Przenieś niżej: ' + label);
    down.disabled = i === db.destinations.length - 1;
    down.addEventListener('click', () => move(i, 1));

    group.appendChild(up);
    group.appendChild(down);
    return group;
  }

  function focusOrderButton(destIndex, delta) {
    const row = $('#destList').querySelectorAll('.dest-row')[destIndex];
    if (!row) return;
    const buttons = row.querySelectorAll('.dest-order button');
    const primary = delta < 0 ? buttons[0] : buttons[1];
    const fallback = delta < 0 ? buttons[1] : buttons[0];
    (primary && !primary.disabled ? primary : fallback).focus();
  }

  function move(i, delta) {
    const j = i + delta;
    if (j < 0 || j >= db.destinations.length) return;
    const [d] = db.destinations.splice(i, 1);
    db.destinations.splice(j, 0, d);
    saveStructural();
    renderAll();
    focusOrderButton(j, delta);
  }

  function field(labelText, value, onInput, multiline) {
    const label = document.createElement('label');
    label.textContent = labelText;
    const input = document.createElement(multiline ? 'textarea' : 'input');
    if (!multiline) input.type = 'text';
    if (multiline) input.rows = 3;
    input.value = value == null ? '' : value;
    input.addEventListener('input', () => {
      onInput(input.value);
      save();
      renderValidation();
      renderPreview();
    });
    label.appendChild(input);
    return label;
  }

  function repeater(legendText, items, makeEmpty, fields, onChange) {
    const fs = document.createElement('fieldset');
    const legend = document.createElement('legend');
    legend.textContent = legendText;
    fs.appendChild(legend);
    items.forEach((item, i) => {
      const wrap = document.createElement('div');
      fields.forEach((f) => wrap.appendChild(field(f.label, item[f.key], (v) => { item[f.key] = v; onChange(); }, f.multiline)));
      const rm = document.createElement('button');
      rm.type = 'button';
      rm.textContent = 'Usuń';
      rm.addEventListener('click', () => { items.splice(i, 1); onChange(); renderAll(); });
      const up = document.createElement('button');
      up.type = 'button';
      up.textContent = 'W górę';
      up.disabled = i === 0;
      up.addEventListener('click', () => {
        items.splice(i - 1, 0, items.splice(i, 1)[0]);
        onChange();
        renderAll();
      });
      wrap.appendChild(up);
      wrap.appendChild(rm);
      fs.appendChild(wrap);
    });
    const add = document.createElement('button');
    add.type = 'button';
    add.textContent = 'Dodaj pozycję';
    add.addEventListener('click', () => { items.push(makeEmpty()); onChange(); renderAll(); });
    fs.appendChild(add);
    return fs;
  }

  // Imported or hand-edited data can be missing whole containers that
  // validate() reports but the form would still dereference; fill them from
  // the model's defaults so the operator can repair the destination here.
  function ensureShape(d) {
    const blank = CT.model.emptyDestination();
    if (!d.photo || typeof d.photo !== 'object') d.photo = blank.photo;
    if (!d.entryRequirements || typeof d.entryRequirements !== 'object') d.entryRequirements = blank.entryRequirements;
    if (!Array.isArray(d.entryRequirements.cards)) d.entryRequirements.cards = [];
    if (!d.practicalInfo || typeof d.practicalInfo !== 'object') d.practicalInfo = blank.practicalInfo;
    if (!Array.isArray(d.practicalInfo.items)) d.practicalInfo.items = [];
  }

  function renderForm() {
    const form = $('#destForm');
    form.innerHTML = '';
    const d = current();
    if (!d) return;
    ensureShape(d);
    const commit = () => { save(); renderValidation(); renderPreview(); };

    form.appendChild(field('Nazwa', d.name, (v) => { d.name = v; renderList(); }, false));
    form.appendChild(field('Slug', d.slug, (v) => { d.slug = v; currentSlug = v; renderList(); renderControls(); }, false));
    form.appendChild(field('Adres podstrony', d.url, (v) => { d.url = v; }, false));
    form.appendChild(field('Podtytuł', d.subtitle, (v) => { d.subtitle = v; }, false));
    form.appendChild(field('Flaga (ścieżka względem CDN)', d.flag, (v) => { d.flag = v; }, false));
    form.appendChild(field('Zdjęcie (ścieżka względem CDN)', d.photo.src, (v) => { d.photo.src = v; }, false));
    form.appendChild(field('Opis alternatywny zdjęcia', d.photo.alt, (v) => { d.photo.alt = v; }, false));
    form.appendChild(field('Podpis zdjęcia', d.photo.caption, (v) => { d.photo.caption = v; }, false));

    const pub = document.createElement('label');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = d.published !== false;
    cb.addEventListener('change', () => { d.published = cb.checked; commit(); renderList(); });
    pub.appendChild(cb);
    pub.append(' Opublikowany');
    form.appendChild(pub);

    form.appendChild(field('Tytuł sekcji wymagań', d.entryRequirements.title, (v) => { d.entryRequirements.title = v; }, false));
    form.appendChild(
      repeater('Karty wymagań', d.entryRequirements.cards, () => ({ title: '', text: '' }),
        [{ label: 'Tytuł', key: 'title' }, { label: 'Treść', key: 'text', multiline: true }], commit)
    );

    form.appendChild(field('Tytuł sekcji informacji', d.practicalInfo.title, (v) => { d.practicalInfo.title = v; }, false));
    form.appendChild(
      repeater('Informacje praktyczne', d.practicalInfo.items, () => ({ term: '', desc: '' }),
        [{ label: 'Nagłówek (opcjonalny)', key: 'term' }, { label: 'Treść', key: 'desc', multiline: true }], commit)
    );

    const ml = d.practicalInfo.moreLink || { label: '', href: '' };
    form.appendChild(field('Link „więcej informacji" — etykieta', ml.label, (v) => {
      ml.label = v;
      d.practicalInfo.moreLink = ml.href ? ml : null;
    }, false));
    form.appendChild(field('Link „więcej informacji" — adres', ml.href, (v) => {
      ml.href = v;
      d.practicalInfo.moreLink = v ? ml : null;
    }, false));
  }

  function renderAll() {
    renderControls();
    if (!db) {
      $('#destList').innerHTML = '';
      $('#destForm').innerHTML = '';
      $('#preview').srcdoc = '';
      updateJoinWarning();
      return;
    }
    renderList();
    renderForm();
    renderValidation();
    renderPreview();
    updateJoinWarning();
  }

  function showImportStatus(text) {
    $('#importMessage').textContent = text;
    $('#importStatus').hidden = false;
  }

  function copy(kind) {
    const b = blocks();
    const text = kind === 'all' ? CT.bundle.join(b) : b[kind];
    const clipboard = navigator.clipboard;
    if (!clipboard || !clipboard.writeText) {
      $('#copyStatus').textContent = 'Ta przeglądarka nie udostępnia schowka — skopiuj z podglądu ręcznie';
      return;
    }
    Promise.resolve()
      .then(() => clipboard.writeText(text))
      .then(
        () => { $('#copyStatus').textContent = 'Skopiowano ' + (kind === 'all' ? 'całość' : kind.toUpperCase()); },
        () => { $('#copyStatus').textContent = 'Nie udało się skopiować'; }
      );
  }

  function replaceDb(next, note) {
    db = next;
    currentSlug = db.destinations.length ? db.destinations[0].slug : null;
    saveStructural();
    renderAll();
    if (note) message(note);
  }

  function wire() {
    document.querySelectorAll('[data-copy]').forEach((btn) => {
      btn.addEventListener('click', () => copy(btn.dataset.copy));
    });
    document.querySelectorAll('[data-width]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-width]').forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        $('#preview').style.width = btn.dataset.width + 'px';
      });
    });
    $('#includeSync').addEventListener('change', renderAll);
    $('#importDismiss').addEventListener('click', () => { $('#importStatus').hidden = true; });
    $('#addDest').addEventListener('click', () => {
      const d = CT.model.emptyDestination();
      d.slug = CT.model.nextSlug(db, 'nowy-kierunek');
      d.name = 'Nowy kierunek';
      db.destinations.push(d);
      currentSlug = d.slug;
      saveStructural();
      renderAll();
    });
    $('#loadJson').addEventListener('click', () => $('#loadDialog').showModal());
    $('#loadConfirm').addEventListener('click', () => {
      let parsed;
      try {
        parsed = JSON.parse($('#dataPaste').value);
      } catch (err) {
        message('Nie udało się odczytać JSON-a: ' + err.message + ' — dotychczasowe dane zostały nietknięte');
        return;
      }
      const problem = CT.model.loadProblem(parsed) || (parsed.destinations.length ? null : 'lista kierunków jest pusta');
      if (problem) {
        message('Nie wczytano danych: ' + problem + ' — dotychczasowe dane zostały nietknięte');
        return;
      }
      replaceDb(parsed, '');
    });
    $('#restoreBackup').addEventListener('click', () => $('#restoreDialog').showModal());
    $('#restoreConfirm').addEventListener('click', () => {
      const raw = localStorage.getItem(BACKUP_KEY);
      if (raw === null) return;
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (err) {
        message('Kopia zapasowa jest uszkodzona: ' + err.message);
        return;
      }
      const problem = CT.model.loadProblem(parsed);
      if (problem) {
        message('Kopia zapasowa jest niekompletna: ' + problem);
        return;
      }
      replaceDb(parsed, 'Przywrócono poprzednie dane. Ten sam przycisk cofa przywrócenie.');
    });
    $('#importBtn').addEventListener('click', () => $('#importDialog').showModal());
    $('#importConfirm').addEventListener('click', () => {
      const res = CT.parser.parse($('#importPaste').value, db.cdnBase);
      const warnings = res.warnings.length ? ' Ostrzeżenia: ' + res.warnings.join(' • ') : '';
      // The parser derives the slug from the page's name, so it never matches
      // a stored slug that was shortened by hand ("Tanzania - Zanzibar" →
      // "tanzania"). Task 6b's bulk import matched on the name for exactly
      // this reason; interactive import has to match the same way.
      const matches = CT.model.findAllByName(db, res.destination.name);
      if (matches.length > 1) {
        showImportStatus(
          'Nie zaimportowano: nazwa „' + res.destination.name + '" pasuje do ' + matches.length +
            ' kierunków, więc nie wiadomo, który zaktualizować. Dane bez zmian.' + warnings
        );
        return;
      }
      let target;
      if (matches.length === 1) {
        target = matches[0];
        // The parser can't know slug/name/url/published from a pasted page
        // fragment alone (url in particular is set to '' by
        // CT.model.emptyDestination()), so merging into an existing
        // destination only replaces its content fields — same fields
        // Task 6b's bulk import merges — and keeps the rest intact.
        CONTENT_FIELDS.forEach((key) => { target[key] = res.destination[key]; });
      } else {
        target = res.destination;
        target.slug = CT.model.nextSlug(db, target.slug || 'nowy-kierunek');
        db.destinations.push(target);
      }
      currentSlug = target.slug;
      saveStructural();
      renderAll();
      showImportStatus(
        (matches.length === 1 ? 'Zaktualizowano kierunek: ' : 'Dodano nowy kierunek: ') + (target.name || target.slug) +
          '.' + warnings
      );
    });
    $('#deleteDest').addEventListener('click', () => {
      const d = current();
      if (!d || ambiguous()) return;
      $('#deleteName').textContent = d.name || d.slug;
      $('#deleteDialog').showModal();
    });
    $('#deleteConfirm').addEventListener('click', () => {
      if (ambiguous()) {
        message('Nie usunięto: slug „' + currentSlug + '" ma więcej niż jeden kierunek. Napraw duplikat i spróbuj ponownie.');
        return;
      }
      const i = db.destinations.indexOf(current());
      db.destinations.splice(i, 1);
      const next = db.destinations[i] || db.destinations[i - 1] || null;
      currentSlug = next ? next.slug : null;
      saveStructural();
      renderAll();
    });
    $('#downloadJson').addEventListener('click', () => {
      if (!db) return;
      const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'destinations.json';
      a.click();
      URL.revokeObjectURL(a.href);
    });
  }

  const stored = load();
  const storedProblem = stored === null ? 'brak zapisanych danych' : CT.model.loadProblem(stored);
  db = storedProblem ? null : stored;
  wire();
  if (db && db.destinations.length) currentSlug = db.destinations[0].slug;
  renderAll();
  if (!db || !db.destinations.length) {
    if (stored !== null && storedProblem) {
      message('Zapisane dane są nieczytelne (' + storedProblem + '), więc ich nie wczytano. Kopia zapasowa pozostaje nietknięta.');
    }
    $('#loadDialog').showModal();
  }
})();
