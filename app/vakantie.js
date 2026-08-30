(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports)
    module.exports = factory(require('./util.js'), require('./feestdagen.js'), require('./state.js'));
  else { root.Salaris = root.Salaris || {}; root.Salaris.vakantie = factory(root.Salaris.util, root.Salaris.feestdagen, root.Salaris.state); }
})(typeof self !== 'undefined' ? self : this, function (util, feestdagen, state) {
  // Betaalde vakantie bij een nulurencontract: er staat geen vast aantal uren per week in het
  // contract, dus leidt de app het aantal betaalde uren af uit wat je zélf op die weekdag werkte.
  // Maatstaf is de referteperiode van dertien weken die payroll ook gebruikt: het gemiddelde van
  // dezelfde weekdag in de dertien weken vóór de vakantiedag. Weken waarin helemaal niets stond
  // (vorige vakantie, ziek) tellen niet mee - die zouden het gemiddelde ten onrechte drukken.
  const WEKEN = 13;
  const MAX_DAGEN = 120; // een vakantie beslaat nooit meer dan een paar maanden; harde grens tegen doorlopen
  const datum = iso => new Date(iso + 'T00:00:00');
  const isWeekend = d => d.getDay() === 0 || d.getDay() === 6;
  const r1 = n => Math.round(n * 10) / 10;

  function urenOpDag(dagen, iso) { const d = dagen[iso]; return d ? state.betaaldVan(d) : 0; }
  // Verste dag waar uren staan. Alles daarna is nog niet ingevuld, niet "niet gewerkt": een
  // vakantie die je vooruit plant mag niet gedrukt worden door weken die nog leeg zijn.
  function laatsteGevuld(dagen) {
    let laatste = '';
    for (const iso of Object.keys(dagen)) if (iso > laatste && urenOpDag(dagen, iso) > 0) laatste = iso;
    return laatste;
  }
  // Maandag van de week waarin `d` valt (de week loopt maandag t/m zondag).
  function maandagVan(d) { const x = new Date(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; }
  function weekHeeftUren(dagen, d) {
    const ma = maandagVan(d);
    for (let i = 0; i < 7; i++) {
      const x = new Date(ma); x.setDate(ma.getDate() + i);
      if (urenOpDag(dagen, util.isoDate(x)) > 0) return true;
    }
    return false;
  }

  // Gemiddeld betaalde uren op dezelfde weekdag als `iso`, over de weken ervóór. Geeft 0 als er
  // nog geen enkele bruikbare week is; de aanroeper moet dat zelf uitleggen.
  function gemiddeldeUren(dagen, iso, weken) {
    const n = weken || WEKEN;
    const d0 = datum(iso);
    const grens = laatsteGevuld(dagen);
    let som = 0, gebruikt = 0;
    for (let w = 1; w <= n; w++) {
      const d = new Date(d0); d.setDate(d0.getDate() - 7 * w);
      const wIso = util.isoDate(d);
      if (feestdagen.isFeestdag(wIso)) continue;
      if (wIso > grens) continue;
      if (!weekHeeftUren(dagen, d)) continue;
      som += urenOpDag(dagen, wIso);
      gebruikt++;
    }
    return { uren: gebruikt ? r1(som / gebruikt) : 0, weken: gebruikt };
  }

  // Wat een vakantie van `vanIso` t/m `totIso` oplevert. Weekenden tellen niet mee (je schrijft
  // alleen werkdagen op), feestdagen ook niet (die zijn al vrij) en dagen waar al uren staan
  // blijven staan - overschrijven zou stilletjes werk wissen.
  function voorstel(dagen, vanIso, totIso, weken) {
    const regels = [], overgeslagen = [];
    if (!vanIso || !totIso || totIso < vanIso) return { regels, overgeslagen, totaalUren: 0, aantal: 0, zonderHistorie: false };
    const eind = datum(totIso);
    const d = datum(vanIso);
    for (let i = 0; i < MAX_DAGEN && d <= eind; i++) {
      const iso = util.isoDate(d);
      if (isWeekend(d)) overgeslagen.push({ iso, reden: 'weekend' });
      else if (feestdagen.isFeestdag(iso)) overgeslagen.push({ iso, reden: 'feestdag' });
      else if (dagen[iso]) overgeslagen.push({ iso, reden: dagen[iso].soort === 'vakantie' ? 'vakantie' : 'bestaat' });
      else regels.push({ iso, ...gemiddeldeUren(dagen, iso, weken) });
      d.setDate(d.getDate() + 1);
    }
    const totaalUren = r1(regels.reduce((s, r) => s + r.uren, 0));
    return { regels, overgeslagen, totaalUren, aantal: regels.length, zonderHistorie: regels.length > 0 && regels.every(r => r.weken === 0) };
  }

  // Alle vakantiedagen die aan `iso` vastzitten, zodat je een hele vakantie in één keer weghaalt.
  // Een weekend of feestdag zonder uren onderbreekt de reeks niet: een week vrij loopt van
  // maandag t/m vrijdag door het weekend heen.
  function reeks(dagen, iso) {
    if (!dagen[iso] || dagen[iso].soort !== 'vakantie') return [];
    const gevonden = [iso];
    [-1, 1].forEach(richting => {
      const d = datum(iso);
      for (let i = 0; i < MAX_DAGEN; i++) {
        d.setDate(d.getDate() + richting);
        const k = util.isoDate(d);
        const dag = dagen[k];
        if (dag && dag.soort === 'vakantie') { gevonden.push(k); continue; }
        if (!dag && (isWeekend(d) || feestdagen.isFeestdag(k))) continue;
        break;
      }
    });
    return gevonden.sort();
  }

  return { WEKEN, gemiddeldeUren, voorstel, reeks };
});
