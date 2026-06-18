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
  function voortgangShifts(shifts, nuMin) {
    const p = shifts.map(s => ({ van: util.parseTime(s.van), tot: util.parseTime(s.tot), vanStr: s.van, totStr: s.tot }));
    const totaalMin = p.reduce((s, q) => s + (q.tot - q.van), 0);
    if (nuMin < p[0].van) return { status: 'voor', pct: 0, resterendeMin: totaalMin, eersteVan: p[0].vanStr };
    if (nuMin >= p[p.length - 1].tot) return { status: 'klaar', pct: 100, resterendeMin: 0 };
    let gedaan = 0;
    for (let i = 0; i < p.length; i++) {
      if (nuMin < p[i].van) {
        const rest = p.slice(i).reduce((s, q) => s + (q.tot - q.van), 0);
        return { status: 'pauze', pct: (gedaan / totaalMin) * 100, resterendeMin: rest, volgendeVan: p[i].vanStr };
      }
      if (nuMin < p[i].tot) {
        gedaan += nuMin - p[i].van;
        const rest = (p[i].tot - nuMin) + p.slice(i + 1).reduce((s, q) => s + (q.tot - q.van), 0);
        return { status: 'bezig', pct: (gedaan / totaalMin) * 100, resterendeMin: rest, huidigeTot: p[i].totStr };
      }
      gedaan += p[i].tot - p[i].van;
    }
    return { status: 'klaar', pct: 100, resterendeMin: 0 };
  }
  function intervalMoetVerversen(vorige, status) {
    return status === 'bezig' || status === 'pauze' || status !== vorige;
  }
  return { klokuren, betaaldeUren, voortgang, voortgangShifts, intervalMoetVerversen };
});
