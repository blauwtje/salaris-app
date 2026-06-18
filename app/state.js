(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory(require('./uren.js'));
  else { root.Salaris = root.Salaris || {}; root.Salaris.state = factory(root.Salaris.uren); }
})(typeof self !== 'undefined' ? self : this, function (uren) {
  function betaaldVan(data) {
    let klok = uren.klokuren(data.van, data.tot);
    const heeftExtraDiensten = data.extra && data.extra.length > 0;
    if (heeftExtraDiensten) data.extra.forEach(e => { klok += uren.klokuren(e.van, e.tot); });
    return heeftExtraDiensten ? klok : uren.betaaldeUren(klok);
  }
  function urenInMaand(dagen, jaar, maand) {
    const pre = `${jaar}-${String(maand).padStart(2, '0')}`;
    return Object.entries(dagen).filter(([iso]) => iso.startsWith(pre))
      .reduce((s, [, d]) => s + betaaldVan(d), 0);
  }
  function urenInWeek(dagen, isoVanMaandag) {
    const start = new Date(isoVanMaandag + 'T00:00:00');
    let som = 0;
    for (const [iso, d] of Object.entries(dagen)) {
      const diff = (new Date(iso + 'T00:00:00') - start) / 86400000;
      if (diff >= 0 && diff < 7) som += betaaldVan(d);
    }
    return som;
  }
  function volgendeWerkdag(dagen, vandaagIso) {
    const toekomst = Object.keys(dagen).filter(iso => iso > vandaagIso).sort();
    return toekomst.length ? toekomst[0] : null;
  }
  return { urenInMaand, urenInWeek, volgendeWerkdag };
});
