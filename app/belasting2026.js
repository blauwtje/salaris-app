(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else { root.Salaris = root.Salaris || {}; root.Salaris.belasting2026 = factory(); }
})(typeof self !== 'undefined' ? self : this, function () {
  // === Officiële 2026-cijfers (Belastingdienst / Belastingplan 2026) ===
  // Box 1, onder AOW-leeftijd (incl. premies volksverzekeringen).
  const TAX_2026 = {
    bijzonderTariefPct: 0.2743, // strook: 35,75% − 8,32% arbeidskortingsafbouw bij jaarloon BT €11.358
    schijven: [
      { tot: 38883, pct: 0.3575 },
      { tot: 78426, pct: 0.3756 },
      { tot: Infinity, pct: 0.4950 },
    ],
    ahk: { max: 3115, afbouwStart: 29736, afbouwPct: 0.06398 }, // nul rond €78.426
    // Arbeidskorting 2026 — knikpunten (ondergrens van elk segment):
    arbeidskorting: [
      { van: 0, basis: 0, pct: 0.08053 },
      { van: 11491, basis: 926, pct: 0.29861 },
      { van: 24820, basis: 4908, pct: 0.03085 },
      { van: 39958, basis: 5374, pct: -0.0651 },
      { van: 124934, basis: 0, pct: 0 },
    ],
  };

  function box1(jaarloon) {
    let belasting = 0, vorige = 0;
    for (const s of TAX_2026.schijven) {
      const deel = Math.min(jaarloon, s.tot) - vorige;
      if (deel > 0) belasting += deel * s.pct;
      vorige = s.tot;
      if (jaarloon <= s.tot) break;
    }
    return belasting;
  }
  function ahk(jaarloon) {
    const a = TAX_2026.ahk;
    if (jaarloon <= a.afbouwStart) return a.max;
    return Math.max(0, a.max - (jaarloon - a.afbouwStart) * a.afbouwPct);
  }
  function arbeidskorting(jaarloon) {
    let p = TAX_2026.arbeidskorting[0];
    for (const seg of TAX_2026.arbeidskorting) { if (jaarloon >= seg.van) p = seg; }
    return Math.max(0, p.basis + p.pct * (jaarloon - p.van));
  }
  function tabelLoonheffingMaand(maandloon, korting) {
    const jaarloon = Math.max(0, maandloon) * 12;
    let jaarheffing = box1(jaarloon);
    if (korting) jaarheffing -= (ahk(jaarloon) + arbeidskorting(jaarloon));
    return Math.max(0, jaarheffing) / 12;
  }
  function bijzonderTarief(btLoon) { return btLoon * TAX_2026.bijzonderTariefPct; }

  return { tabelLoonheffingMaand, bijzonderTarief, TAX_2026, _intern: { box1, ahk, arbeidskorting } };
});
