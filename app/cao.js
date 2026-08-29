(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else { root.Salaris = root.Salaris || {}; root.Salaris.cao = factory(); }
})(typeof self !== 'undefined' ? self : this, function () {
  // CAO Apotheken - salarisschalen per 1 juli 2026 (KNMP, "Salarisschalen met ingang van
  // 1 juli 2026 n.a.v. stijging WML"). Maandsalaris bij een volledige werkweek van 36 uur;
  // het uurloon is maandsalaris ÷ 156 (36 × 52 ÷ 12). Treden lopen zoals in de CAO van 0 t/m 9;
  // een lege plek betekent dat die trede in die schaal niet bestaat. 'WML' = wettelijk
  // minimumloon (de CAO-schaal ligt daar onder, dus geldt het wettelijke bedrag).
  const PEILDATUM = '2026-07-01';
  const UREN_PER_MAAND = 156;
  const WML = { maand: 2345.94, uur: 14.99 };
  const W = 'WML';
  const SCHALEN = [
    { nr: 1, naam: 'Schaal 1', treden: [W, W, W, W, W, 2378.04, 2440.80, 2505.25, null, null] },
    { nr: 2, naam: 'Schoonmaker', treden: [W, W, W, 2392.70, 2455.88, 2520.70, 2587.26, 2655.55, null, null] },
    { nr: 3, naam: 'Algemeen ondersteunend medewerker, bezorger, BBL', treden: [W, 2346.60, 2422.65, 2501.15, 2582.16, 2665.86, 2752.21, 2841.39, null, null] },
    { nr: 4, naam: 'Drogisterijmedewerker', treden: [2349.45, 2439.21, 2532.41, 2629.12, 2729.58, 2833.84, 2942.10, 3054.48, null, null] },
    { nr: 5, naam: 'Administratief secretarieel medewerker', treden: [2454.76, 2537.96, 2624.01, 2712.98, 2804.93, 2900.03, 2998.32, 3100.00, 3205.06, 3313.73] },
    { nr: 6, naam: 'Apothekersassistent / financieel-administratief medewerker', treden: [2694.06, 2794.54, 2898.80, 3006.89, 3119.06, 3235.41, 3356.09, 3481.27, 3611.12, 3745.83] },
    { nr: 7, naam: 'Apothekersassistent (variant)', treden: [2888.79, 2998.85, 3113.12, 3231.75, 3354.86, 3482.67, 3615.35, 3753.10, 3896.09, 4044.55] },
    { nr: 8, naam: 'Teamleider / farmaceutisch consulent', treden: [3235.45, 3358.75, 3486.69, 3619.53, 3757.46, 3900.59, 4049.20, 4203.48, 4363.63, 4529.90] },
    { nr: 9, naam: 'Farmaceutisch manager', treden: [3656.06, 3795.36, 3939.95, 4090.07, 4245.90, 4407.67, 4575.61, 4749.94, 4930.91, 5120.14] },
  ];
  const r2 = n => Math.round(n * 100) / 100;

  function schaal(nr) { return SCHALEN.find(s => s.nr === nr) || null; }
  // Geldige tredenummers van een schaal (de CAO laat hogere treden bij lage schalen leeg).
  function treden(nr) {
    const s = schaal(nr);
    return s ? s.treden.map((m, i) => (m == null ? null : i)).filter(i => i != null) : [];
  }
  function maandsalaris(nr, trede) {
    const s = schaal(nr);
    const m = s ? s.treden[trede] : null;
    if (m == null) return null;
    return m === W ? WML.maand : m;
  }
  function uurloon(nr, trede) {
    const s = schaal(nr);
    const m = s ? s.treden[trede] : null;
    if (m == null) return null;
    return m === W ? WML.uur : r2(m / UREN_PER_MAAND);
  }
  function bestaat(nr, trede) { return uurloon(nr, trede) != null; }

  return { PEILDATUM, UREN_PER_MAAND, WML, SCHALEN, schaal, treden, maandsalaris, uurloon, bestaat };
});
