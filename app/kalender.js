(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports)
    module.exports = factory(require('./util.js'), require('./feestdagen.js'), require('./reken.js'));
  else { root.Salaris = root.Salaris || {}; root.Salaris.kalender = factory(root.Salaris.util, root.Salaris.feestdagen, root.Salaris.reken); }
})(typeof self !== 'undefined' ? self : this, function (util, feestdagen, reken) {
  function maandModel(jaar, maand /* 1-12 */, dagen, inst, vandaagIso) {
    const eerste = new Date(jaar, maand - 1, 1);
    const startOffset = (eerste.getDay() + 6) % 7; // maandag = 0
    const beginDatum = new Date(jaar, maand - 1, 1 - startOffset);
    const dagenInMaand = new Date(jaar, maand, 0).getDate();
    const totaal = Math.ceil((startOffset + dagenInMaand) / 7) * 7;
    const fdag = feestdagen.feestdagenVoorJaar(jaar);
    const buren = new Map([
      ...feestdagen.feestdagenVoorJaar(jaar - 1),
      ...feestdagen.feestdagenVoorJaar(jaar + 1),
    ]);
    const cellen = [];
    for (let i = 0; i < totaal; i++) {
      const d = new Date(beginDatum);
      d.setDate(beginDatum.getDate() + i);
      const iso = util.isoDate(d);
      const uitMaand = d.getMonth() !== maand - 1;
      const feest = fdag.get(iso) || buren.get(iso) || null;
      const cel = {
        iso, dagNummer: d.getDate(), uitMaand,
        zondag: d.getDay() === 0,
        feestdag: feest, geblokkeerd: !!feest,
        vandaag: iso === vandaagIso,
        hrDeadline: !uitMaand && d.getDate() === 19,
        salarisdag: !uitMaand && d.getDate() === 25,
        betaaldeUren: 0, bruto: 0, netto: 0,
        toeslag: reken.toeslagFractie({ datum: iso, zondagToeslag: (dagen[iso] && dagen[iso].zondagToeslag != null) ? dagen[iso].zondagToeslag : undefined }, inst),
      };
      const data = dagen[iso];
      if (data && !cel.geblokkeerd) {
        const b = reken.dagBruto({ ...data, datum: iso }, inst);
        cel.betaaldeUren = b.betaaldeUren;
        cel.bruto = b.brutoBelastbaar + b.btLoon + b.reiskosten;
        cel.netto = cel.bruto; // ruwe indicatie; exact per-dag netto komt uit reken.maandReken in de UI
      }
      cellen.push(cel);
    }
    return cellen;
  }
  return { maandModel };
});
