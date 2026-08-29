(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else { root.Salaris = root.Salaris || {}; root.Salaris.belasting2026 = factory(); }
})(typeof self !== 'undefined' ? self : this, function () {
  // === Officiële 2026-cijfers (Belastingdienst, "Rekenvoorschriften voor de
  // geautomatiseerde loonadministratie 2026"). Box 1, onder AOW-leeftijd
  // (incl. premies volksverzekeringen). Deze module volgt het exacte
  // tabel-algoritme (§2.1–2.2.4) inclusief de voorgeschreven afrondingen, zodat
  // de uitkomst overeenkomt met de witte maandtabel - geverifieerd tegen de
  // officiële tabel (o.a. loon €2.142 → loonheffing €68,08 / arbeidskorting
  // €438,08) en tegen de payslip van juni 2026 (€2.145 belastbaar → €68,08).
  const TAX_2026 = {
    bijzonderTariefPct: 0.2743, // strook: 35,75% − 8,32% arbeidskortingsafbouw bij jaarloon BT €11.358
    // Schijventarief (Tabel 2): a = ondergrens, b = percentage, c = cumulatieve heffing t/m vorige schijf.
    schijven: [
      { tot: 38883, a: 0, b: 35.75, c: 0 },
      { tot: 78426, a: 38883, b: 37.56, c: 13900 },
      { tot: Infinity, a: 78426, b: 49.50, c: 28752 },
    ],
    // Algemene heffingskorting (Tabel 3).
    ahk: { max: 3115, afbouwStart: 29736, afbouwEind: 78426, afbouwPct: 0.06398 },
    // Arbeidskorting (Tabel 6) - officiële 2026-knikpunten en opbouw-/afbouwfactoren.
    ark: {
      arko1: 0.08324, arko2: 0.31009, arko3: 0.01950, arka1: 0.06510,
      arkg1: 11965, arkg2: 25845, arkg3: 45592, arkg4: 132920,
      arkm1: 996, arkm2: 5300, arkm3: 5685,
    },
  };

  const EPS = 1e-9;
  const rondBenedenEuro = n => Math.floor(n + EPS);
  const rondBovenEuro = n => Math.ceil(n - EPS);
  const rond5 = n => Math.round(n * 1e5) / 1e5;

  function schijfVoor(jaarloon) {
    return TAX_2026.schijven.find(s => jaarloon <= s.tot) || TAX_2026.schijven[TAX_2026.schijven.length - 1];
  }
  // X1: loonbelasting/premie volksverzekeringen over het jaarloon, zonder heffingskortingen.
  function box1(jaarloon) {
    const s = schijfVoor(jaarloon);
    const bedrag = (jaarloon - s.a) * s.b / 100 + s.c;
    return Math.max(0, rondBenedenEuro(bedrag));
  }
  // AHK: algemene heffingskorting, jaarbedrag naar boven afgerond op hele euro's.
  function ahk(jaarloon) {
    const a = TAX_2026.ahk;
    if (jaarloon <= a.afbouwStart) return a.max;
    if (jaarloon > a.afbouwEind) return 0;
    return Math.max(0, rondBovenEuro(a.max - (jaarloon - a.afbouwStart) * a.afbouwPct));
  }
  // ARK: arbeidskorting, opbouw in 3 stappen (elk gemaximeerd) min afbouw, naar boven afgerond.
  function arbeidskorting(jaarloon) {
    const k = TAX_2026.ark;
    if (jaarloon > k.arkg4) return 0;
    const stap1 = Math.min(rond5(k.arko1 * jaarloon), k.arkm1);
    const stap2 = Math.min(stap1 + rond5(k.arko2 * Math.max(0, jaarloon - k.arkg1)), k.arkm2);
    const stap3 = Math.min(stap2 + rond5(k.arko3 * Math.max(0, jaarloon - k.arkg2)), k.arkm3);
    const afbouw = rond5(k.arka1 * Math.max(0, jaarloon - k.arkg3));
    return Math.max(0, rondBovenEuro(stap3 - afbouw));
  }
  function tabelLoonheffingMaand(maandloon, korting) {
    const F = 12; // tijdvakfactor maandloon (Tabel 1b)
    const Lv = 54; // loonstap op jaarbasis (Tabel 1a)
    const jaarloon = Math.max(0, maandloon) * F;
    // Stap 2: jaarloon naar beneden afronden op een veelvoud van Lv (geldt tot Lmax ≈ €133.110,
    // ruim boven het bereik van deze app; de Lmax-uitzondering is daarom niet geïmplementeerd).
    const L = Math.floor(jaarloon / Lv + EPS) * Lv;
    const X1 = box1(L);
    const X = korting ? Math.max(0, rondBenedenEuro(X1 - (ahk(L) + arbeidskorting(L)))) : X1;
    return X / F;
  }
  function bijzonderTarief(btLoon) { return btLoon * TAX_2026.bijzonderTariefPct; }

  return { tabelLoonheffingMaand, bijzonderTarief, TAX_2026, _intern: { box1, ahk, arbeidskorting } };
});
