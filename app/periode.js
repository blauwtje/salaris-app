(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else { root.Salaris = root.Salaris || {}; root.Salaris.periode = factory(); }
})(typeof self !== 'undefined' ? self : this, function () {
  // Loonperiode: 20e vorige maand t/m 19e. Op de 20e wordt de urenkaart ingediend en op de
  // 25e van diezelfde maand betaald. Dagen vanaf de 20e horen dus al bij de periode van de
  // volgende maand. Een periode heet naar de maand waarin 'ie wordt uitbetaald ("september"
  // = 20 augustus t/m 19 september). Correcties en de loonstrook gebruiken dezelfde sleutel.
  const EINDDAG = 19;    // laatste dag van de periode
  const INDIENDAG = 20;  // urenkaart indienen (= eerste dag van de volgende periode)
  const BETAALDAG = 25;
  const pad2 = n => String(n).padStart(2, '0');
  const sleutel = (jaar, maand) => `${jaar}-${pad2(maand)}`;

  function vorige(jaar, maand) { return maand === 1 ? { jaar: jaar - 1, maand: 12 } : { jaar, maand: maand - 1 }; }
  function volgende(jaar, maand) { return maand === 12 ? { jaar: jaar + 1, maand: 1 } : { jaar, maand: maand + 1 }; }

  function periodeVoorDatum(iso) {
    const [jaar, maand, dag] = iso.split('-').map(Number);
    return dag > EINDDAG ? volgende(jaar, maand) : { jaar, maand };
  }
  function sleutelVoorDatum(iso) {
    const p = periodeVoorDatum(iso);
    return sleutel(p.jaar, p.maand);
  }
  function grenzen(jaar, maand) {
    const v = vorige(jaar, maand);
    return {
      start: `${sleutel(v.jaar, v.maand)}-${pad2(EINDDAG + 1)}`,
      eind: `${sleutel(jaar, maand)}-${pad2(EINDDAG)}`,
      betaaldag: `${sleutel(jaar, maand)}-${pad2(BETAALDAG)}`,
    };
  }
  // Eerstvolgende keer (vandaag meegerekend) dat een vaste dag van de maand valt.
  function eerstvolgende(vandaagIso, dagVanMaand) {
    const [jaar, maand, dag] = vandaagIso.split('-').map(Number);
    const m = dag > dagVanMaand ? volgende(jaar, maand) : { jaar, maand };
    return `${sleutel(m.jaar, m.maand)}-${pad2(dagVanMaand)}`;
  }

  return { EINDDAG, INDIENDAG, BETAALDAG, sleutel, vorige, volgende, periodeVoorDatum, sleutelVoorDatum, grenzen, eerstvolgende };
});
