(function (g) {
  const tests = [];
  g.test = (name, fn) => tests.push({ name, fn });
  g.assert = (cond, msg) => {
    if (!cond) throw new Error(msg || 'oczekiwano wartości prawdziwej');
  };
  g.assertEqual = (actual, expected, msg) => {
    const a = JSON.stringify(actual);
    const e = JSON.stringify(expected);
    if (a !== e) throw new Error((msg || 'różnica') + '\n  oczekiwano: ' + e + '\n  otrzymano:  ' + a);
  };
  g.assertIncludes = (haystack, needle, msg) => {
    if (!String(haystack).includes(needle)) throw new Error((msg || 'brak fragmentu') + ': ' + needle);
  };
  g.assertNotIncludes = (haystack, needle, msg) => {
    if (String(haystack).includes(needle)) throw new Error((msg || 'niechciany fragment') + ': ' + needle);
  };
  g.runTests = () => {
    const out = document.getElementById('results');
    let passed = 0;
    const failures = [];
    for (const t of tests) {
      try {
        t.fn();
        passed++;
        out.insertAdjacentHTML('beforeend', '<li class="ok">' + t.name + '</li>');
      } catch (err) {
        failures.push(t.name);
        out.insertAdjacentHTML(
          'beforeend',
          '<li class="fail">' + t.name + '<pre>' + String(err.message).replace(/</g, '&lt;') + '</pre></li>'
        );
      }
    }
    document.getElementById('summary').textContent =
      passed + ' / ' + tests.length + ' przeszło' + (failures.length ? ' — błędy: ' + failures.join(', ') : '');
    document.getElementById('summary').className = failures.length ? 'fail' : 'ok';
  };
})(globalThis);
