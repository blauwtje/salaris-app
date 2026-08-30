(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory(require('./uren.js'), require('./util.js'));
  else { root.Salaris = root.Salaris || {}; root.Salaris.state = factory(root.Salaris.uren, root.Salaris.util); }
})(typeof self !== 'undefined' ? self : this, function (uren, util) {
  function betaaldVan(data) {
    if (data && data.soort === 'vakantie') return Math.max(0, Number(data.uren) || 0);
    let klok = uren.klokuren(data.van, data.tot);
    const heeftExtraDiensten = data.extra && data.extra.length > 0;
    if (heeftExtraDiensten) data.extra.forEach(e => { klok += uren.klokuren(e.van, e.tot); });
    return heeftExtraDiensten ? klok : uren.betaaldeUren(klok);
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
  // Aaneengesloten werkdagen tot en met vandaag, met opzet mild gehouden: dit moet leuk zijn,
  // geen straf. Weekenden en feestdagen zonder uren tellen niet mee als gemist, één losse
  // doordeweekse dag wordt je vergeven, en pas bij twee gemiste doordeweekse dagen achter
  // elkaar begint de reeks opnieuw. Vandaag telt alleen mee als er al uren staan: om 9 uur
  // 's ochtends is je reeks nog niet verbroken.
  const COULANCE = 2; // gemiste doordeweekse dagen op rij voordat de reeks breekt
  function werkReeks(dagen, vandaagIso) {
    const d = new Date(vandaagIso + 'T00:00:00');
    let reeks = 0, gemist = 0;
    for (let i = 0; i < 400; i++) {
      const iso = util.isoDate(d);
      const weekend = d.getDay() === 0 || d.getDay() === 6;
      if (dagen[iso]) { reeks++; gemist = 0; }
      else if (!weekend && i > 0 && ++gemist >= COULANCE) break;
      d.setDate(d.getDate() - 1);
    }
    return reeks;
  }
  return { betaaldVan, urenInWeek, volgendeWerkdag, werkReeks };
});
