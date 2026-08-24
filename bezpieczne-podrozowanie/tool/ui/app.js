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
    const handle = sortable(ul, db.destinations, {
      label: (d) => (d && d.name) || '(bez nazwy)',
      after: (index) => {
        saveStructural();
        renderAll();
        focusHandle($('#destList'), index);
      }
    });
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
      li.appendChild(handle(d, i, li));
      li.appendChild(btn);
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

  let liveRegion = null;

  function announce(text) {
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.className = 'sr-only';
      liveRegion.setAttribute('aria-live', 'polite');
      document.body.appendChild(liveRegion);
    }
    liveRegion.textContent = text;
  }

  // One reorder mechanism for both the destination list and the repeater rows.
  // The handle is a real button, not a decorated div: a pointer drags it, and
  // ArrowUp/ArrowDown move the row without one. Native drag and drop is
  // pointer-only, so without the key handling this would take reordering away
  // from anyone not using a mouse — which is what the old ▲▼ pair provided.
  function sortable(container, list, opts) {
    let from = null;

    const rows = () => Array.from(container.querySelectorAll('[data-sort]'));
    const clearMarks = () => rows().forEach((r) => r.classList.remove('is-drop-before', 'is-drop-after'));

    function commit(a, b) {
      if (a === b || b < 0 || b >= list.length) return;
      CT.model.moveItem(list, a, b);
      announce(opts.label(list[b]) + ': pozycja ' + (b + 1) + ' z ' + list.length);
      opts.after(b);
    }

    // Which slot the pointer is asking for: above the hovered row or below it.
    function targetIndex(event) {
      const row = event.target.closest ? event.target.closest('[data-sort]') : null;
      if (!row || !container.contains(row)) return null;
      const box = row.getBoundingClientRect();
      const before = event.clientY < box.top + box.height / 2;
      const at = Number(row.dataset.sort);
      row.classList.add(before ? 'is-drop-before' : 'is-drop-after');
      const slot = before ? at : at + 1;
      // The item is lifted out before it is dropped back in, so every slot
      // after its old position shifts down by one.
      return from !== null && from < slot ? slot - 1 : slot;
    }

    container.addEventListener('dragover', (e) => {
      if (from === null) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      clearMarks();
      targetIndex(e);
    });

    container.addEventListener('drop', (e) => {
      if (from === null) return;
      e.preventDefault();
      const to = targetIndex(e);
      clearMarks();
      if (to !== null) commit(from, to);
    });

    container.addEventListener('dragleave', (e) => {
      if (!container.contains(e.relatedTarget)) clearMarks();
    });

    return function handle(item, index, row) {
      row.dataset.sort = index;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sort-handle';
      btn.textContent = '⠿';
      btn.setAttribute('aria-label', 'Zmień kolejność: ' + opts.label(item) + ', pozycja ' + (index + 1) + ' z ' + list.length);
      btn.title = 'Przeciągnij albo użyj strzałek góra/dół';

      // draggable only while the handle is held, so text inside the row stays
      // selectable and the row's own click still selects a destination.
      btn.addEventListener('pointerdown', () => { row.draggable = true; });
      btn.addEventListener('pointerup', () => { row.draggable = false; });

      row.addEventListener('dragstart', (e) => {
        from = index;
        row.classList.add('is-dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(index));
      });

      row.addEventListener('dragend', () => {
        from = null;
        row.draggable = false;
        row.classList.remove('is-dragging');
        clearMarks();
      });

      btn.addEventListener('keydown', (e) => {
        const delta = e.key === 'ArrowUp' ? -1 : e.key === 'ArrowDown' ? 1 : 0;
        if (!delta) return;
        e.preventDefault();
        commit(index, index + delta);
      });

      return btn;
    };
  }

  function focusHandle(container, index) {
    const row = container.querySelectorAll('[data-sort]')[index];
    const btn = row && row.querySelector('.sort-handle');
    if (btn) btn.focus();
  }

  let hintSeq = 0;

  // Labels stay short and the qualifier drops to a hint under the input.
  // A flat stack of long bold labels reads as one grey wall; the group legend
  // carries the context instead, so "Flaga (ścieżka względem CDN)" can just be
  // "Flaga".
  function field(labelText, value, onInput, multiline, hint) {
    const label = document.createElement('label');
    const caption = document.createElement('span');
    caption.className = 'field__label';
    caption.textContent = labelText;
    label.appendChild(caption);

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

    if (hint) {
      const small = document.createElement('small');
      small.className = 'field__hint';
      small.id = 'hint-' + ++hintSeq;
      small.textContent = hint;
      input.setAttribute('aria-describedby', small.id);
      label.appendChild(small);
    }
    return label;
  }

  function group(legendText, children) {
    const fs = document.createElement('fieldset');
    const legend = document.createElement('legend');
    legend.textContent = legendText;
    fs.appendChild(legend);
    children.forEach((c) => fs.appendChild(c));
    return fs;
  }

  let richFieldSeq = 0;

  // execCommand is formally deprecated but has no replacement with this reach.
  // Everything it produces goes through the sanitiser on the way to the model,
  // so browser-to-browser differences in its output never reach the data.
  function richField(labelText, value, onInput) {
    const wrap = document.createElement('div');
    wrap.className = 'rich';

    const caption = document.createElement('span');
    caption.className = 'rich__label';
    caption.id = 'rich-label-' + ++richFieldSeq;
    caption.textContent = labelText;

    const editor = document.createElement('div');
    editor.className = 'rich__input';
    editor.contentEditable = 'true';
    editor.setAttribute('role', 'textbox');
    editor.setAttribute('aria-multiline', 'true');
    editor.setAttribute('aria-labelledby', caption.id);
    editor.innerHTML = CT.richText.sanitize(value);

    let timer = null;
    // Never write back into the editor here — replacing innerHTML mid-typing
    // would drop the caret. Only the value handed to the model is sanitised.
    const commit = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        onInput(CT.richText.sanitize(editor.innerHTML));
        save();
        renderValidation();
        renderPreview();
      }, 200);
    };

    const bar = document.createElement('div');
    bar.className = 'rich__bar';
    bar.setAttribute('role', 'toolbar');
    bar.setAttribute('aria-label', labelText + ' — formatowanie');

    const command = (title, cmd) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = title;
      b.addEventListener('click', () => {
        editor.focus();
        document.execCommand(cmd);
        commit();
      });
      bar.appendChild(b);
    };

    command('Pogrubienie', 'bold');
    command('Kursywa', 'italic');

    const urlRow = document.createElement('div');
    urlRow.className = 'rich__url';
    urlRow.hidden = true;
    const url = document.createElement('input');
    url.type = 'url';
    url.placeholder = 'https://…';
    url.setAttribute('aria-label', 'Adres linku');
    const confirm = document.createElement('button');
    confirm.type = 'button';
    confirm.textContent = 'Zastosuj';
    urlRow.appendChild(url);
    urlRow.appendChild(confirm);

    // Focusing the input collapses the selection, so park the range first and
    // put it back before createLink runs.
    let saved = null;
    const linkBtn = document.createElement('button');
    linkBtn.type = 'button';
    linkBtn.textContent = 'Wstaw link';
    linkBtn.addEventListener('click', () => {
      const sel = window.getSelection();
      saved = sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
      urlRow.hidden = false;
      url.focus();
    });
    bar.appendChild(linkBtn);

    confirm.addEventListener('click', () => {
      const href = url.value.trim();
      urlRow.hidden = true;
      url.value = '';
      if (!href || !saved) return;
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(saved);
      editor.focus();
      document.execCommand('createLink', false, href);
      commit();
    });

    command('Usuń link', 'unlink');
    command('Wyczyść formatowanie', 'removeFormat');

    // Plain Enter would produce <div> wrappers the sanitiser flattens back to
    // <br> anyway; inserting the break directly keeps the DOM honest.
    editor.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      if (!document.execCommand('insertLineBreak')) document.execCommand('insertHTML', false, '<br>');
    });

    editor.addEventListener('paste', (e) => {
      e.preventDefault();
      const cd = e.clipboardData;
      const html = cd.getData('text/html');
      const clean = html
        ? CT.richText.sanitize(html)
        : CT.pageHtml.escape(cd.getData('text/plain')).replace(/\r?\n/g, '<br>');
      document.execCommand('insertHTML', false, clean);
      commit();
    });

    editor.addEventListener('input', commit);

    wrap.appendChild(caption);
    wrap.appendChild(bar);
    wrap.appendChild(urlRow);
    wrap.appendChild(editor);
    return wrap;
  }

  function repeater(legendText, items, makeEmpty, fields, onChange, opts) {
    const settings = opts || {};
    const fs = document.createElement('fieldset');
    const legend = document.createElement('legend');
    legend.textContent = legendText;
    fs.appendChild(legend);
    if (settings.head) fs.appendChild(settings.head);

    const rowsBox = document.createElement('div');
    rowsBox.className = 'repeat';
    fs.appendChild(rowsBox);

    const handle = sortable(rowsBox, items, {
      label: (it) => (it && (it.title || it.term || CT.richText.toPlain(it.text || it.desc))) || '(pusta pozycja)',
      after: () => { onChange(); renderAll(); }
    });

    items.forEach((item, i) => {
      const wrap = document.createElement('div');
      wrap.className = 'repeat__row';
      fields.forEach((f) => wrap.appendChild(
        f.rich
          ? richField(f.label, item[f.key], (v) => { item[f.key] = v; onChange(); })
          : field(f.label, item[f.key], (v) => { item[f.key] = v; onChange(); }, f.multiline, f.hint)
      ));
      const rm = document.createElement('button');
      rm.type = 'button';
      rm.textContent = 'Usuń';
      rm.addEventListener('click', () => { items.splice(i, 1); onChange(); renderAll(); });

      const bar = document.createElement('div');
      bar.className = 'repeat__bar';
      bar.appendChild(handle(item, i, wrap));
      bar.appendChild(rm);
      wrap.insertBefore(bar, wrap.firstChild);
      rowsBox.appendChild(wrap);
    });
    const add = document.createElement('button');
    add.type = 'button';
    add.textContent = settings.addLabel || 'Dodaj pozycję';
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

    const pub = document.createElement('label');
    pub.className = 'field--check';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = d.published !== false;
    cb.addEventListener('change', () => { d.published = cb.checked; commit(); renderList(); });
    pub.appendChild(cb);
    pub.append(' Opublikowany');

    form.appendChild(group('Kierunek', [
      field('Nazwa', d.name, (v) => { d.name = v; renderList(); }, false),
      field('Slug', d.slug, (v) => { d.slug = v; currentSlug = v; renderList(); renderControls(); }, false,
        'tylko małe litery, cyfry i myślniki'),
      field('Adres podstrony', d.url, (v) => { d.url = v; }, false),
      field('Podtytuł', d.subtitle, (v) => { d.subtitle = v; }, false),
      pub
    ]));

    form.appendChild(group('Grafika', [
      field('Flaga', d.flag, (v) => { d.flag = v; }, false, 'ścieżka względem CDN'),
      field('Zdjęcie', d.photo.src, (v) => { d.photo.src = v; }, false, 'ścieżka względem CDN'),
      field('Opis alternatywny', d.photo.alt, (v) => { d.photo.alt = v; }, false, 'czytany przez czytniki ekranu'),
      field('Podpis', d.photo.caption, (v) => { d.photo.caption = v; }, false)
    ]));

    form.appendChild(
      repeater('Wymagania wjazdowe', d.entryRequirements.cards, () => ({ title: '', text: '' }),
        [{ label: 'Tytuł', key: 'title' }, { label: 'Treść', key: 'text', rich: true }], commit,
        {
          addLabel: 'Dodaj kartę',
          head: field('Tytuł sekcji', d.entryRequirements.title, (v) => { d.entryRequirements.title = v; }, false)
        })
    );

    form.appendChild(
      repeater('Informacje praktyczne', d.practicalInfo.items, () => ({ term: '', desc: '' }),
        [{ label: 'Nagłówek', key: 'term', hint: 'opcjonalny' }, { label: 'Treść', key: 'desc', rich: true }], commit,
        {
          addLabel: 'Dodaj pozycję',
          head: field('Tytuł sekcji', d.practicalInfo.title, (v) => { d.practicalInfo.title = v; }, false)
        })
    );

    const ml = d.practicalInfo.moreLink || { label: '', href: '' };
    form.appendChild(group('Link „więcej informacji"', [
      field('Etykieta', ml.label, (v) => {
        ml.label = v;
        d.practicalInfo.moreLink = ml.href ? ml : null;
      }, false),
      field('Adres', ml.href, (v) => {
        ml.href = v;
        d.practicalInfo.moreLink = v ? ml : null;
      }, false)
    ]));
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

  // Both load paths (pasted JSON and the restored backup) end up here, and so
  // does startup — the one entry point the parser and the editor do not cover.
  function replaceDb(next, note) {
    db = CT.model.sanitizeRich(next);
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
  db = storedProblem ? null : CT.model.sanitizeRich(stored);
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
