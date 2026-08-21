(function (g) {
  const CT = (g.CT = g.CT || {});

  function join(parts) {
    return [parts.css, parts.html, parts.js].filter(Boolean).join('\n');
  }

  function split(text) {
    const src = String(text);
    const styleEnd = src.indexOf('</style>');
    const scriptStart = src.indexOf('<script');
    const css = styleEnd === -1 ? '' : src.slice(0, styleEnd + '</style>'.length);
    const rest = styleEnd === -1 ? src : src.slice(styleEnd + '</style>'.length);
    const cut = scriptStart === -1 ? -1 : scriptStart - (styleEnd === -1 ? 0 : styleEnd + '</style>'.length);
    const html = cut === -1 ? rest : rest.slice(0, cut);
    const js = cut === -1 ? '' : rest.slice(cut);
    return {
      css: css ? css + '\n' : '',
      html: html.replace(/^\n+/, '').replace(/\n+$/, '\n'),
      js: js.replace(/^\n+/, '')
    };
  }

  CT.bundle = { join, split };
})(globalThis);
