(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports)
    module.exports = factory(require('./uren.js'), require('./belasting2026.js'));
  else { root.Salaris = root.Salaris || {}; root.Salaris.reken = factory(root.Salaris.uren, root.Salaris.belasting2026); }
})(typeof self !== 'undefined' ? self : this, function (uren, belasting) {
  const r2 = n => Math.round(n * 100) / 100;

  // Werknemerspremies (correct 2026-model). Franchise zo gekozen dat pensioen op de
  // referentie-strook ≈ €32,98 uitkomt; premies/BT/reiskosten zijn exact, loonheffing
  // via de officiële 2026-cijfers. (De oorspronkelijke strooktekst was OCR-verminkt en
  // sloot niet op de cent; de gebruiker koos voor dit correcte model.)
  const PREMIE = { pensioenPct: 0.0948, pensioenFranchiseJaar: 17563, paww: 0.001, wga: 0.0064 };

  const ZONDAG_TOESLAG = 0.5;
  const isZondag = datum => new Date(datum + 'T00:00:00').getDay() === 0;
  function toeslagFractie(dag, inst) {
    if (!isZondag(dag.datum)) return 0;
    const aan = dag.zondagToeslag != null ? dag.zondagToeslag : !!(inst && inst.zondagToeslag);
    return aan ? ZONDAG_TOESLAG : 0;
  }

  function dagBruto(dag, inst) {
    let klok = uren.klokuren(dag.van, dag.tot);
    const heeftExtraDiensten = dag.extra && dag.extra.length > 0;
    if (heeftExtraDiensten) dag.extra.forEach(e => { klok += uren.klokuren(e.van, e.tot); });
    const betaald = heeftExtraDiensten ? klok : uren.betaaldeUren(klok);
    const basisloon = betaald * inst.uurloon;
    const toeslag = betaald * inst.uurloon * toeslagFractie(dag, inst);
    const reiskosten = dag.locatie === 'kantoor' ? inst.reiskostenPerKantoordag : 0;
    return { datum: dag.datum, klokuren: klok, betaaldeUren: betaald, basisloon, toeslag, reiskosten, brutoBelastbaar: basisloon, btLoon: toeslag };
  }

  function rekenTotalen({ tabelLoon, btLoon, pensioengevend, reiskostenTot }, inst) {
    const franchiseMaand = PREMIE.pensioenFranchiseJaar / 12;
    const pensioen = r2(Math.max(0, pensioengevend - franchiseMaand) * PREMIE.pensioenPct);
    const svBase = tabelLoon + btLoon;
    const paww = r2(svBase * PREMIE.paww);
    const wga = r2(svBase * PREMIE.wga);
    const tabelGrondslag = tabelLoon - pensioen - paww;
    const loonheffingTabel = r2(belasting.tabelLoonheffingMaand(tabelGrondslag, true));
    const loonheffingBT = r2(belasting.bijzonderTarief(btLoon));
    const nettoBelast = svBase - pensioen - paww - wga - loonheffingTabel - loonheffingBT;
    return {
      pensioen, paww, wga, loonheffingTabel, loonheffingBT,
      reiskostenTot: r2(reiskostenTot),
      brutoTot: r2(svBase + reiskostenTot),
      nettoBelast: r2(nettoBelast),
      nettoTot: r2(nettoBelast + reiskostenTot),
      vakantiegeldReservering: r2(svBase * 0.08),
    };
  }

  function maandReken(dagen, inst, opties = {}) {
    const per = dagen.map(d => dagBruto(d, inst));
    const tabelLoon = per.reduce((s, d) => s + d.brutoBelastbaar, 0);
    const btDagen = per.reduce((s, d) => s + d.btLoon, 0);
    const btLoon = btDagen + (opties.vakantiegeld || 0);
    const pensioengevend = per.reduce((s, d) => s + d.basisloon + d.toeslag, 0);
    const reiskostenTot = per.reduce((s, d) => s + d.reiskosten, 0);
    const tot = rekenTotalen({ tabelLoon, btLoon, pensioengevend, reiskostenTot }, inst);
    const denom = per.reduce((s, d) => s + d.brutoBelastbaar + d.btLoon, 0) || 1;
    per.forEach(d => {
      const aandeel = (d.brutoBelastbaar + d.btLoon) / denom;
      d.netto = r2(tot.nettoBelast * aandeel + d.reiskosten);
      d.bruto = r2(d.brutoBelastbaar + d.btLoon + d.reiskosten);
    });
    return { perDag: per, totalen: tot, vakantiegeldReservering: tot.vakantiegeldReservering };
  }

  return { dagBruto, rekenTotalen, maandReken, toeslagFractie, PREMIE, ZONDAG_TOESLAG };
});
