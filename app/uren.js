(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory(require('./util.js'));
  else { root.Salaris = root.Salaris || {}; root.Salaris.uren = factory(root.Salaris.util); }
})(typeof self !== 'undefined' ? self : this, function (util) {
  function klokuren(van, tot) { return (util.parseTime(tot) - util.parseTime(van)) / 60; }
  function betaaldeUren(klok) { return klok <= 5.5 ? klok : klok - 0.5; }
  function voortgang(van, tot, nuMin) {
    const a = util.parseTime(van), b = util.parseTime(tot);
    if (nuMin < a) return { status: 'voor', pct: 0, resterendeMin: b - a };
    if (nuMin >= b) return { status: 'klaar', pct: 100, resterendeMin: 0 };
    return { status: 'bezig', pct: ((nuMin - a) / (b - a)) * 100, resterendeMin: b - nuMin };
  }
  function intervalMoetVerversen(vorige, status) {
    return status === 'bezig' || status !== vorige;
  }
  return { klokuren, betaaldeUren, voortgang, intervalMoetVerversen };
});
