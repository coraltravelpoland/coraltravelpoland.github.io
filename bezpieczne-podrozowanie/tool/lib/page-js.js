(function (g) {
  const CT = (g.CT = g.CT || {});

  function menuFrom(data, current) {
    if (!data || !Array.isArray(data.destinations)) return null;
    return data.destinations.filter((d) => d.published !== false && d.slug !== current);
  }

  function renderList(data, items, indent) {
    const arrow = CT.model.assetUrl(data.cdnBase, data.arrowIcon);
    const esc = CT.pageHtml.escape;
    return (
      indent + '<ul class="destinations-nav__list">\n' +
      items
        .map(
          (d) =>
            indent + '  <li>\n' +
            indent + '    <a class="destinations-nav__item" href="' + esc(d.url) + '">\n' +
            indent + '      <span class="destinations-nav__name">' + esc(d.name) + '</span>\n' +
            indent + '      <img class="destinations-nav__arrow" src="' + esc(arrow) + '" width="24" height="24" alt="" loading="lazy">\n' +
            indent + '    </a>\n' +
            indent + '  </li>\n'
        )
        .join('') +
      indent + '</ul>\n'
    );
  }

  function applyRefresh(root, data, expectedVersion) {
    if (!root) return false;
    if (!data || data.version !== expectedVersion) return false;
    const current = root.getAttribute('data-current');
    const items = menuFrom(data, current);
    if (!items || items.length < 1) return false;

    const rendered = Array.from(root.querySelectorAll('.destinations-nav__item')).map((a) => a.getAttribute('href'));
    const incoming = items.map((d) => d.url);
    if (rendered.join('|') === incoming.join('|')) return false;

    const nav = data.nav || {};
    const visible = nav.visibleCount || 5;
    const esc = CT.pageHtml.escape;
    let html = '<h2 class="destinations-nav__title">' + esc(nav.title) + '</h2>\n';
    html += renderList(data, items.slice(0, visible), '');
    if (items.length > visible) {
      html +=
        '<details class="destinations-nav__more">\n' +
        '  <summary class="destinations-nav__toggle">\n' +
        '    <span class="destinations-nav__toggle-more">' + esc(nav.expandLabel) + '</span>\n' +
        '    <span class="destinations-nav__toggle-less">' + esc(nav.collapseLabel) + '</span>\n' +
        '  </summary>\n' +
        renderList(data, items.slice(visible), '  ') +
        '</details>\n';
    }
    root.innerHTML = html;
    return true;
  }

  function build(db, slug, opts) {
    if (!opts || !opts.includeSync) return '';
    const url = CT.model.assetUrl(db.cdnBase, 'destinations.json');
    const version = db.version || 1;
    // Imperva, the CDN in front of cdnBase, drops Access-Control-Allow-Origin from every
    // response it serves out of its edge cache; only a cache miss carries the header through
    // from the storage origin. destinations.json ships with max-age=31536000, so a shared URL
    // is cached within seconds and every later reader gets a CORS failure. A per-request
    // cache buster keeps the fetch missing the edge. Drop it once the CDN keeps the header
    // on cached responses.
    const body = String.raw`window.addEventListener('load', function () {
  var root = document.querySelector('.destinations-nav');
  if (!root) return;
  var current = root.getAttribute('data-current');

  var src = '${url}';
  src += (src.indexOf('?') === -1 ? '?' : '&') + 'cb=' + Date.now() + '.' + Math.random().toString(36).slice(2);

  fetch(src, { credentials: 'omit' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      if (!root.isConnected) return;
      if (!data || data.version !== ${version} || !Array.isArray(data.destinations)) return;
      var items = data.destinations.filter(function (d) {
        return d.published !== false && d.slug !== current;
      });
      if (!items.length) return;
      var hrefs = Array.from(root.querySelectorAll('.destinations-nav__item'), function (a) {
        return a.getAttribute('href');
      });
      var incoming = items.map(function (d) { return d.url; });
      if (hrefs.join('|') === incoming.join('|')) return;
      root.innerHTML = markup(data, items);
    })
    .catch(function () {});

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/\u003c/g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function asset(data, path) {
    if (!path) return '';
    if (/^https?:\/\//i.test(path) || String(path).indexOf('data:') === 0) return path;
    return String(data.cdnBase).replace(/\/+$/, '') + '/' + String(path).replace(/^\/+/, '');
  }

  function list(data, rows) {
    var arrow = asset(data, data.arrowIcon);
    return rows.map(function (d) {
      return '\u003cli>\u003ca class="destinations-nav__item" href="' + esc(d.url) + '">' +
        '\u003cspan class="destinations-nav__name">' + esc(d.name) + '\u003c/span>' +
        '\u003cimg class="destinations-nav__arrow" src="' + esc(arrow) + '" width="24" height="24" alt="" loading="lazy">' +
        '\u003c/a>\u003c/li>';
    }).join('');
  }

  function markup(data, rows) {
    var nav = data.nav || {};
    var visible = nav.visibleCount || 5;
    var html = '\u003ch2 class="destinations-nav__title">' + esc(nav.title) + '\u003c/h2>' +
      '\u003cul class="destinations-nav__list">' + list(data, rows.slice(0, visible)) + '\u003c/ul>';
    if (rows.length > visible) {
      html += '\u003cdetails class="destinations-nav__more">\u003csummary class="destinations-nav__toggle">' +
        '\u003cspan class="destinations-nav__toggle-more">' + esc(nav.expandLabel) + '\u003c/span>' +
        '\u003cspan class="destinations-nav__toggle-less">' + esc(nav.collapseLabel) + '\u003c/span>' +
        '\u003c/summary>\u003cul class="destinations-nav__list">' + list(data, rows.slice(visible)) + '\u003c/ul>\u003c/details>';
    }
    return html;
  }
});`;
    return '<script>\n' + body + '\n</' + 'script>\n';
  }

  CT.pageJs = { build, applyRefresh };
})(globalThis);
