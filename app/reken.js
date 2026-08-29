(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports)
    module.exports = factory(require('./uren.js'), require('./belasting2026.js'));
  else { root.Salaris = root.Salaris || {}; root.Salaris.reken = factory(root.Salaris.uren, root.Salaris.belasting2026); }
})(typeof self !== 'undefined' ? self : this, function (uren, belasting) {
  const r2 = n => Math.round(n * 100) / 100;

  // Werknemerspremies (2026-model, geijkt op de payslip van juni 2026).
  // De pensioenfranchise schaalt naar rato van de betaalde uren (i.p.v. een vaste
  // maandfranchise) - nodig omdat het uurtal per maand wisselt bij een oproepkracht:
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

  // Een dag bestaat uit één of meer blokken: blok 1 staat plat op de dag (van/tot/locatie), de
  // rest in `extra`. Een extra blok zonder eigen locatie erft die van de dag, zodat dagen van
  // vóór de gemengde dag (deels kantoor, deels thuis) exact hetzelfde blijven rekenen.
  function blokken(dag) {
    const rest = (dag.extra || []).map(e => ({ van: e.van, tot: e.tot, locatie: e.locatie || dag.locatie }));
    return [{ van: dag.van, tot: dag.tot, locatie: dag.locatie }].concat(rest);
  }
  // Reiskosten zijn een vergoeding voor de rit, niet voor de uren: één keer per dag, zodra je
  // die dag ook maar één blok op kantoor werkte. Een dag 9–12 kantoor + 16–18 thuis telt dus mee.
  const opKantoor = dag => blokken(dag).some(b => b.locatie === 'kantoor');
  const gemengd = dag => { const b = blokken(dag); return b.some(x => x.locatie === 'kantoor') && b.some(x => x.locatie !== 'kantoor'); };
  // Klokuren per locatie - voor weergave ("5,0u kantoor · 2,0u thuis"), niet voor de berekening.
  function urenPerLocatie(dag) {
    const out = { kantoor: 0, thuis: 0 };
    blokken(dag).forEach(b => { out[b.locatie === 'kantoor' ? 'kantoor' : 'thuis'] += uren.klokuren(b.van, b.tot); });
    return out;
  }

  function dagBruto(dag, inst) {
    const bl = blokken(dag);
    const klok = bl.reduce((s, b) => s + uren.klokuren(b.van, b.tot), 0);
    const betaald = bl.length > 1 ? klok : uren.betaaldeUren(klok);
    const basisloon = betaald * inst.uurloon;
    const toeslag = betaald * inst.uurloon * toeslagFractie(dag, inst);
    const reiskosten = opKantoor(dag) ? inst.reiskostenPerKantoordag : 0;
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
    // Belast als gewoon extra tabelloon, tegen het normale tabeltarief - geen bijzonder tarief.
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

  // Ronde bedragen die het vieren waard zijn. Geeft de hoogste drempel die je met deze wijziging
  // passeert, of null. Alleen omhoog: een correctie naar beneden viert niets.
  const MIJLPALEN = [250, 500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 5000];
  function mijlpaal(oud, nieuw) {
    const gehaald = MIJLPALEN.filter(m => oud < m && nieuw >= m);
    return gehaald.length ? gehaald[gehaald.length - 1] : null;
  }
  // De eerstvolgende drempel boven een bedrag - zodat je altijd ziet waar je naartoe werkt,
  // niet alleen als je er overheen gaat.
  const volgendeMijlpaal = bedrag => MIJLPALEN.find(m => m > bedrag) || null;

  return { dagBruto, rekenTotalen, maandReken, toeslagFractie, blokken, opKantoor, gemengd, urenPerLocatie, mijlpaal, volgendeMijlpaal, MIJLPALEN, PREMIE, ZONDAG_TOESLAG };
});
