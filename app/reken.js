(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports)
    module.exports = factory(require('./uren.js'), require('./belasting2026.js'));
  else { root.Salaris = root.Salaris || {}; root.Salaris.reken = factory(root.Salaris.uren, root.Salaris.belasting2026); }
})(typeof self !== 'undefined' ? self : this, function (uren, belasting) {
  const r2 = n => Math.round(n * 100) / 100;

  // Werknemerspremies (2026-model, geijkt op de payslip van juni 2026).
  // De pensioenfranchise schaalt naar rato van de betaalde uren (i.p.v. een vaste
  // maandfranchise) — nodig omdat het uurtal per maand wisselt bij een oproepkracht:
  // €2265,48 bruto over 126u → franchisegrondslag €1018,53 → pensioengrondslag
  // €1246,95 → pensioen €118,21, exact zoals op de strook.
  const PREMIE = { pensioenPct: 0.0948, pensioenFranchisePerUur: 1018.53 / 126, paww: 0.001, wga: 0.0064 };

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

  function rekenTotalen({ tabelLoon, btLoon, pensioengevend, pensioengevendUren, reiskostenTot }, inst) {
    const franchise = PREMIE.pensioenFranchisePerUur * (pensioengevendUren || 0);
    const pensioen = r2(Math.max(0, pensioengevend - franchise) * PREMIE.pensioenPct);
    const svBase = tabelLoon + btLoon;
    const paww = r2(svBase * PREMIE.paww);
    const svLoon = svBase - pensioen - paww; // grondslag voor de werknemersverzekering (WGA)
    const wga = r2(svLoon * PREMIE.wga);
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
    // Correctie-uren: niet aan een dag gekoppeld (bijv. een nabetaling van een vorige maand).
    // Belast als gewoon extra tabelloon, tegen het normale tabeltarief — geen bijzonder tarief.
    const extraUren = opties.extraUren || 0;
    const extraLoon = r2(extraUren * inst.uurloon);
    const tabelLoon = Math.max(0, per.reduce((s, d) => s + d.brutoBelastbaar, 0) + extraLoon);
    const btDagen = per.reduce((s, d) => s + d.btLoon, 0);
    const btLoon = btDagen + (opties.vakantiegeld || 0);
    const pensioengevend = Math.max(0, per.reduce((s, d) => s + d.basisloon + d.toeslag, 0) + extraLoon);
    const pensioengevendUren = Math.max(0, per.reduce((s, d) => s + d.betaaldeUren, 0) + extraUren);
    const reiskostenTot = per.reduce((s, d) => s + d.reiskosten, 0);
    const tot = rekenTotalen({ tabelLoon, btLoon, pensioengevend, pensioengevendUren, reiskostenTot }, inst);
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
