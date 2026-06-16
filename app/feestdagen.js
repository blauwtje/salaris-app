(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else { root.Salaris = root.Salaris || {}; root.Salaris.feestdagen = factory(); }
})(typeof self !== 'undefined' ? self : this, function () {
  function iso(y, m, d) {
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  // Anonymous Gregorian algorithm (Meeus/Jones/Butcher)
  function pasen(j) {
    const a = j % 19, b = Math.floor(j / 100), c = j % 100, d = Math.floor(b / 4), e = b % 4,
      f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3),
      h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4,
      l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
      maand = Math.floor((h + l - 7 * m + 114) / 31), dag = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(j, maand - 1, dag);
  }
  function plus(date, n) { const d = new Date(date); d.setDate(d.getDate() + n); return d; }
  function isoVan(d) { return iso(d.getFullYear(), d.getMonth() + 1, d.getDate()); }

  function feestdagenVoorJaar(j) {
    const m = new Map();
    const p = pasen(j);
    m.set(iso(j, 1, 1), 'Nieuwjaarsdag');
    m.set(isoVan(plus(p, -2)), 'Goede Vrijdag');
    m.set(isoVan(p), 'Eerste Paasdag');
    m.set(isoVan(plus(p, 1)), 'Tweede Paasdag');
    const kon = new Date(j, 3, 27);
    m.set(isoVan(kon.getDay() === 0 ? new Date(j, 3, 26) : kon), 'Koningsdag');
    m.set(iso(j, 5, 5), 'Bevrijdingsdag');
    m.set(isoVan(plus(p, 39)), 'Hemelvaartsdag');
    m.set(isoVan(plus(p, 49)), 'Eerste Pinksterdag');
    m.set(isoVan(plus(p, 50)), 'Tweede Pinksterdag');
    m.set(iso(j, 12, 25), 'Eerste Kerstdag');
    m.set(iso(j, 12, 26), 'Tweede Kerstdag');
    return m;
  }
  function isFeestdag(isoStr) {
    const j = Number(isoStr.slice(0, 4));
    return feestdagenVoorJaar(j).has(isoStr);
  }
  return { feestdagenVoorJaar, isFeestdag };
});
