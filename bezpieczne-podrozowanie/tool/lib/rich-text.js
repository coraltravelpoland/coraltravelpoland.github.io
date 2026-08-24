(function (g) {
  const CT = (g.CT = g.CT || {});

  // The whole point of the module: exactly these tags survive, nothing else.
  const ALLOWED = { BR: [], STRONG: [], EM: [], A: ['href', 'target', 'rel'], UL: [], OL: [], LI: [] };
  const RENAME = { B: 'STRONG', I: 'EM' };
  // Dropped whole, text and all — their content is markup, not prose.
  const DROP = { SCRIPT: 1, STYLE: 1, IFRAME: 1, OBJECT: 1, EMBED: 1, TEMPLATE: 1 };
  // Unwrapping these loses a line boundary the reader can see, so leave a <br>
  // behind; trailing ones are trimmed at the end anyway.
  const BLOCK = { P: 1, DIV: 1, TR: 1 };

  function doc(html) {
    return new DOMParser().parseFromString(String(html == null ? '' : html), 'text/html');
  }

  function unwrap(el, asBreak) {
    const parent = el.parentNode;
    while (el.firstChild) parent.insertBefore(el.firstChild, el);
    if (asBreak) parent.insertBefore(el.ownerDocument.createElement('br'), el);
    parent.removeChild(el);
  }

  function rename(el, tag) {
    const replacement = el.ownerDocument.createElement(tag);
    while (el.firstChild) replacement.appendChild(el.firstChild);
    el.parentNode.replaceChild(replacement, el);
    return replacement;
  }

  function keepAnchor(el) {
    const href = el.getAttribute('href');
    return !!href && !CT.model.unsafeHref(href);
  }

  function stripAttributes(el, allowed) {
    Array.from(el.attributes).forEach((attr) => {
      if (allowed.indexOf(attr.name) === -1) el.removeAttribute(attr.name);
    });
  }

  function walk(node) {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === 3) {
        child.nodeValue = child.nodeValue.replace(/ /g, ' ').replace(/\s+/g, ' ');
        return;
      }
      if (child.nodeType !== 1) {
        child.parentNode.removeChild(child);
        return;
      }
      if (DROP[child.tagName]) {
        child.parentNode.removeChild(child);
        return;
      }
      walk(child);
      const tag = RENAME[child.tagName] || child.tagName;
      if (!Object.prototype.hasOwnProperty.call(ALLOWED, tag)) {
        unwrap(child, BLOCK[child.tagName] === 1);
        return;
      }
      const el = tag === child.tagName ? child : rename(child, tag);
      stripAttributes(el, ALLOWED[tag]);
      if (tag === 'A') {
        if (!keepAnchor(el)) {
          unwrap(el, false);
          return;
        }
        if (el.getAttribute('target') === '_blank') el.setAttribute('rel', 'noopener noreferrer');
      }
    });
  }

  function isList(el) {
    return !!el && (el.tagName === 'UL' || el.tagName === 'OL');
  }

  // The whitelist says which tags may appear; this says how they must fit
  // together. Input arrives from a clipboard and from CMS pages, so a list
  // nested in an item, a list holding loose text, or an item with no list at
  // all are all shapes that actually turn up.
  function normaliseLists(root) {
    let nested = root.querySelector('li ul, li ol');
    while (nested) {
      const item = nested.closest('li');
      const outer = item.parentNode;
      const after = item.nextSibling;
      while (nested.firstChild) {
        const kid = nested.firstChild;
        // Successive inserts before the same reference keep their order.
        if (kid.tagName === 'LI') outer.insertBefore(kid, after);
        else item.appendChild(kid);
      }
      nested.parentNode.removeChild(nested);
      nested = root.querySelector('li ul, li ol');
    }

    Array.from(root.querySelectorAll('ul, ol')).forEach((list) => {
      Array.from(list.childNodes).forEach((kid) => {
        if (kid.nodeType === 1 && kid.tagName === 'LI') return;
        list.parentNode.insertBefore(kid, list);
      });
    });

    Array.from(root.querySelectorAll('li')).forEach((li) => {
      if (!isList(li.parentNode)) unwrap(li, true);
    });

    Array.from(root.querySelectorAll('li')).forEach((li) => {
      if (!li.textContent.trim()) li.parentNode.removeChild(li);
    });

    Array.from(root.querySelectorAll('ul, ol')).forEach((list) => {
      if (!list.querySelector('li')) list.parentNode.removeChild(list);
    });
  }

  function sanitize(html) {
    const body = doc(html).body;
    walk(body);
    normaliseLists(body);
    return body.innerHTML
      .replace(/^(?:\s*<br>)+/, '')
      .replace(/(?:<br>\s*)+$/, '')
      .trim();
  }

  function toPlain(html) {
    return doc(html).body.textContent.replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
  }

  function hrefs(html) {
    return Array.from(doc(html).querySelectorAll('a[href]')).map((a) => a.getAttribute('href'));
  }

  CT.richText = { sanitize, toPlain, hrefs };
})(globalThis);
