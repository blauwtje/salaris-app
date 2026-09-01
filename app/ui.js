(function (root, factory) {
  const deps = r => [r.util, r.uren, r.reken, r.state, r.kalender, r.feestdagen, r.thema, r.periode, r.cao, r.vakantie];
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else { root.Salaris = root.Salaris || {}; root.Salaris.ui = factory(...deps(root.Salaris)); }
})(typeof self !== 'undefined' ? self : this, function (util, uren, reken, state, kalender, feestdagen, thema, periode, cao, vakantie) {
  const S = typeof self !== 'undefined' ? self.Salaris : {};
  const U = util || S.util;
  const REK = reken || S.reken;
  const ST = state || S.state;
  const KAL = kalender || S.kalender;
  const UR = uren || S.uren;
  const FD = feestdagen || S.feestdagen;
  const TH = thema || S.thema;
  const PER = periode || S.periode;
  const CAO = cao || S.cao;
  const VAK = vakantie || S.vakantie;

  const MAAND = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
  const MAAND_KORT = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const ICON = {
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    week: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
    maand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 8v8M8 12h8"/><circle cx="12" cy="12" r="9"/></svg>',
    klok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    pijl: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    omhoog: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
    euro: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18 6.5A7 7 0 0 0 7.2 9.5a7 7 0 0 0 0 5A7 7 0 0 0 18 17.5"/><path d="M4 10.5h9M4 13.5h9"/></svg>',
    strook: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 3h12v18l-2.4-1.6L13.2 21l-2.4-1.6L8.4 21 6 19.4z"/><path d="M9.5 8h5M9.5 12h5M9.5 16h3"/></svg>',
    kantoor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 21h18M6 21V7l8-4v18M14 9h4v12"/></svg>',
    thuis: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 11l9-8 9 8M5 10v10h14V10"/></svg>',
    chevL: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M15 18l-6-6 6-6"/></svg>',
    chevR: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 18l6-6-6-6"/></svg>',
    kruis: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    vink: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"/></svg>',
    prul: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>',
    pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
    slot: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 3v12M8 11l4 4 4-4M5 21h14"/></svg>',
    up2: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 15V3M8 7l4-4 4 4M5 21h14"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 5v14M5 12h14"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6 19 19M19 5l-1.4 1.4M6.4 17.6 5 19"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/></svg>',
    oled: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none"/></svg>',
    laptop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M2 20h20"/></svg>',
    palette: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="13.5" cy="6.5" r="1.4" fill="currentColor" stroke="none"/><circle cx="17.5" cy="10.5" r="1.4" fill="currentColor" stroke="none"/><circle cx="8.5" cy="7.5" r="1.4" fill="currentColor" stroke="none"/><circle cx="6.5" cy="12.5" r="1.4" fill="currentColor" stroke="none"/><path d="M12 2C6.5 2 2 6 2 11c0 4 3 7 7 7 1 0 1.8-.8 1.8-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1 .8-1.8 1.8-1.8H14c3.3 0 6-2.7 6-6 0-3.9-3.6-6.2-8-6.2z"/></svg>',
    droplet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2.7 6.3 8.4a8 8 0 1 0 11.4 0z"/></svg>',
    reset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 7v6h6"/><path d="M3 13a9 9 0 1 0 3-7.7L3 8"/></svg>',
    persoon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>',
    wissel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M7 4 3 8l4 4"/><path d="M3 8h13a5 5 0 0 1 0 10h-1"/><path d="M17 20l4-4-4-4"/></svg>',
    kopie: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    schuif: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h10M18 18h2"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="16" cy="18" r="2"/></svg>',
    notitie: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 9h8M8 13h5"/></svg>',
    vlam: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>',
    trofee: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.7V17c0 .6-.5 1-1 1.2-1.2.6-2 2-2 3.8M14 14.7V17c0 .6.5 1 1 1.2 1.2.6 2 2 2 3.8M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>',
    vlag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V4s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7"/></svg>',
    zon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    grip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="9" cy="6" r="1.4"/><circle cx="15" cy="6" r="1.4"/><circle cx="9" cy="12" r="1.4"/><circle cx="15" cy="12" r="1.4"/><circle cx="9" cy="18" r="1.4"/><circle cx="15" cy="18" r="1.4"/></svg>',
    pijlOp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
    pijlNeer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>',
    min: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M5 12h14"/></svg>',
    vrij: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 3v2M5.2 7.8l1.4 1.4M18.8 7.8l-1.4 1.4M7 16a5 5 0 0 1 10 0"/><path d="M2 16h20M4 20h16"/></svg>',
    raster: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
  };
  const THEMA_ICON = { systeem: ICON.laptop, licht: ICON.sun, donker: ICON.moon, zwart: ICON.oled };

  const initialen = n => String(n || '').trim().charAt(0).toUpperCase();
  const eK = n => '€' + Math.round(n).toLocaleString('nl-NL');
  function resterend(min) { const h = Math.floor(min / 60), m = min % 60; return (h ? h + 'u ' : '') + m + 'm'; }
  function maandagVan(d) { const x = new Date(d); const off = (x.getDay() + 6) % 7; x.setDate(x.getDate() - off); return x; }
  const hoofdletter = s => s.charAt(0).toUpperCase() + s.slice(1);
  const maandNaam = (jaar, maand) => `${hoofdletter(MAAND[maand - 1])} ${jaar}`;
  // "19 aug – 18 sep · betaald op 25 sep" - de vaste omschrijving van een loonperiode.
  function kortDatum(iso) { const d = new Date(iso + 'T00:00:00'); return `${d.getDate()} ${MAAND_KORT[d.getMonth()]}`; }
  function periodeBereik(jaar, maand) { const g = PER.grenzen(jaar, maand); return `${kortDatum(g.start)} – ${kortDatum(g.eind)}`; }
  function periodeOmschrijving(jaar, maand) { const g = PER.grenzen(jaar, maand); return `${periodeBereik(jaar, maand)} · betaald op ${kortDatum(g.betaaldag)}`; }

  // Alle dagen die in de loonperiode (jaar, maand) worden uitbetaald: 19e vorige maand t/m 18e.
  function dagenInPeriode(state, jaar, maand) {
    const sleutel = PER.sleutel(jaar, maand);
    return Object.entries(state.dagen)
      .filter(([iso]) => PER.sleutelVoorDatum(iso) === sleutel && !FD.isFeestdag(iso))
      .map(([iso, d]) => ({ ...d, datum: iso }));
  }
  // Memo: één overzicht-render vraagt dezelfde periode ~9x op. Cache per jaar-maand-versie;
  // `versie` wordt door main.js bij elke bewaar() opgehoogd, dus mutaties invalideren vanzelf.
  let _renderVersie = 0;
  const _periodeCache = new Map();
  function periodeResultaat(state, jaar, maand) {
    const cacheSleutel = `${jaar}-${maand}-${_renderVersie}`;
    const cached = _periodeCache.get(cacheSleutel);
    if (cached) return cached;
    const correcties = (state.correcties && state.correcties[PER.sleutel(jaar, maand)]) || [];
    const extraUren = correcties.reduce((s, c) => s + (c.uren || 0), 0);
    const res = REK.maandReken(dagenInPeriode(state, jaar, maand), state.instellingen, { extraUren });
    const map = {}; res.perDag.forEach(d => { map[d.datum] = d; });
    const val = { res, map, correcties };
    if (_periodeCache.size > 24) _periodeCache.clear();
    _periodeCache.set(cacheSleutel, val);
    return val;
  }
  function dagResultaat(state, iso) {
    const p = PER.periodeVoorDatum(iso);
    return periodeResultaat(state, p.jaar, p.maand).map[iso] || null;
  }
  function bedragVoorDag(state, iso, weergave) {
    const d = dagResultaat(state, iso); if (!d) return 0;
    return weergave === 'bruto' ? d.bruto : d.netto;
  }

  function periodeTotalen(state, jaar, maand) {
    const { res } = periodeResultaat(state, jaar, maand);
    const t = res.totalen;
    return {
      res,
      svBase: t.brutoTot - t.reiskostenTot,
      inhoudingen: t.brutoTot - t.nettoTot,
      reiskosten: t.reiskostenTot,
      netto: t.nettoTot,
      brutoTot: t.brutoTot,
      vakantiegeld: t.vakantiegeldReservering,
    };
  }

  // ---------- WAAR JE WERKTE ----------
  // Eén vocabulaire voor kalender, loonstrook en dialoog: een getekend icoon plus het woord zelf,
  // zodat geen enkele weergave een legenda nodig heeft om gelezen te kunnen worden.
  const locatieSoort = d => REK.gemengd(d) ? 'gemengd' : (REK.opKantoor(d) ? 'kantoor' : 'thuis');
  const LOC_TEKST = { kantoor: 'Kantoor', thuis: 'Thuis', gemengd: 'Kantoor en thuis' };
  function locatieIcoonHTML(soort) {
    const iconen = soort === 'gemengd' ? ICON.kantoor + ICON.thuis : (soort === 'kantoor' ? ICON.kantoor : ICON.thuis);
    return `<span class="loc-ic ${soort}" title="${LOC_TEKST[soort]}"><span class="sr-only">${LOC_TEKST[soort]}</span>${iconen}</span>`;
  }
  // Vakantie heeft geen locatie en geen werktijden: één eigen icoon, overal hetzelfde.
  const isVak = d => REK.isVakantie(d);
  const vakUren = d => Math.max(0, Number(d && d.uren) || 0);
  const vakantieIcoonHTML = () => `<span class="loc-ic vrij" title="Vakantie"><span class="sr-only">Vakantie</span>${ICON.vrij}</span>`;
  // "5,0u kantoor · 2,0u thuis" - alleen bij een gemengde dag; anders zegt het icoon het al.
  function locatieSplitTekst(dagData) {
    const u = REK.urenPerLocatie(dagData);
    return `${U.fmtUren(u.kantoor)} kantoor · ${U.fmtUren(u.thuis)} thuis`;
  }

  // ---------- MOMENTEN OM TE VIEREN ----------
  function begroeting(nuMin) {
    if (nuMin < 6 * 60) return 'Goedenacht';
    if (nuMin < 12 * 60) return 'Goedemorgen';
    if (nuMin < 18 * 60) return 'Goedemiddag';
    return 'Goedenavond';
  }
  // Wat er vandaag tot nu toe op de teller staat: het loondeel naar rato van de verstreken
  // diensttijd, plus de reiskosten in één keer zodra de dag begonnen is (die hangen aan de rit,
  // niet aan de uren). Geeft null als er vandaag niets staat.
  function verdiendVandaag(state, iso, nuMin, weergave) {
    const d = state.dagen[iso]; if (!d || isVak(d)) return null;
    const pd = dagResultaat(state, iso); if (!pd) return null;
    const v = UR.voortgangShifts(REK.blokken(d), nuMin);
    const totaal = weergave === 'bruto' ? pd.bruto : pd.netto;
    const nu = (totaal - pd.reiskosten) * v.pct / 100 + (v.status === 'voor' ? 0 : pd.reiskosten);
    return { voortgang: v, totaal, nu, bezig: v.status === 'bezig' || v.status === 'pauze' };
  }
  // De laatste N dagen tot en met vandaag, met de betaalde uren per dag. Een gat in de strook
  // valt vanzelf op; dat werkt beter dan welke zin dan ook over "je reeks".
  const DAGLETTER = ['Z', 'M', 'D', 'W', 'D', 'V', 'Z'];
  function ritmeStrook(state, vandaagIso, aantal) {
    const eind = new Date(vandaagIso + 'T00:00:00');
    const rij = [];
    for (let i = aantal - 1; i >= 0; i--) {
      const d = new Date(eind); d.setDate(eind.getDate() - i);
      const iso = U.isoDate(d);
      const data = state.dagen[iso];
      rij.push({
        iso, letter: DAGLETTER[d.getDay()],
        uren: data ? REK.dagBruto({ ...data, datum: iso }, state.instellingen).betaaldeUren : 0,
        weekend: d.getDay() === 0 || d.getDay() === 6,
        feest: FD.isFeestdag(iso),
        vandaag: iso === vandaagIso,
      });
    }
    return rij;
  }
  // Waar stond je vorige periode op ditzelfde punt? Je enige eerlijke concurrent is je vorige zelf.
  function tempo(state, vandaagIso, netto) {
    const p = PER.periodeVoorDatum(vandaagIso);
    const g = PER.grenzen(p.jaar, p.maand);
    if (vandaagIso < g.start || vandaagIso > g.eind) return null;
    const dagenIn = Math.round((new Date(vandaagIso + 'T00:00:00') - new Date(g.start + 'T00:00:00')) / 86400000);
    const v = PER.vorige(p.jaar, p.maand);
    const gv = PER.grenzen(v.jaar, v.maand);
    const tot = new Date(gv.start + 'T00:00:00'); tot.setDate(tot.getDate() + dagenIn);
    const totIso = U.isoDate(tot);
    const vorig = periodeResultaat(state, v.jaar, v.maand).res.perDag;
    if (!vorig.length) return null;
    const bedrag = d => netto ? d.netto : d.bruto;
    const toen = vorig.filter(d => d.datum <= totIso).reduce((s, d) => s + bedrag(d), 0);
    const nu = periodeResultaat(state, p.jaar, p.maand).res.perDag.reduce((s, d) => s + bedrag(d), 0);
    return { verschil: nu - toen, maand: MAAND[v.maand - 1] };
  }

  // Waar je naartoe werkt. Altijd zichtbaar, niet pas op het moment dat je eroverheen gaat.
  function mijlpaalHTML(bedrag, staart = ' deze periode') {
    const doel = REK.volgendeMijlpaal(bedrag);
    if (!doel) return '';
    return `<div class="mijl">
      <div class="mijl-spoor"><span style="width:${Math.min(100, Math.max(0, bedrag / doel * 100)).toFixed(1)}%"></span></div>
      <span class="mijl-tekst">nog <b>${U.fmtEuro(doel - bedrag)}</b> tot ${eK(doel)}${staart}</span>
    </div>`;
  }

  // Alle loonperiodes waarin daadwerkelijk uren staan, oplopend gesorteerd.
  function periodesMetDagen(state) {
    const set = new Set();
    Object.keys(state.dagen).forEach(iso => { if (!FD.isFeestdag(iso)) set.add(PER.sleutelVoorDatum(iso)); });
    return [...set].sort();
  }
  // Is dit de best betaalde periode tot nu toe? Pas vanaf twee gevulde periodes; anders is
  // "record" een lege felicitatie. Geeft het verschil met de vorige beste terug.
  function besteTotNu(state, jaar, maand) {
    const sleutels = periodesMetDagen(state);
    const hier = PER.sleutel(jaar, maand);
    if (sleutels.length < 2 || sleutels.indexOf(hier) < 0) return null;
    const netto = k => { const [j, m] = k.split('-').map(Number); return periodeTotalen(state, j, m).netto; };
    const mijn = netto(hier);
    const hoogste = Math.max(...sleutels.filter(k => k !== hier).map(netto));
    return mijn > hoogste ? { verschil: mijn - hoogste } : null;
  }

  // ---------- ZIJBALK ----------
  function navItem(pagina, huidig, icon, label) {
    const on = pagina === huidig ? ' aria-current="page" class="ni on"' : ' class="ni"';
    return `<button data-action="pagina" data-val="${pagina}" aria-label="${label}"${on}>${icon}<span class="ni-label">${label}</span></button>`;
  }
  function sidebarHTML(ctx) {
    const p = ctx.pagina;
    return `<div class="brand"><span class="dot"></span><span class="brand-txt">Salaris</span><span class="sync-dot" data-staat="${ctx.syncStaat}" title="${esc(ctx.syncTekst)}" aria-label="${esc(ctx.syncTekst)}"></span></div>
      <nav class="nav" aria-label="Pagina's">
        ${navItem('overzicht', p, ICON.maand, 'Overzicht')}
        ${navItem('kalender', p, ICON.week, 'Kalender')}
        ${navItem('loonstrook', p, ICON.strook, 'Loonstrook')}
        ${navItem('instellingen', p, ICON.gear, 'Instellingen')}
      </nav>
      ${ctx.profielNaam ? `<button class="sb-profiel" data-action="wissel-profiel" title="Wissel profiel">
        <span class="pf-avatar sm">${initialen(ctx.profielNaam)}<span class="sync-dot op-avatar" data-staat="${ctx.syncStaat}" aria-hidden="true"></span></span>
        <span class="pf-naam">${esc(ctx.profielNaam)}</span>
        <span class="pf-chev">${ICON.wissel}</span></button>` : ''}
      <div class="sb-foot">${ICON.slot}Lokaal opgeslagen, automatisch gesynct.</div>`;
  }

  // ---------- PAGINAKOP + PERIODE-NAVIGATIE ----------
  // Bruto/netto is één instelling (Instellingen → Uiterlijk → Bedragen), geen per-pagina toggle.
  function paginakopHTML(titel, extra = '') {
    return `<div class="paginakop"><h2>${titel}</h2><div class="spacer"></div>${extra}</div>`;
  }
  // Eén navigatiebalk voor kalender én loonstrook: vorige · titel (+ ondertitel) · volgende · nu.
  function periodeNavHTML(titel, sub, labels) {
    return `<div class="calhead">
      <button class="nav-btn" data-action="prev" aria-label="${labels.vorige}">${ICON.chevL}</button>
      <div class="calhead-titel"><h3>${titel}</h3>${sub ? `<span class="calhead-sub">${sub}</span>` : ''}</div>
      <button class="nav-btn" data-action="next" aria-label="${labels.volgende}">${ICON.chevR}</button>
      <button class="today-btn" data-action="today">${labels.nu}</button>
    </div>`;
  }

  // ---------- OVERZICHT ----------
  // Balk van de loonperiode (19e t/m 18e) met een stip waar vandaag staat. Vervangt de losse zin
  // die de periodegrens uitlegde: je ziet de grens nu gewoon liggen.
  function periodeBalkHTML(jaar, maand, vandaagIso) {
    const g = PER.grenzen(jaar, maand);
    const start = new Date(g.start + 'T00:00:00'), eind = new Date(g.eind + 'T00:00:00');
    const nu = new Date(vandaagIso + 'T00:00:00');
    const pct = Math.max(0, Math.min(100, (nu - start) / ((eind - start) || 1) * 100));
    const loopt = vandaagIso >= g.start && vandaagIso <= g.eind;
    const rest = Math.round((eind - nu) / 86400000);
    const bijschrift = loopt
      ? `${rest <= 0 ? 'laatste dag' : rest === 1 ? 'nog 1 dag' : `nog ${rest} dagen`} · betaald op ${kortDatum(g.betaaldag)}`
      : (vandaagIso < g.start ? `begint op ${kortDatum(g.start)}` : `betaald op ${kortDatum(g.betaaldag)}`);
    const vulling = loopt
      ? `<span class="pb-vul" style="width:${pct}%"></span><span class="pb-nu" style="left:${pct}%" title="Vandaag"></span>`
      : (vandaagIso > g.eind ? '<span class="pb-vul" style="width:100%"></span>' : '');
    return `<div class="perbalk">
      <div class="pb-spoor">${vulling}</div>
      <div class="pb-uit"><span>${kortDatum(g.start)}</span><span class="pb-mid">${bijschrift}</span><span>${kortDatum(g.eind)}</span></div>
    </div>`;
  }

  // ---------- OVERZICHT: WIDGETS ----------
  // Drie maten, zoals op een telefoon-beginscherm: klein (1x1), breed (2x1) en groot (2x2).
  // De rijhoogte ligt vast, dus een maat betekent op elke pagina hetzelfde en je ziet meteen
  // hoe groot een widget wordt. Elke widget beslist zelf wat er bij die maat op past.
  const MATEN = ['klein', 'breed', 'groot'];
  const MAAT_NAAM = { klein: 'Klein', breed: 'Breed', groot: 'Groot' };
  const MAAT_UITLEG = { klein: 'Eén vak', breed: 'Twee vakken naast elkaar', groot: 'Vier vakken' };
  const MAAT_VORM = {
    klein: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="9" y="9" width="6" height="6" rx="1.6"/></svg>',
    breed: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="3" y="9" width="18" height="6" rx="1.6"/></svg>',
    groot: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="3" y="3" width="18" height="18" rx="2.2"/></svg>',
  };

  // Statistiek-widget in drie maten. Klein toont alleen het getal; groter voegt context toe.
  function statHTML(maat, o, inert) {
    const actie = inert ? null : o.actie;
    const klik = actie ? ` data-action="${actie}"${o.iso ? ` data-iso="${o.iso}"` : ''}${o.val ? ` data-val="${o.val}"` : ''}` : '';
    const tag = actie ? 'button' : 'div';
    const type = actie ? ' type="button"' : '';
    return `<${tag}${type} class="wg stat maat-${maat}${actie ? ' klikbaar' : ''}${o.toon ? ' ' + o.toon : ''}"${klik}>
      <span class="wg-kop"><span class="wg-ic">${o.icoon}</span><span class="wg-l">${o.label}${maat !== 'klein' && o.extra ? ` <span class="wg-x">${o.extra}</span>` : ''}</span></span>
      <span class="wg-v">${o.waarde}</span>
      ${maat !== 'klein' && o.sub ? `<span class="wg-s">${o.sub}</span>` : ''}
    </${tag}>`;
  }

  function ritmeWidgetHTML(maat, D, inert) {
    const { reeks, strook, tp, vandaagIso } = D;
    const vandaag = strook[strook.length - 1];
    const dagen = maat === 'groot' ? strook : strook.slice(-7);
    const hoogste = Math.max(4, ...strook.map(d => d.uren));
    const kolommen = dagen.map(d => {
      const soort = d.uren > 0 ? 'vol' : (d.weekend || d.feest ? 'rust' : 'gat');
      const titel = d.uren > 0 ? `${kortDatum(d.iso)}: ${U.fmtUren(d.uren)}` : `${kortDatum(d.iso)}: niets ingevuld`;
      const vul = d.uren > 0 ? Math.max(25, Math.round(d.uren / hoogste * 100)) : 0;
      return `<span class="rs ${soort}${d.vandaag ? ' nu' : ''}" style="--vul:${vul}%" title="${titel}"><b>${d.letter}</b></span>`;
    }).join('');

    let stand = '', actie = '';
    if (vandaag.uren > 0) stand = 'Vandaag staat erin. Morgen weer.';
    else if (vandaag.weekend || vandaag.feest) stand = 'Vrije dag. Je reeks blijft gewoon staan.';
    else {
      stand = reeks > 0
        ? `Nog niets vandaag. Vul 'm in en je reeks gaat naar <b>${reeks + 1}</b>.`
        : 'Nog niets vandaag. Vul een dag in en je reeks begint.';
      actie = inert ? '' : `<button type="button" class="btn primary klein" data-action="goto-dag-flash" data-iso="${vandaagIso}">${ICON.plus}Invullen</button>`;
    }
    const tempoBadge = tp && Math.abs(tp.verschil) >= 0.5
      ? `<span class="tempo ${tp.verschil > 0 ? 'voor' : 'achter'}" title="Vergeleken met ${tp.maand} op ditzelfde punt in de periode">${tp.verschil > 0 ? ICON.pijlOp : ICON.pijlNeer}${U.fmtEuro(Math.abs(tp.verschil))} ${tp.verschil > 0 ? 'voor' : 'achter'}${maat === 'groot' ? ` op ${tp.maand}` : ''}</span>`
      : '';

    if (maat === 'klein') {
      return `<div class="wg ritme maat-klein${reeks >= 3 ? ' brandt' : ''}">
        <span class="wg-kop"><span class="wg-ic">${ICON.vlam}</span><span class="wg-l">Je ritme</span></span>
        <span class="reeks-n">${reeks}</span>
        <span class="wg-s">${reeks === 1 ? 'dag' : 'dagen'} op rij</span>
      </div>`;
    }
    return `<div class="wg ritme maat-${maat}${reeks >= 3 ? ' brandt' : ''}">
      <span class="wg-kop"><span class="wg-ic">${ICON.vlam}</span><span class="wg-l">Je ritme</span>${tempoBadge}</span>
      <div class="reeks"><span class="reeks-n">${reeks}</span><span class="reeks-l">${reeks === 1 ? 'dag' : 'dagen'}<br>op rij</span></div>
      <div class="ritme-strook" role="img" aria-label="De laatste ${dagen.length} dagen: ${dagen.filter(d => d.uren > 0).length} ingevuld">${kolommen}</div>
      ${maat === 'groot' ? `<div class="ritme-voet"><span>${stand}</span>${actie}</div>` : ''}
    </div>`;
  }

  function vandaagWidgetHTML(maat, D, inert) {
    const { live, vd, weergave, vandaagIso, nuMin } = D;
    if (vd && isVak(vd)) {
      return `<div class="wg vandaag vrij maat-${maat}">
        <span class="wg-kop"><span class="wg-ic">${ICON.vrij}</span><span class="wg-l">Vakantie vandaag</span></span>
        <span class="teller">${U.fmtEuro(bedragVoorDag(D.state, vandaagIso, weergave))}<small>${weergave}</small></span>
        ${maat === 'klein' ? `<span class="wg-s">${U.fmtUren(vakUren(vd))} betaald</span>` : `<p class="leeg-tekst">${U.fmtUren(vakUren(vd))} betaald. Geen werktijden, geen reiskosten.</p>`}
      </div>`;
    }
    if (!vd || !live) {
      return `<div class="wg vandaag leeg maat-${maat}">
        <span class="wg-kop"><span class="wg-ic">${ICON.klok}</span><span class="wg-l">Werkdag vandaag</span></span>
        ${maat === 'klein' ? '<span class="wg-s">Nog niets ingevuld</span>' : '<p class="leeg-tekst">Nog geen uren voor vandaag. Vul ze in en je ziet meteen wat de dag oplevert.</p>'}
        ${inert ? '' : `<button type="button" class="btn primary klein" data-action="goto-dag-flash" data-iso="${vandaagIso}">${ICON.plus}Invullen</button>`}
      </div>`;
    }
    const v = live.voortgang;
    const meta = v.status === 'voor' ? `begint om ${U.fmtTijd(v.eersteVan)}`
      : v.status === 'klaar' ? 'werkdag klaar'
      : v.status === 'pauze' ? `pauze · verder om ${U.fmtTijd(v.volgendeVan)}`
      : `nog ${resterend(v.resterendeMin)}`;
    const kop = `<span class="wg-kop"><span class="wg-ic">${ICON.klok}</span><span class="wg-l">Werkdag vandaag</span>${live.bezig ? '<span class="live"><span class="pd"></span>Bezig</span>' : locatieIcoonHTML(locatieSoort(vd))}</span>`;
    const teller = `<span class="teller">${U.fmtEuro(live.nu)}<small>${v.status === 'klaar' ? weergave : `${weergave} tot nu`}</small></span>`;
    if (maat === 'klein') {
      return `<div class="wg vandaag maat-klein${live.bezig ? ' aan' : ''}">${kop}${teller}
        <div class="track"><div class="fill" style="width:${v.pct}%"></div></div></div>`;
    }
    const blokRegels = REK.blokken(vd).map(s => {
      const bezigNu = nuMin >= U.parseTime(s.van) && nuMin < U.parseTime(s.tot);
      const eigen = s.locatie === 'kantoor' ? 'kantoor' : 'thuis';
      return `<div class="db${bezigNu ? ' nu' : ''}"><span class="db-t">${U.fmtBereik(s.van, s.tot)}</span>
        <span class="db-w">${locatieIcoonHTML(eigen)}${LOC_TEKST[eigen]}</span>
        <span class="db-u">${U.fmtUren(UR.klokuren(s.van, s.tot))}</span></div>`;
    }).join('');
    return `<div class="wg vandaag maat-${maat}${live.bezig ? ' aan' : ''}">${kop}${teller}
      <div class="track"><div class="fill" style="width:${v.pct}%"></div></div>
      <div class="prog-meta"><span><b>${Math.round(v.pct)}%</b> van je dag</span><span>${meta}</span></div>
      ${maat === 'groot' ? `<div class="dag-blokken">${blokRegels}</div>
        ${v.status === 'klaar' ? '' : `<div class="teller-doel">Aan het eind van de dag: <b>${U.fmtEuro(live.totaal)}</b></div>`}` : ''}
    </div>`;
  }

  function salarisWidgetHTML(maat, D, inert) {
    const { M, weergave, jaar, maand, vandaagIso } = D;
    const netto = weergave === 'netto';
    const bedrag = netto ? M.res.totalen.nettoTot : M.res.totalen.brutoTot;
    const kop = `<span class="wg-kop"><span class="wg-ic">${ICON.euro}</span><span class="wg-l">Salaris ${MAAND[maand - 1]}</span></span>`;
    const groot = `<span class="sk-bedrag">${U.fmtEuro(bedrag)}<small>${netto ? 'netto' : 'bruto'}</small></span>`;
    const open = inert ? '<div class="wg salaris' : '<button type="button" data-action="pagina" data-val="loonstrook" class="wg salaris klikbaar';
    const dicht = inert ? '</div>' : '</button>';
    if (maat === 'klein') return `${open} maat-klein">${kop}${groot}<span class="wg-s">betaald op ${kortDatum(PER.grenzen(jaar, maand).betaaldag)}</span>${dicht}`;
    const rows = netto
      ? `<div class="row bruto"><span class="k">Bruto totaal</span><span class="v">${U.fmtEuro(M.svBase)}</span></div>
        <div class="row inhoud"><span class="k">Inhoudingen</span><span class="v">−${U.fmtEuro(M.inhoudingen)}</span></div>
        <div class="row"><span class="k">Reiskosten <span class="f">(onbelast)</span></span><span class="v">${U.fmtEuro(M.reiskosten)}</span></div>`
      : `<div class="row bruto"><span class="k">Bruto totaal</span><span class="v">${U.fmtEuro(M.svBase)}</span></div>
        <div class="row"><span class="k">Reiskosten <span class="f">(onbelast)</span></span><span class="v">${U.fmtEuro(M.reiskosten)}</span></div>`;
    return `${open} maat-${maat}">${kop}${groot}
      ${mijlpaalHTML(bedrag)}
      ${maat === 'groot' ? `${periodeBalkHTML(jaar, maand, vandaagIso)}<div class="bd plain">${rows}</div>` : ''}
    ${dicht}`;
  }

  function binnenkortWidgetHTML(maat, D, inert) {
    const { sluitIso, betaalIso, betaalBedrag, weergave, dagenTot, daysAway } = D;
    const rij = (iso, icoon, klasse, tekst, actie) =>
      `<${inert ? 'div' : 'button type="button"'} class="up-row btn-row" ${inert ? '' : actie}><span class="ic ${klasse}">${icoon}</span><span><b>${kortDatum(iso)}</b> <span class="d">${tekst}</span><span class="days-away">${daysAway(dagenTot(iso))}</span></span></${inert ? 'div' : 'button'}>`;
    const kop = `<span class="wg-kop"><span class="wg-ic">${ICON.klok}</span><span class="wg-l">Binnenkort</span></span>`;
    if (maat === 'klein') {
      const eerst = dagenTot(sluitIso) <= dagenTot(betaalIso) ? sluitIso : betaalIso;
      return `<div class="wg maat-klein">${kop}<span class="wg-v klein">${kortDatum(eerst)}</span>
        <span class="wg-s">${eerst === sluitIso ? 'uren indienen' : 'salaris'} · ${daysAway(dagenTot(eerst))}</span></div>`;
    }
    return `<div class="wg maat-${maat}">${kop}<div class="up">
      ${rij(sluitIso, ICON.omhoog, 'hr', '· uren indienen', `data-action="goto-dag" data-iso="${sluitIso}"`)}
      ${rij(betaalIso, ICON.euro, 'pay', `· salaris · ${U.fmtEuro(betaalBedrag)} ${weergave}`, 'data-action="pagina" data-val="loonstrook"')}
    </div></div>`;
  }

  // Alles wat de widgets nodig hebben, één keer berekend per render.
  function overzichtData(ctx) {
    const { state, weergave, vandaagIso, nuMin } = ctx;
    const vandaag = new Date(vandaagIso + 'T00:00:00');
    const { jaar, maand } = PER.periodeVoorDatum(vandaagIso);
    const M = periodeTotalen(state, jaar, maand);
    const urenPeriode = M.res.perDag.reduce((s, d) => s + d.betaaldeUren, 0);
    const maMaandag = maandagVan(vandaag);
    const urenWeek = ST.urenInWeek(state.dagen, U.isoDate(maMaandag));
    let weekBedrag = 0, weekReis = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(maMaandag); d.setDate(maMaandag.getDate() + i); const iso = U.isoDate(d);
      const pd = state.dagen[iso] ? dagResultaat(state, iso) : null;
      if (pd) { weekBedrag += weergave === 'bruto' ? pd.bruto : pd.netto; weekReis += pd.reiskosten; }
    }
    const volg = ST.volgendeWerkdag(state.dagen, vandaagIso);
    let volgBig = 'Nog niets', volgSub = 'gepland na vandaag';
    if (volg) {
      const vd2 = state.dagen[volg]; const dt = new Date(volg + 'T00:00:00');
      const fr = REK.toeslagFractie({ datum: volg, zondagToeslag: vd2.zondagToeslag != null ? vd2.zondagToeslag : undefined }, state.instellingen);
      volgBig = `${U.dagNaam(dt).slice(0, 2)} ${dt.getDate()} ${MAAND_KORT[dt.getMonth()]}`;
      volgSub = `${U.fmtEuro(bedragVoorDag(state, volg, weergave))} · ${isVak(vd2) ? 'vakantie' : U.fmtBereik(vd2.van, vd2.tot)}${fr > 0 ? ` · +${Math.round(fr * 100)}%` : ''}`;
    }
    const sluitIso = PER.eerstvolgende(vandaagIso, PER.INDIENDAG);
    const betaalIso = PER.eerstvolgende(vandaagIso, PER.BETAALDAG);
    const [bJaar, bMaand] = betaalIso.split('-').map(Number);
    const bTot = periodeTotalen(state, bJaar, bMaand);
    return {
      state, weergave, vandaagIso, nuMin, vandaag, jaar, maand, M, urenPeriode, urenWeek,
      weekBedrag, weekReis, volg, volgBig, volgSub, sluitIso, betaalIso,
      betaalBedrag: weergave === 'bruto' ? bTot.brutoTot : bTot.netto,
      periodeBedrag: weergave === 'bruto' ? M.brutoTot : M.netto,
      vd: state.dagen[vandaagIso],
      live: verdiendVandaag(state, vandaagIso, nuMin, weergave),
      reeks: ST.werkReeks(state.dagen, vandaagIso),
      strook: ritmeStrook(state, vandaagIso, 14),
      tp: tempo(state, vandaagIso, weergave === 'netto'),
      dagenTot: iso => Math.round((new Date(iso + 'T00:00:00').getTime() - vandaag.getTime()) / 86400000),
      daysAway: n => n <= 0 ? 'vandaag' : n === 1 ? 'morgen' : `over ${n} dagen`,
    };
  }

  // Het register: naam, uitleg voor de galerij, en hoe de widget er per maat uitziet.
  const WIDGETS = {
    voortgang: { naam: 'Werkdag vandaag', uitleg: 'Je verdiensten lopen mee met je dienst.', render: vandaagWidgetHTML },
    reeks: { naam: 'Je ritme', uitleg: 'Dagen op rij en de laatste twee weken in beeld.', render: ritmeWidgetHTML },
    maanddetail: { naam: 'Salaris deze periode', uitleg: 'Wat er op de 25e binnenkomt, met de opbouw.', render: salarisWidgetHTML },
    binnenkort: { naam: 'Binnenkort', uitleg: 'De 19e voor indienen en de 25e voor je salaris.', render: binnenkortWidgetHTML },
    week: {
      naam: 'Deze week', uitleg: 'Je uren en verdiensten van maandag tot zondag.',
      render: (maat, D, inert) => statHTML(maat, {
        icoon: ICON.week, label: 'Deze week', waarde: `${U.fmtUren(D.urenWeek).replace('u', '')}<small>u</small>`,
        sub: `${U.fmtEuro(D.weekBedrag)} ${D.weergave}${D.weekReis > 0 ? ` · ${U.fmtEuro(D.weekReis)} reiskosten` : ''}`,
        actie: 'goto-dag', iso: D.vandaagIso,
      }, inert),
    },
    maand: {
      naam: 'Deze periode', uitleg: 'Je uren over de loonperiode van de 19e tot de 18e.',
      render: (maat, D, inert) => statHTML(maat, {
        icoon: ICON.maand, label: 'Deze periode', extra: periodeBereik(D.jaar, D.maand),
        waarde: `${U.fmtUren(D.urenPeriode).replace('u', '')}<small>u</small>`,
        sub: `${U.fmtEuro(D.periodeBedrag)} ${D.weergave}${D.M.reiskosten > 0 ? ` · ${U.fmtEuro(D.M.reiskosten)} reiskosten` : ''}`,
        actie: 'goto-dag', iso: D.vandaagIso,
      }, inert),
    },
    vakantiegeld: {
      naam: 'Vakantiegeld', uitleg: 'Wat je deze periode opbouwt voor mei.',
      render: (maat, D, inert) => statHTML(maat, {
        icoon: ICON.zon, label: 'Vakantiegeld', waarde: U.fmtEuro(D.M.vakantiegeld),
        sub: 'opgebouwd, in mei uitbetaald', actie: 'pagina', val: 'loonstrook', toon: 'accent',
      }, inert),
    },
    volgende: {
      naam: 'Volgende werkdag', uitleg: 'De eerstvolgende dag die je al hebt ingevuld.',
      render: (maat, D, inert) => statHTML(maat, {
        icoon: ICON.pijl, label: 'Volgende werkdag', waarde: `<span class="wg-v klein">${D.volgBig}</span>`,
        sub: D.volgSub, actie: D.volg ? 'goto-dag-flash' : null, iso: D.volg || null,
      }, inert),
    },
  };
  const WIDGET_IDS = Object.keys(WIDGETS);
  const STANDAARD_MAAT = { voortgang: 'groot', reeks: 'groot', maanddetail: 'groot', binnenkort: 'breed' };

  // Volgorde, maat en zichtbaarheid komen uit het profiel; een onbekende widget schuift er
  // achteraan bij zodat een eigen indeling geldig blijft na een update.
  function widgetIndeling(state) {
    const opgeslagen = (state.instellingen.overzichtWidgets || []).filter(w => w && WIDGETS[w.id]);
    const lijst = opgeslagen.map(w => ({
      id: w.id,
      zicht: w.zicht !== false,
      maat: MATEN.includes(w.maat) ? w.maat : (w.groot ? 'groot' : 'klein'),
    }));
    WIDGET_IDS.forEach(id => {
      if (!lijst.some(w => w.id === id)) lijst.push({ id, zicht: false, maat: STANDAARD_MAAT[id] || 'klein' });
    });
    return lijst;
  }

  // Galerij: alles wat nu uit staat, met een echte voorvertoning in het klein.
  function widgetGallerijHTML(ctx) {
    const D = overzichtData(ctx);
    const uit = widgetIndeling(ctx.state).filter(w => !w.zicht);
    const kaarten = uit.map(w => `<button type="button" class="gal-item" data-action="ov-toevoegen" data-id="${w.id}">
        <span class="gal-prev" aria-hidden="true">${WIDGETS[w.id].render('klein', D, true)}</span>
        <span class="gal-tekst"><b>${WIDGETS[w.id].naam}</b><span>${WIDGETS[w.id].uitleg}</span></span>
        <span class="gal-plus">${ICON.plus}</span>
      </button>`).join('');
    return `<div class="sheet gal-sheet" role="dialog" aria-modal="true" aria-label="Widget toevoegen" tabindex="-1" autofocus>
      <div class="sh-head"><div><div class="t">Widget toevoegen</div>
        <div class="sh-sub">Kies wat je op je overzicht wilt zien. De grootte pas je daarna aan.</div></div>
        <button class="x" data-action="sluit" aria-label="Sluiten">${ICON.kruis}</button></div>
      ${uit.length ? `<div class="gal-grid">${kaarten}</div>`
        : '<p class="leeg-tekst">Alle widgets staan al op je overzicht. Sleep er een naar de prullenbak om ruimte te maken.</p>'}
    </div>`;
  }

  function overzichtPage(ctx) {
    const { state, weergave, vandaagIso } = ctx;
    const D = overzichtData(ctx);
    const bewerk = !!ctx.overzichtBewerk;
    const indeling = widgetIndeling(state);
    const zichtbaar = indeling.filter(w => w.zicht);

    const kaarten = zichtbaar.map(w => `<div class="ov-w maat-${w.maat}" data-id="${w.id}"${bewerk ? ' draggable="true" data-action="ov-w"' : ''}>
        <div class="ov-inhoud">${WIDGETS[w.id].render(w.maat, D)}</div>
        ${bewerk ? `<div class="ov-edit">
            <span class="ov-naam">${WIDGETS[w.id].naam}</span>
            <button type="button" class="ov-weg" data-action="ov-verwijder" data-id="${w.id}" aria-label="${WIDGETS[w.id].naam} van je overzicht halen" title="Van je overzicht halen">${ICON.prul}</button>
            <div class="ov-maten" role="group" aria-label="Grootte">
              ${MATEN.map(m => `<button type="button" class="maat-btn${w.maat === m ? ' on' : ''}"
                data-action="ov-maat" data-id="${w.id}" data-val="${m}" aria-pressed="${w.maat === m}">
                <span class="maat-vorm">${MAAT_VORM[m]}</span><span class="maat-naam">${MAAT_NAAM[m]}</span></button>`).join('')}
            </div>
            <button type="button" class="ov-plek links" data-action="ov-op" data-id="${w.id}" aria-label="Naar voren" title="Naar voren">${ICON.chevL}</button>
            <button type="button" class="ov-plek rechts" data-action="ov-neer" data-id="${w.id}" aria-label="Naar achteren" title="Naar achteren">${ICON.chevR}</button>
          </div>` : ''}
      </div>`).join('');

    const leeg = !zichtbaar.length
      ? `<div class="ov-leeg"><p>Je overzicht is leeg. Voeg een widget toe om te zien wat je verdient.</p>
          <button type="button" class="btn primary" data-action="ov-gallerij">${ICON.plus}Widget toevoegen</button></div>`
      : '';

    const knoppen = `${bewerk ? `<button class="btn" data-action="ov-gallerij">${ICON.plus}Widget</button>` : ''}
      <button class="btn ${bewerk ? 'primary' : ''}" data-action="ov-bewerk">${bewerk ? ICON.vink : ICON.raster}${bewerk ? 'Klaar' : 'Indeling'}</button>`;

    // De kop is de begroeting: één regel die zegt hoe je er vandaag voor staat.
    const naam = ctx.profielNaam ? `, ${esc(ctx.profielNaam)}` : '';
    const live = D.live, vd = D.vd;
    let onderkop;
    if (live && live.bezig) onderkop = `Je bent bezig. Er staat <b>${U.fmtEuro(live.nu)}</b> ${weergave} op de teller.`;
    else if (live && live.voortgang.status === 'klaar') onderkop = `Werkdag klaar. <b>${U.fmtEuro(live.totaal)}</b> ${weergave} erbij vandaag.`;
    else if (live) onderkop = `Vandaag van <b>${U.fmtTijd(vd.van)}</b> tot <b>${U.fmtTijd(REK.blokken(vd).slice(-1)[0].tot)}</b>, ${LOC_TEKST[locatieSoort(vd)].toLowerCase()}.`;
    else if (vd && isVak(vd)) onderkop = `Vakantie vandaag. <b>${U.fmtUren(vakUren(vd))}</b> betaald, je periode loopt gewoon door.`;
    else if (D.vandaag.getDay() === 0 || D.vandaag.getDay() === 6) onderkop = 'Vrij vandaag. Je periode loopt gewoon door.';
    else if (D.reeks > 0) onderkop = `Je hebt <b>${D.reeks} dagen</b> op rij staan. Vul vandaag in als je gewerkt hebt.`;
    else onderkop = 'Nog geen uren voor vandaag ingevuld.';

    return `<div class="paginakop begroet"><div class="bg-tekst"><h2>${begroeting(ctx.nuMin)}${naam}</h2><p class="bg-sub">${onderkop}</p></div><div class="spacer"></div>${knoppen}</div>
      ${bewerk ? `<div class="ov-hint">Kies een grootte, verschuif met de pijlen, of gooi een widget weg.<span class="hint-muis"> Slepen werkt ook.</span></div>` : ''}
      <div class="ov-scroll" data-scroll>
        <div class="ov-grid${bewerk ? ' bewerk' : ''}" data-rol="ov-grid">${kaarten}</div>
        ${leeg}
        ${bewerk ? `<div class="prullenbak" data-rol="prullenbak">${ICON.prul}<span>Sleep hierheen om te verwijderen</span></div>` : ''}
      </div>`;
  }

  // ---------- KALENDER ----------
  function dagCelHTML(c, ctx) {
    const { state, weergave } = ctx;
    if (c.uitMaand) return `<div class="c out"><div class="c-top"><span class="num">${c.dagNummer}</span></div></div>`;
    if (c.geblokkeerd) return `<button type="button" class="c holi" data-action="holi" data-naam="${esc(c.feestdag)}"><div class="c-top"><span class="num">${c.dagNummer}</span>${ICON.slot.replace('<svg', '<svg class="lock"')}</div><div class="holi-naam">${esc(c.feestdag)}</div></button>`;

    const dagData = state.dagen[c.iso];
    const heeftWerk = !!dagData;
    const heeftNotitie = !!(dagData && dagData.notitie);

    // Rechtsboven hooguit één markering. Alles wat je over de dag moet weten - waar je werkte,
    // hoe lang, wat het opleverde - staat onderin, in getekende iconen en cijfers. Zo hoeft
    // niemand een legenda te lezen om de kalender te begrijpen.
    const marks = heeftNotitie
      ? `<span class="mk note" title="${esc(dagData.notitie)}"><span class="sr-only">Heeft een opmerking</span>${ICON.notitie}</span>`
      : '';

    // De 19e en de 25e bepalen het salarisritme; die twee dagen noemen zichzelf, ook als je
    // er werkt. De 19e is meteen de eerste dag van de volgende loonperiode.
    let voet = '';
    if (c.indiendag) voet = '<div class="c-special hr"><span class="cs-lg">Uren indienen</span><span class="cs-sm">Indienen</span></div>';
    else if (c.salarisdag) voet = '<div class="c-special pay">Salaris</div>';

    let werk = '';
    const pd = heeftWerk ? dagResultaat(state, c.iso) : null;
    if (pd) {
      const toesl = c.toeslag > 0 ? `<span class="c-tsl">+${Math.round(c.toeslag * 100)}%</span>` : '';
      werk = `<div class="c-work">
        <span class="u">${c.vakantie ? vakantieIcoonHTML() : locatieIcoonHTML(locatieSoort(dagData))}${U.fmtUren(c.betaaldeUren)}${c.vakantie ? '' : toesl}</span>
        <span class="e">${eK(weergave === 'bruto' ? pd.bruto : pd.netto)}</span></div>`;
    }

    const cls = ['c'];
    if (c.vandaag) cls.push('today');
    if (c.zondag) cls.push('weekend');
    if (c.indiendag) cls.push('start-periode');
    if (heeftWerk) cls.push(c.vakantie ? 'vakantie' : 'worked');
    if (heeftNotitie) cls.push('has-note');
    if (ctx.highlightIso === c.iso) cls.push('flash');
    // Een vakantiedag heeft geen werktijden om te slepen of te plakken.
    const draggable = heeftWerk && !c.vakantie ? ' draggable="true"' : '';
    const beschrijving = c.vakantie ? `: ${U.fmtUren(c.betaaldeUren)} vakantie`
      : heeftWerk ? `: ${U.fmtUren(c.betaaldeUren)}, ${LOC_TEKST[locatieSoort(dagData)].toLowerCase()}`
      : ': nog niets ingevuld';
    const label = `${c.dagNummer} ${MAAND[new Date(c.iso + 'T00:00:00').getMonth()]}${beschrijving}`;
    return `<button type="button" class="${cls.join(' ')}"${draggable} data-action="dag" data-iso="${c.iso}" aria-label="${esc(label)}">
      <div class="c-top"><span class="num">${c.dagNummer}</span><span class="marks">${marks}</span></div>
      ${werk}
      ${voet}
    </button>`;
  }

  // De enige kaart naast de kalender: wat deze loonperiode oplevert, waar je in de periode staat,
  // en de opbouw eronder. Geen legenda, geen losse uitleg-zin - de balk laat de grens zelf zien.
  function periodeKaartHTML(ctx, jaar, maand) {
    const { state, weergave, vandaagIso } = ctx;
    const M = periodeTotalen(state, jaar, maand);
    const uren = M.res.perDag.reduce((s, d) => s + d.betaaldeUren, 0);
    const netto = weergave === 'netto';
    const record = besteTotNu(state, jaar, maand);
    const live = verdiendVandaag(state, vandaagIso, ctx.nuMin, weergave);
    const vandaagTeltMee = PER.sleutelVoorDatum(vandaagIso) === PER.sleutel(jaar, maand);
    return `<div class="card periode-kaart">
        <div class="lab">${ICON.euro}Salaris ${MAAND[maand - 1]}</div>
        <div class="pk-bedrag">${U.fmtEuro(netto ? M.netto : M.brutoTot)}<small>${netto ? 'netto' : 'bruto'}</small></div>
        ${record ? `<div class="vier">${ICON.trofee}<span>Je beste periode tot nu toe. <b>${U.fmtEuro(record.verschil)}</b> meer dan je vorige record.</span></div>` : ''}
        ${mijlpaalHTML(netto ? M.netto : M.brutoTot, '')}
        ${periodeBalkHTML(jaar, maand, vandaagIso)}
        ${live && live.bezig && vandaagTeltMee ? `<div class="nu-verdiend"><span class="live"><span class="pd"></span>Bezig</span><span>vandaag al <b>${U.fmtEuro(live.nu)}</b> erbij</span></div>` : ''}
        <div class="bd plain">
          <div class="row"><span class="k">Uren</span><span class="v">${U.fmtUren(uren)}</span></div>
          <div class="row"><span class="k">Bruto</span><span class="v">${U.fmtEuro(M.svBase)}</span></div>
          <div class="row"><span class="k">Reiskosten <span class="f">(onbelast)</span></span><span class="v">${U.fmtEuro(M.reiskosten)}</span></div>
          <div class="row"><span class="k">Vakantiegeld <span class="f">(in mei)</span></span><span class="v">${U.fmtEuro(M.vakantiegeld)}</span></div>
        </div>
        <button class="btn ghost klein breed" data-action="pagina" data-val="loonstrook">${ICON.strook}Bekijk de loonstrook</button>
      </div>`;
  }

  function kalenderPage(ctx) {
    const { state, zicht, vandaagIso } = ctx;
    const cellen = KAL.maandModel(zicht.jaar, zicht.maand, state.dagen, state.instellingen, ctx.vandaagIso);
    const cellHTML = cellen.map(c => dagCelHTML(c, ctx)).join('');

    const VOLDAG = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag'];
    const dow = VOLDAG.map((d, i) => `<b class="${i >= 5 ? 'we' : ''}" title="${d}"><span class="dow-lg">${d}</span><span class="dow-sm">${d.slice(0, 2)}</span></b>`).join('');

    // Eén zichtbare hoofdactie, zodat je niet hoeft te raden dat je op een dag kunt klikken.
    const bestaat = !!state.dagen[vandaagIso];
    const hoofdknop = FD.isFeestdag(vandaagIso) ? ''
      : `<button class="btn primary" data-action="dag" data-iso="${vandaagIso}">${bestaat ? ICON.pen : ICON.plus}<span class="btn-lg">${bestaat ? 'Vandaag aanpassen' : 'Vandaag invullen'}</span><span class="btn-sm">Vandaag</span></button>`;

    const vakantieKnop = `<button class="btn" data-action="vakantie-nieuw">${ICON.vrij}<span class="btn-lg">Vakantie invoeren</span><span class="btn-sm">Vakantie</span></button>`;
    return `${paginakopHTML('Kalender', vakantieKnop + hoofdknop)}
      <div class="kal-wrap">
        <div class="calcard">
          ${periodeNavHTML(maandNaam(zicht.jaar, zicht.maand), '', { vorige: 'Vorige maand', volgende: 'Volgende maand', nu: 'Vandaag' })}
          <div class="dow">${dow}</div>
          <div class="cal${ctx.klembord ? ' plakmodus' : ''}">${cellHTML}</div>
        </div>
        <aside class="kal-rail">${periodeKaartHTML(ctx, zicht.jaar, zicht.maand)}</aside>
      </div>`;
  }

  // ---------- LOONSTROOK ----------
  function loonstrookPage(ctx) {
    const { state, weergave, zicht, vandaagIso } = ctx;
    const { jaar, maand } = zicht;
    const inst = state.instellingen;
    const { res, correcties } = periodeResultaat(state, jaar, maand);
    const t = res.totalen;
    const netto = weergave === 'netto';
    const g = PER.grenzen(jaar, maand);
    const uren = res.perDag.reduce((s, d) => s + d.betaaldeUren, 0);
    const salaris = res.perDag.reduce((s, d) => s + d.basisloon, 0);
    const toeslag = res.perDag.reduce((s, d) => s + d.toeslag, 0);
    const extraUren = correcties.reduce((s, c) => s + (c.uren || 0), 0);
    const svBase = t.brutoTot - t.reiskostenTot;
    const inhoudingen = t.brutoTot - t.nettoTot;
    const hoofdBedrag = netto ? t.nettoTot : t.brutoTot;
    const dagen = res.perDag.length;

    // Lopende periode: hoeveel dagen er nog in zitten. Afgesloten periode: verschil met de vorige
    // (alleen als die ook uren heeft) - een lopende periode vergelijken zou altijd 'minder' tonen.
    const afgesloten = g.eind < vandaagIso;
    let deltaHTML = '';
    if (!afgesloten && g.start <= vandaagIso) {
      const rest = Math.round((new Date(g.eind + 'T00:00:00') - new Date(vandaagIso + 'T00:00:00')) / 86400000);
      deltaHTML = `<span class="hero-delta">nog ${rest === 0 ? 'vandaag' : rest === 1 ? '1 dag' : rest + ' dagen'}</span>`;
    } else if (afgesloten && dagen) {
      const vorige = PER.vorige(jaar, maand);
      const V = periodeTotalen(state, vorige.jaar, vorige.maand);
      if (V.res.perDag.length) {
        const delta = hoofdBedrag - (netto ? V.netto : V.brutoTot);
        deltaHTML = `<span class="hero-delta ${delta >= 0 ? 'plus' : 'min'}">${delta >= 0 ? '+' : '−'}${U.fmtEuro(Math.abs(delta))} t.o.v. ${MAAND[vorige.maand - 1]}</span>`;
      }
    }
    const nettoUur = uren > 0 ? t.nettoTot / uren : 0;
    const heroSub = dagen
      ? `${U.fmtUren(uren)} · ${dagen} dag${dagen === 1 ? '' : 'en'} · ${U.fmtEuro(netto ? nettoUur : inst.uurloon)} ${netto ? 'netto' : 'bruto'} per uur`
      : 'Nog geen dagen ingevuld in deze periode.';
    const ontvang = g.betaaldag < vandaagIso ? 'ontving je' : 'ontvang je';

    const pct = n => t.brutoTot > 0 ? (n / t.brutoTot * 100).toFixed(2) : 0;
    const verdeel = netto && t.brutoTot > 0 ? `<div class="verdeel" role="img" aria-label="Verdeling: netto loon ${U.fmtEuro(t.nettoBelast)}, reiskosten ${U.fmtEuro(t.reiskostenTot)}, inhoudingen ${U.fmtEuro(inhoudingen)}">
          <span class="vd netto" style="width:${pct(t.nettoBelast)}%"></span><span class="vd reis" style="width:${pct(t.reiskostenTot)}%"></span><span class="vd inhoud" style="width:${pct(inhoudingen)}%"></span></div>
        <div class="verdeel-leg"><span class="vk netto">Netto loon <b>${U.fmtEuro(t.nettoBelast)}</b></span><span class="vk reis">Reiskosten <b>${U.fmtEuro(t.reiskostenTot)}</b></span><span class="vk inhoud">Inhoudingen <b>${U.fmtEuro(inhoudingen)}</b></span></div>` : '';

    const record = dagen ? besteTotNu(state, jaar, maand) : null;
    const hero = `<div class="card loon-hero">
        ${periodeNavHTML(maandNaam(jaar, maand), periodeOmschrijving(jaar, maand), { vorige: 'Vorige periode', volgende: 'Volgende periode', nu: 'Nu' })}
        <div class="lab">Op ${kortDatum(g.betaaldag)} ${ontvang}</div>
        <div class="hero-bedrag">${U.fmtEuro(hoofdBedrag)}<small>${netto ? 'netto' : 'bruto'}</small></div>
        <div class="hero-sub"><span>${heroSub}</span>${deltaHTML}</div>
        ${record ? `<div class="vier groot">${ICON.trofee}<span>Je beste periode tot nu toe. <b>${U.fmtEuro(record.verschil)}</b> meer dan je vorige record.</span></div>` : ''}
        ${verdeel}
      </div>`;

    // Opbouw: alleen regels die iets zeggen. Nulregels blijven weg; de losse inhoudingen zitten
    // achter de regel "Inhoudingen" (uitklappen), zodat de kaart in één oogopslag leesbaar is.
    const correctieRows = correcties.map(c => `<div class="row sub-i corr"><span class="k">${esc(c.notitie || 'Correctie')} <span class="f">${c.uren > 0 ? '+' : ''}${U.fmtUren(c.uren)}</span></span><span class="v">${U.fmtEuro((c.uren || 0) * inst.uurloon)}<button class="btn-icon xs" data-action="correctie-del" data-id="${c.id}" aria-label="Verwijder correctie">${ICON.kruis}</button></span></div>`).join('');
    let rows = `<div class="row"><span class="k">Salaris <span class="f">${U.fmtUren(uren)} × ${U.fmtEuro(inst.uurloon)}</span></span><span class="v">${U.fmtEuro(salaris)}</span></div>`;
    if (toeslag > 0) rows += `<div class="row toeslag"><span class="k">Zondagtoeslag</span><span class="v">${U.fmtEuro(toeslag)}</span></div>`;
    if (correcties.length) rows += `<div class="row"><span class="k">Correcties <span class="f">${extraUren > 0 ? '+' : '−'}${U.fmtUren(Math.abs(extraUren))}</span></span><span class="v">${U.fmtEuro(extraUren * inst.uurloon)}</span></div>${correctieRows}`;
    rows += `<div class="rule"></div><div class="row bruto"><span class="k">Heffingsgrondslag <span class="f">(bruto zonder reiskosten)</span></span><span class="v">${U.fmtEuro(svBase)}</span></div>`;
    if (netto && inhoudingen > 0) {
      const delen = [['Pensioen', t.pensioen], ['PAWW', t.paww], ['WGA', t.wga], ['Loonheffing (tabel)', t.loonheffingTabel], ['Loonheffing (bijzonder tarief)', t.loonheffingBT]]
        .filter(([, n]) => n > 0)
        .map(([naam, n]) => `<div class="row inhoud sub-i"><span class="k">${naam}</span><span class="v">−${U.fmtEuro(n)}</span></div>`).join('');
      rows += `<details class="row-details"><summary class="row inhoud"><span class="k">Inhoudingen <span class="chev">${ICON.chevR}</span></span><span class="v">−${U.fmtEuro(inhoudingen)}</span></summary>${delen}</details>`;
    }
    if (t.reiskostenTot > 0) rows += `<div class="row"><span class="k">Reiskosten <span class="f">(onbelast)</span></span><span class="v">${U.fmtEuro(t.reiskostenTot)}</span></div>`;
    rows += `<div class="rule"></div><div class="row netto"><span class="k">${netto ? 'Netto' : 'Bruto + reiskosten'}</span><span class="v">${U.fmtEuro(hoofdBedrag)}</span></div>`;

    const heeftInhoud = dagen > 0 || correcties.length > 0;
    const opbouw = `<div class="card">
        <div class="lab">${ICON.euro}Opbouw</div>
        ${heeftInhoud ? `<div class="bd plain">${rows}</div>` : '<p class="leeg-tekst">De opbouw verschijnt zodra je een dag in deze periode invult.</p>'}
        <button class="btn ghost klein" data-action="correctie-nieuw">${ICON.plus}Correctie toevoegen</button>
        ${t.vakantiegeldReservering > 0 ? `<div class="foot">${ICON.slot}Vakantiegeld opgebouwd in deze periode: ${U.fmtEuro(t.vakantiegeldReservering)} (in mei uitbetaald).</div>` : ''}
        ${heeftInhoud ? `<details class="uitleg"><summary>Wat betekenen deze regels?</summary>
          <dl>
            <dt>Heffingsgrondslag</dt><dd>Je brutoloon minus de onbelaste reiskosten. Hierover wordt belasting en premie berekend.</dd>
            <dt>Pensioen</dt><dd>Je eigen bijdrage aan de pensioenregeling.</dd>
            <dt>PAWW</dt><dd>Private Aanvulling WW: verlengt je WW-uitkering als je werkloos wordt.</dd>
            <dt>WGA</dt><dd>Werkhervatting Gedeeltelijk Arbeidsgeschikten: je eigen bijdrage aan de arbeidsongeschiktheidsverzekering.</dd>
            <dt>Loonheffing (tabel)</dt><dd>Belasting over je gewone loon, volgens de maandtabel 2026.</dd>
            <dt>Loonheffing (bijzonder tarief)</dt><dd>Belasting over eenmalige bedragen zoals toeslag, tegen een vast percentage.</dd>
            <dt>Correcties</dt><dd>Uren die los van een dag zijn nabetaald (plus) of teruggevorderd (min).</dd>
          </dl>
        </details>` : ''}
      </div>`;

    const dagRows = res.perDag.slice().sort((a, b) => a.datum.localeCompare(b.datum)).map(d => {
      const dt = new Date(d.datum + 'T00:00:00');
      const ds = state.dagen[d.datum] || {};
      const vak = isVak(ds);
      const allShifts = [{ van: ds.van, tot: ds.tot }].concat(ds.extra || []);
      const tijden = vak ? 'Vakantie' : allShifts.filter(s => s.van && s.tot).map(s => U.fmtBereik(s.van, s.tot)).join(', ');
      const fr = REK.toeslagFractie({ datum: d.datum, zondagToeslag: ds.zondagToeslag != null ? ds.zondagToeslag : undefined }, inst);
      return `<button type="button" class="dag-row${vak ? ' vrij' : ''}" data-action="goto-dag-flash" data-iso="${d.datum}">
        <span class="dr-dt">${U.dagNaam(dt).slice(0, 2)} ${dt.getDate()} ${MAAND_KORT[dt.getMonth()]}${fr > 0 ? ` <span class="dr-tsl">+${Math.round(fr * 100)}%</span>` : ''}</span>
        <span class="dr-tijd">${tijden}</span>
        <span class="dr-loc-t">${vak ? vakantieIcoonHTML() : locatieIcoonHTML(locatieSoort(ds))}</span>
        <span class="dr-uren">${U.fmtUren(d.betaaldeUren)}</span>
        <span class="dr-bedrag">${U.fmtEuro(netto ? d.netto : d.bruto)}</span>
      </button>`;
    }).join('');
    const vakantieDagen = res.perDag.filter(d => d.vakantie).length;
    const dagenCard = dagen ? `<div class="card">
        <div class="lab">${ICON.week}${vakantieDagen ? 'Dagen' : 'Gewerkte dagen'} <span class="lab-extra">${vakantieDagen ? `${dagen - vakantieDagen} gewerkt · ${vakantieDagen} vakantie · ` : `${dagen} · `}${U.fmtUren(uren)}</span></div>
        <div class="dag-list">${dagRows}</div>
      </div>` : `<div class="card leeg">
        <div class="lab">${ICON.week}Gewerkte dagen</div>
        <p class="leeg-tekst">Nog niets ingevuld tussen ${kortDatum(g.start)} en ${kortDatum(g.eind)}. Klik in de kalender op een dag om je werktijden in te vullen.</p>
        <button class="btn" data-action="goto-dag" data-iso="${g.start}">${ICON.week}Naar de kalender</button>
      </div>`;

    return `${paginakopHTML('Loonstrook')}
      <div class="loon-wrap" data-scroll>
        <div class="loon-main">${hero}${opbouw}</div>
        <div class="loon-side">${dagenCard}</div>
      </div>`;
  }

  // ---------- INSTELLINGEN ----------
  // Toont het bedrag met komma (Nederlands); main.js accepteert bij invoer zowel komma als punt.
  function geldVeld(id, val, label) { return `<div class="amount"><span class="e">€</span><input id="${id}" class="amt-in" type="text" inputmode="decimal" value="${Number(val).toFixed(2).replace('.', ',')}" aria-label="${esc(label)}"></div>`; }
  function urenVeld(id, val, label) { return `<div class="amount"><input id="${id}" class="amt-in" type="text" inputmode="decimal" value="${(Math.round(Number(val) * 10) / 10).toFixed(1).replace('.', ',')}" aria-label="${esc(label)}"><span class="e">u</span></div>`; }
  function switchHTML(action, aan) {
    return `<button class="switch ${aan ? 'on' : ''}" data-action="${action}" role="switch" aria-checked="${aan}" aria-label="${aan ? 'Aan' : 'Uit'}"><span class="sw-knob"></span><span class="sw-tekst">${aan ? 'Aan' : 'Uit'}</span></button>`;
  }
  function themaKleurenHTML(i) {
    if (i.thema !== 'aangepast') return '';
    const TOKENS = [['achtergrond', 'Achtergrond', '#EEF1F6'], ['kaart', 'Kaart', '#FFFFFF']];
    const ov = (i.themaOverrides && i.themaOverrides.custom) || {};
    const rows = TOKENS.map(([k, label, def]) => {
      const val = ov[k] || '';
      return `<div class="kleur-row"><span class="kl-sw-prev" style="background:${val || def}"></span><span class="kl-name">${label}</span>
        <input type="color" class="swatch" value="${val || def}" data-action="thema-kleur" data-token="${k}" aria-label="${label}">
        ${val ? `<button class="kl-reset" data-action="thema-kleur-reset" data-token="${k}" aria-label="Herstel ${label}" title="Standaard">${ICON.reset}</button>` : ''}</div>`;
    }).join('');
    return `<div class="custom-kleuren">
      <div class="group-lab" style="margin-top:0">${ICON.droplet}Aangepaste kleuren</div>
      <div class="hint" style="margin-bottom:.6rem">Kies je achtergrond- en kaartkleur. De tekst wordt automatisch leesbaar gekozen. De accentkleur stel je hierboven in.</div>${rows}</div>`;
  }

  function loonSectieHTML(i) {
    const schaal = CAO.schaal(i.schaal);
    const schaalPills = CAO.SCHALEN.map(s => `<button data-action="set-schaal" data-val="${s.nr}" aria-selected="${s.nr === i.schaal}" aria-label="Schaal ${s.nr}">${s.nr}</button>`).join('');
    const tredePills = CAO.treden(i.schaal).map(tr => `<button data-action="set-trede" data-val="${tr}" aria-selected="${tr === i.trede}" aria-label="Trede ${tr}">${tr}</button>`).join('');
    const maandloon = CAO.maandsalaris(i.schaal, i.trede);
    return `<section class="set-sec"><h3 class="set-h">${ICON.euro}Loon</h3>
      <div class="hint">Volgens de CAO Apotheken, salarisschalen per 1 juli 2026.</div>
      <div class="group-lab">Salarisschaal</div>
      <div class="seg full wrap" role="tablist" aria-label="Salarisschaal">${schaalPills}</div>
      <div class="keuze-naam">${esc(schaal ? schaal.naam : '')}</div>
      <div class="group-lab">Trede</div>
      <div class="seg full wrap" role="tablist" aria-label="Trede">${tredePills}</div>
      <div class="uurloon-grid" style="margin-top:.9rem">
        <div class="ul-box net"><span class="ul-l">Bruto per uur</span><span class="ul-v">${U.fmtEuro(i.uurloon)}</span></div>
        <div class="ul-box"><span class="ul-l">Per maand <span class="f">(36 uur)</span></span><span class="ul-v">${maandloon == null ? '–' : U.fmtEuro(maandloon)}</span></div>
      </div>
      <div class="hint" style="margin-top:.5rem">Exclusief vakantiegeld (8%), dat in mei apart wordt uitbetaald.</div>
      <div class="set-row" style="margin-top:.6rem"><div class="info"><div class="name">Reiskosten per kantoordag</div><div class="hint">Onbelaste vergoeding, alleen op dagen op kantoor.</div></div>${geldVeld('set-reis', i.reiskostenPerKantoordag, 'Reiskosten per kantoordag')}</div>
      <div class="set-row"><div class="info"><div class="name">Zondagtoeslag +50%</div><div class="hint">Standaard op zondagen; per zondag aan of uit in de kalender.</div></div>${switchHTML('set-zondagtoeslag', !!i.zondagToeslag)}</div>
      <div class="set-row"><div class="info"><div class="name">Vaste uren per vakantiedag</div><div class="hint">Uit: de app leidt de uren af uit dezelfde weekdag in je eigen dertien weken. Werk je wisselende dagen, dan schat dat te laag.</div></div>${switchHTML('set-vakantie-vast', !!i.vakantieUrenVast)}</div>
      ${i.vakantieUrenVast ? `<div class="set-row"><div class="info"><div class="name">Uren per vakantiedag</div><div class="hint">Een hele week vrij is dan ${U.fmtUren(5 * (Number(i.vakantieUrenPerDag) || 0))} betaald.</div></div>${urenVeld('set-vakantie-uren', i.vakantieUrenPerDag, 'Uren per vakantiedag')}</div>` : ''}
    </section>`;
  }

  function instellingenPage(ctx) {
    const i = ctx.state.instellingen, w = i.standaardWeergave;
    const themaCards = TH.THEMAS.map(t => {
      const prev = themaPreview(t.id, i);
      return `<button class="theme-card ${i.thema === t.id ? 'on' : ''}" data-action="thema" data-val="${t.id}" aria-pressed="${i.thema === t.id}">
        <div class="tc-prev">${prev}</div>
        <span class="tc-l">${THEMA_ICON[t.id] || ICON.palette}${t.label}${ICON.vink}</span></button>`;
    }).join('');
    const accentEq = hex => (i.accent || '').toLowerCase() === hex.toLowerCase();
    const swatches = TH.ACCENTS.map(a => `<button class="sw ${accentEq(a.hex) ? 'on' : ''}" data-action="accent" data-val="${a.hex}" style="background:${a.hex}" aria-label="${a.naam}" title="${a.naam}">${ICON.vink}</button>`).join('')
      + `<label class="sw-custom" title="Eigen kleur">${ICON.pen}<input type="color" value="${i.accent}" data-action="accent-custom" aria-label="Eigen accentkleur"></label>`;

    return `${paginakopHTML('Instellingen')}
      <div class="set-wrap" data-scroll><div class="set-sections">
        ${loonSectieHTML(i)}
        <section class="set-sec"><h3 class="set-h">${ICON.palette}Uiterlijk</h3>
          <div class="group-lab" style="margin-top:0">Thema</div>
          <div class="theme-grid">${themaCards}</div>
          <div class="group-lab">Accentkleur</div>
          <div class="sw-row">${swatches}</div>
          ${themaKleurenHTML(i)}
          <div class="group-lab">Bedragen</div>
          <div class="seg" role="tablist" aria-label="Bedragen"><button data-action="set-weergave" data-val="netto" aria-selected="${w === 'netto'}">Netto</button><button data-action="set-weergave" data-val="bruto" aria-selected="${w === 'bruto'}">Bruto</button></div>
          <div class="hint" style="margin-top:.5rem">Netto is wat je overhoudt na belasting en premies, plus de onbelaste reiskosten.</div>
        </section>
        ${syncSectieHTML(ctx)}
      </div></div>`;
  }
  // Op de telefoon is de zijbalk een onderbalk zonder logo, dus het bolletje naast "Salaris" valt
  // daar weg. Deze sectie zegt in gewone taal hoe de sync ervoor staat - en bij een fout welke
  // code de server gaf. Zonder dat zie je alleen 0 uren en niets dat verklaart waarom.
  function syncSectieHTML(ctx) {
    if (!ctx.syncBeschikbaar) return '';
    return `<section class="set-sec"><h3 class="set-h">${ICON.slot}Synchronisatie</h3>
      <div class="sync-rij">
        <span class="sync-dot" data-staat="${ctx.syncStaat}" aria-hidden="true"></span>
        <span class="sync-status" data-rol="sync-status">${esc(ctx.syncTekst)}</span>
        <button class="btn ghost btn-sync" data-action="sync-nu">Nu synchroniseren</button>
      </div>
      <div class="hint" style="margin-top:.6rem">Je uren staan op dit apparaat en gaan per profiel naar je andere apparaten. Staat hier een fout, dan is je invoer wel bewaard en probeert de app het vanzelf opnieuw.</div>
    </section>`;
  }
  function themaPreview(id, inst) {
    const sets = {
      licht: ['#EEF1F6', '#FFFFFF'], donker: ['#15171F', '#1E212B'], zwart: ['#000000', '#0C0E14'],
    };
    if (id === 'systeem') return `<div class="p-bg" style="background:linear-gradient(135deg,#EEF1F6 50%,#15171F 50%)"></div><div class="p-sf" style="background:linear-gradient(135deg,#FFFFFF 50%,#1E212B 50%)"></div><div class="p-ac" style="background:var(--accent)"></div>`;
    if (id === 'aangepast') {
      const ov = (inst && inst.themaOverrides && inst.themaOverrides.custom) || {};
      return `<div class="p-bg" style="background:${ov.achtergrond || '#EEF1F6'}"></div><div class="p-sf" style="background:${ov.kaart || '#FFFFFF'}"></div><div class="p-ac" style="background:var(--accent)"></div>`;
    }
    const [bg, sf] = sets[id];
    return `<div class="p-bg" style="background:${bg}"></div><div class="p-sf" style="background:${sf}"></div><div class="p-ac" style="background:var(--accent)"></div>`;
  }
  // ---------- PAGINA-SWITCH + SHELL ----------
  function pageHTML(ctx) {
    _renderVersie = ctx.versie || 0;
    switch (ctx.pagina) {
      case 'kalender': return kalenderPage(ctx);
      case 'loonstrook': return loonstrookPage(ctx);
      case 'instellingen': return instellingenPage(ctx);
      default: return overzichtPage(ctx);
    }
  }
  // Plakmodus is een tijdelijke stand van de hele app, geen blok in de pagina: de balk zweeft
  // boven de inhoud (zoals de melding) zodat de kalender zijn volle breedte houdt.
  function shellHTML(ctx) {
    const plakbalk = ctx.klembord ? `<div class="plakbalk" role="status">
        <span class="pb-ic">${ICON.kopie}</span>
        <span class="pb-t"><b>${U.dagDatum(new Date(ctx.klembord.iso + 'T00:00:00'))}</b> gekopieerd
          <span class="pb-s">Klik de dagen aan waar deze werktijden op moeten</span></span>
        <button class="btn" data-action="klembord-klaar">Klaar</button>
      </div>` : '';
    return `<aside class="sb">${sidebarHTML(ctx)}</aside><main id="content" class="content${ctx.binnenkomst ? ' in' : ''}${ctx.klembord ? ' plakt' : ''}">${pageHTML(ctx)}</main>${plakbalk}`;
  }

  // ---------- DAG-DETAIL ----------
  function voortgangHTML(b, ctx) {
    const isVandaag = b.iso === ctx.vandaagIso;
    const geldig = U.parseTime(b.tot) > U.parseTime(b.van);
    if (!isVandaag || !geldig) return '';
    const shifts = [{ van: b.van, tot: b.tot }, ...(b.extra || [])];
    const v = UR.voortgangShifts(shifts, ctx.nuMin);
    const bezig = v.status === 'bezig' || v.status === 'pauze';
    const meta = v.status === 'voor' ? `begint om ${U.fmtTijd(v.eersteVan)}`
      : v.status === 'klaar' ? 'werkdag klaar'
      : v.status === 'pauze' ? `pauze · volgende dienst om ${U.fmtTijd(v.volgendeVan)}`
      : `<b>${Math.round(v.pct)}%</b> · nog ${resterend(v.resterendeMin)} tot ${U.fmtTijd(v.huidigeTot)}`;
    return `<div class="card prog-card">
      <div class="prog-meta" style="margin-bottom:.4rem"><span class="lab" style="margin:0">Vandaag</span>${bezig ? '<span class="live"><span class="pd"></span>Bezig</span>' : ''}</div>
      <div class="track"><div class="fill" style="width:${v.pct}%"></div></div>
      <div class="prog-meta" style="margin-top:.4rem"><span>${meta}</span></div></div>`;
  }

  const bewerkAlsDag = b => ({ datum: b.iso, van: b.van, tot: b.tot, extra: b.extra, locatie: b.locatie, zondagToeslag: b.zondagToeslag });
  const urenTekst = u => (Math.round(u * 10) / 10).toFixed(1).replace('.0', '').replace('.', ',') + ' uur';

  // "8,5 uur op de klok · 8 uur betaald (½ uur pauze)" - wat de ingevulde tijden betekenen, in gewone taal.
  function samenvattingHTML(b) {
    const geldig = U.parseTime(b.tot) > U.parseTime(b.van);
    if (!geldig) return '';
    const dag = bewerkAlsDag(b);
    const dd = REK.dagBruto(dag, { uurloon: 0, reiskostenPerKantoordag: 0 });
    const aantal = 1 + (b.extra || []).length;
    let uitleg;
    if (aantal > 1) uitleg = `${aantal} blokken, samen ${urenTekst(dd.betaaldeUren)} betaald`;
    else if (dd.betaaldeUren < dd.klokuren) uitleg = `${urenTekst(dd.klokuren)} op de klok · ${urenTekst(dd.betaaldeUren)} betaald (½ uur pauze eraf)`;
    else uitleg = `${urenTekst(dd.betaaldeUren)} betaald, geen pauze eraf (korter dan 5½ uur)`;
    return `<div class="tijd-samenvatting">${uitleg}${REK.gemengd(dag) ? ` · ${locatieSplitTekst(dag)}` : ''}</div>`;
  }
  // Waarom je wel of geen reiskosten krijgt - de enige regel die bij een gemengde dag echt
  // uitleg nodig heeft: de vergoeding hangt aan de rit, dus één keer per dag.
  function reiskostenUitlegHTML(b, inst) {
    const dag = bewerkAlsDag(b);
    const bedrag = U.fmtEuro(inst.reiskostenPerKantoordag);
    if (!REK.opKantoor(dag)) return `<div class="hint">Helemaal thuis gewerkt, dus geen reiskosten voor deze dag.</div>`;
    if (REK.gemengd(dag)) return `<div class="hint">Je bent op kantoor geweest: <b>${bedrag} reiskosten</b>. Die krijg je één keer per dag, ook als je maar een deel op kantoor werkte.</div>`;
    return `<div class="hint">Op kantoor gewerkt: <b>${bedrag} reiskosten</b> voor deze dag.</div>`;
  }

  // Deze ene dag meegerekend in zijn eigen loonperiode (zoals de loonstrook doet): geeft zowel
  // wat de dag oplevert als waar de periode mét deze dag op uitkomt.
  function dagInPeriode(state, b) {
    const p = PER.periodeVoorDatum(b.iso);
    const overige = dagenInPeriode(state, p.jaar, p.maand).filter(d => d.datum !== b.iso);
    const correcties = (state.correcties && state.correcties[PER.sleutel(p.jaar, p.maand)]) || [];
    const extraUren = correcties.reduce((s, c) => s + (c.uren || 0), 0);
    const res = REK.maandReken(overige.concat([bewerkAlsDag(b)]), state.instellingen, { extraUren });
    return { dag: res.perDag.find(d => d.datum === b.iso) || null, totalen: res.totalen };
  }

  // Wat de dag oplevert: één bedrag met de som eronder, geen boekhouding.
  // Wat de dag oplevert: het bedrag groot, de opbouw als één balk in plaats van een bonnetje, en
  // daaronder wat deze dag met je periode doet - de reden om 'm nu meteen in te vullen.
  function resultaatHTML(b, ctx) {
    _renderVersie = ctx.versie || 0; // ook bereikbaar via patches buiten pageHTML; houd de cache-sleutel actueel
    const { state, weergave } = ctx;
    const inst = state.instellingen;
    if (U.parseTime(b.tot) <= U.parseTime(b.van)) return `<div class="resultaat leeg"><span class="lab">Deze dag levert op</span><span class="res-hint">Vul eerst een geldige werktijd in.</span></div>`;

    const netto = weergave === 'netto';
    const dd = REK.dagBruto(bewerkAlsDag(b), inst);
    const bruto = dd.basisloon + dd.toeslag + dd.reiskosten;
    const { dag, totalen } = dagInPeriode(state, b);
    const bedrag = netto ? (dag ? dag.netto : 0) : bruto;

    // Segmenten over het brutobedrag: wat je overhoudt aan loon, de onbelaste reiskosten, en
    // wat eraf gaat. In brutoweergave valt het laatste segment weg.
    const inhouding = netto ? Math.max(0, bruto - bedrag) : 0;
    const loondeel = bedrag - dd.reiskosten;
    const pct = n => bruto > 0 ? (n / bruto * 100).toFixed(2) : 0;
    const segment = [
      ['loon', netto ? 'Loon' : 'Loon' + (dd.toeslag > 0 ? ' + toeslag' : ''), loondeel],
      ['reis', 'Reiskosten', dd.reiskosten],
      ['af', 'Ingehouden', inhouding],
    ].filter(([, , n]) => n > 0.005);
    const balk = segment.map(([k, , n]) => `<span class="rb ${k}" style="width:${pct(n)}%"></span>`).join('');
    const legenda = segment.map(([k, naam, n]) => `<li class="${k}">${naam} <b>${U.fmtEuro(n)}</b></li>`).join('');

    // De haak: deze dag telt op bij de periode, en je ziet hoe dichtbij de volgende ronde grens is.
    const periodeTot = netto ? totalen.nettoTot : totalen.brutoTot;
    const mijl = mijlpaalHTML(periodeTot, '');

    return `<div class="resultaat">
      <span class="lab">Deze dag levert op</span>
      <span class="res-bedrag">${U.fmtEuro(bedrag)}<small>${netto ? 'netto' : 'bruto'}</small></span>
      <div class="res-balk" role="img" aria-label="${segment.map(([, naam, n]) => `${naam} ${U.fmtEuro(n)}`).join(', ')}">${balk}</div>
      <ul class="res-leg">${legenda}</ul>
      <div class="res-groei">
        <span class="rg-regel">Hiermee staat deze periode op <b>${U.fmtEuro(periodeTot)}</b></span>
        ${mijl}
      </div>
    </div>`;
  }

  // Native tijd-invoer: typbaar én op mobiel de OS-tijdkiezer. Compact, geen popup-groei.
  function tijdVeldHTML(idx, veld, waarde) {
    return `<input class="tv-in" type="time" step="60" value="${waarde}" data-action="tijd" data-veld="${veld}" data-idx="${idx}"
      aria-label="${veld === 'van' ? 'Begintijd' : 'Eindtijd'} dienst ${idx + 1}">`;
  }

  // Eén blok is één rij: van, tot en waar je zat, naast elkaar. De locatie hoort bij het blok en
  // niet bij de dag, zodat 9:00–12:00 kantoor en 16:00–18:00 thuis gewoon één dag is.
  function locKeuzeHTML(idx, gekozen) {
    const knop = (val, icoon, label) => `<button data-action="loc" data-idx="${idx}" data-val="${val}" aria-selected="${gekozen === val}">${icoon}<span>${label}</span></button>`;
    return `<div class="seg loc-seg" role="tablist" aria-label="Waar werkte je in blok ${idx + 1}">
      ${knop('kantoor', ICON.kantoor, 'Kantoor')}${knop('thuis', ICON.thuis, 'Thuis')}</div>`;
  }
  function shiftSectieHTML(b) {
    const shifts = REK.blokken(bewerkAlsDag(b));
    const meer = shifts.length > 1;
    // Alleen het eerste blok draagt de kolomkoppen; de velden zelf houden hun aria-label.
    const veld = (kop, i, inhoud) => `<label class="tv-lab${i ? ' kaal' : ''}">${i ? '' : kop}${inhoud}</label>`;
    const rows = shifts.map((sh, i) => `<div class="blok" data-shift-idx="${i}">
        ${meer ? `<div class="blok-kop"><span class="blok-nr">Blok ${i + 1}</span>${i > 0 ? `<button class="btn-icon" data-action="shift-del" data-idx="${i - 1}" aria-label="Verwijder blok ${i + 1}">${ICON.kruis}</button>` : ''}</div>` : ''}
        <div class="blok-rij">
          ${veld('Van', i, tijdVeldHTML(i, 'van', sh.van))}
          ${veld('Tot', i, tijdVeldHTML(i, 'tot', sh.tot))}
          <div class="tv-lab${i ? ' kaal' : ''}">${i ? '' : 'Waar'}${locKeuzeHTML(i, sh.locatie === 'kantoor' ? 'kantoor' : 'thuis')}</div>
        </div>
      </div>`).join('');
    return rows + (shifts.length < 3 ? `<button class="btn ghost klein" data-action="shift-add">${ICON.plus}Nog een blok toevoegen</button>` : '');
  }

  function toeslagSectieHTML(b, ctx) {
    const inst = ctx.state.instellingen;
    if (new Date(b.iso + 'T00:00:00').getDay() !== 0) return ''; // alleen zondag
    const aan = b.zondagToeslag != null ? b.zondagToeslag : !!inst.zondagToeslag;
    return `<div class="sec">
      <div class="set-row" style="border:0;padding:0">
        <div class="info"><div class="name">Zondagtoeslag +50%</div>
          <div class="hint">Je krijgt de helft extra per uur.</div></div>
        ${switchHTML('dag-zondagtoeslag', aan)}
      </div></div>`;
  }

  function correctieEditorHTML(ctx) {
    const { jaar, maand } = ctx.zicht;
    return `<div class="sheet" role="dialog" aria-modal="true" aria-label="Correctie toevoegen" tabindex="-1" autofocus>
      <div class="sh-head"><div><div class="t">Correctie toevoegen</div><span class="chip">Salaris ${MAAND[maand - 1]} · ${periodeBereik(jaar, maand)}</span></div>
        <button class="x" data-action="sluit" aria-label="Sluiten">${ICON.kruis}</button></div>
      <div class="sec"><div class="lab">${ICON.klok}Uren</div>
        <div class="hint" style="margin-bottom:.5rem">Positief = extra uren die je nog kreeg uitbetaald · negatief = uren die teruggevorderd zijn.</div>
        <input id="correctie-uren" class="amt-in" type="text" inputmode="decimal" placeholder="bijv. 5 of -2,5" aria-label="Uren" style="width:100%">
      </div>
      <div class="sec"><div class="lab">${ICON.pen}Omschrijving</div>
        <textarea class="note-input" id="correctie-notitie" placeholder="Bijv. nabetaling meer-gewerkte uren mei"></textarea>
      </div>
      <div class="actions"><button class="btn primary" data-action="correctie-opslaan">${ICON.vink}Opslaan</button></div>
    </div>`;
  }

  // Laatst ingevulde dag vóór deze - de bron voor "Zelfde als vorige keer".
  function vorigeWerkdag(state, iso) {
    const eerder = Object.keys(state.dagen).filter(k => k < iso && !isVak(state.dagen[k])).sort();
    return eerder.length ? eerder[eerder.length - 1] : null;
  }

  function dagDetailHTML(b, ctx) {
    const { state, vandaagIso } = ctx;
    const dt = new Date(b.iso + 'T00:00:00');
    const isVandaag = b.iso === vandaagIso;
    const bestaat = !!state.dagen[b.iso];
    const geldig = U.parseTime(b.tot) > U.parseTime(b.van);
    const p = PER.periodeVoorDatum(b.iso);
    const betaaldag = PER.grenzen(p.jaar, p.maand).betaaldag;
    const vorige = vorigeWerkdag(state, b.iso);
    return `<div class="sheet dag-sheet" role="dialog" aria-modal="true" aria-label="${bestaat ? 'Werkdag aanpassen' : 'Werkdag toevoegen'}" tabindex="-1" autofocus>
      <div class="sh-head"><div><div class="t">${U.dagNaam(dt)} ${dt.getDate()} ${MAAND[dt.getMonth()]}${isVandaag ? ' <span class="chip">Vandaag</span>' : ''}</div>
          <div class="sh-sub">Telt mee voor het salaris van ${kortDatum(betaaldag)}</div></div>
        <button class="x" data-action="sluit" aria-label="Sluiten">${ICON.kruis}</button></div>
      <div class="sh-cols">
        <div class="sh-col">
          <div class="sec">
            <div class="lab">${ICON.klok}Werktijd
              ${vorige ? `<button class="lab-knop" data-action="dag-vorige">${ICON.kopie}Zelfde als ${kortDatum(vorige)}</button>` : ''}</div>
            <div data-rol="shifts">${shiftSectieHTML(b)}</div>
            <div class="veld-fout" data-rol="tijdfout">${geldig ? '' : 'De eindtijd moet na de begintijd liggen.'}</div>
            <div data-rol="samenvatting">${samenvattingHTML(b)}</div>
            <div data-rol="reiskosten">${reiskostenUitlegHTML(b, state.instellingen)}</div>
          </div>
          <div data-rol="toeslag">${toeslagSectieHTML(b, ctx)}</div>
        </div>
        <div class="sh-col sh-col-resultaat">
          <div class="sh-prog" data-rol="prog">${voortgangHTML(b, ctx)}</div>
          <div data-rol="bd">${resultaatHTML(b, ctx)}</div>
          <div class="sec"><div class="lab">${ICON.pen}Notitie <span class="f">(mag leeg)</span></div>
            <textarea class="note-input" id="notitie" placeholder="Bijv. inval voor een collega">${esc(b.notitie || '')}</textarea></div>
        </div>
      </div>
      <div class="actions"><button class="btn primary" data-action="opslaan" data-rol="opslaan"${geldig ? '' : ' disabled'}>${ICON.vink}Opslaan</button>
        ${bestaat ? `<button class="btn" data-action="dag-kopieer" title="Plak deze werktijden daarna op andere dagen">${ICON.kopie}Kopiëren</button>` : ''}
        ${bestaat ? `<button class="btn danger" data-action="verwijderen">${ICON.prul}Verwijderen</button>` : ''}</div>
    </div>`;
  }

  // ---------- VAKANTIE ----------
  // Je voert een periode in, verder niets. Hoeveel uur een vakantiedag betaald wordt staat bij een
  // nulurencontract nergens vast, dus leidt de app het af uit je eigen weken (zie vakantie.js) en
  // laat het hier zien vóór je opslaat - een bedrag dat je niet kunt narekenen is niets waard.
  const VAK_REDEN = {
    weekend: ['weekenddag', 'weekenddagen'],
    feestdag: ['feestdag', 'feestdagen'],
    bestaat: ['dag met eigen uren', 'dagen met eigen uren'],
    vakantie: ['dag die al vakantie is', 'dagen die al vakantie zijn'],
  };
  function vakantieVoorstelHTML(ctx, form) {
    const { state } = ctx;
    if (!form.van || !form.tot) return `<div class="hint">Kies je eerste en je laatste vakantiedag. De app rekent daarna uit hoeveel uur je betaald krijgt.</div>`;
    if (form.tot < form.van) return `<div class="veld-fout">De laatste dag ligt vóór de eerste dag.</div>`;
    const v = VAK.voorstel(state.dagen, form.van, form.tot, state.instellingen);
    const tel = {};
    v.overgeslagen.forEach(o => { tel[o.reden] = (tel[o.reden] || 0) + 1; });
    const overgeslagen = Object.keys(tel).map(k => `${tel[k]} ${VAK_REDEN[k][tel[k] === 1 ? 0 : 1]}`).join(' · ');
    const voet = overgeslagen ? `<div class="vk-voet">Telt niet mee: ${overgeslagen}.</div>` : '';
    if (!v.aantal) return `<div class="hint">Tussen deze twee dagen zit geen werkdag om vakantie op te schrijven.</div>${voet}`;
    if (v.totaalUren <= 0) {
      return `<div class="veld-fout">De app kan nog geen uren afleiden: in de dertien weken vóór deze vakantie staan geen gewerkte dagen.
        Vul die eerst in, dan weet je meteen waar dit bedrag vandaan komt.</div>${voet}`;
    }
    const rijen = v.regels.map(r => {
      const d = new Date(r.iso + 'T00:00:00');
      return `<li><span>${U.dagNaam(d).slice(0, 2)} ${kortDatum(r.iso)}</span><b>${U.fmtUren(r.uren)}</b></li>`;
    }).join('');
    return `<div class="resultaat">
        <span class="lab">Deze vakantie levert op</span>
        <span class="res-bedrag">${U.fmtEuro(v.totaalUren * state.instellingen.uurloon)}<small>bruto</small></span>
        <div class="vk-som">${v.aantal} vakantiedag${v.aantal === 1 ? '' : 'en'} · ${U.fmtUren(v.totaalUren)} betaald</div>
        <ul class="vk-lijst">${rijen}</ul>
      </div>
      <div class="hint">${v.vast
        ? `Elke vakantiedag telt voor ${U.fmtUren(state.instellingen.vakantieUrenPerDag)}, zoals je in Instellingen hebt gezet.`
        : 'Per dag het gemiddelde van dezelfde weekdag in de dertien weken ervoor, want een nulurencontract kent geen vaste week.'}
        Een schatting dus: staat er straks iets anders op je loonstrook, boek het verschil dan als correctie.</div>
      ${voet}`;
  }
  function vakantieEditorHTML(ctx, form) {
    const kan = !!(form.van && form.tot && form.tot >= form.van) && VAK.voorstel(ctx.state.dagen, form.van, form.tot, ctx.state.instellingen).totaalUren > 0;
    return `<div class="sheet vak-sheet" role="dialog" aria-modal="true" aria-label="Vakantie invoeren" tabindex="-1" autofocus>
      <div class="sh-head"><div><div class="t">Vakantie invoeren</div>
          <div class="sh-sub">Weekenden en feestdagen slaat de app over.</div></div>
        <button class="x" data-action="sluit" aria-label="Sluiten">${ICON.kruis}</button></div>
      <div class="sec"><div class="lab">${ICON.vrij}Van wanneer tot wanneer</div>
        <div class="vk-rij">
          <label class="tv-lab">Eerste dag<input class="tv-in datum" type="date" id="vakantie-van" data-action="vakantie-datum" value="${form.van || ''}" aria-label="Eerste vakantiedag"></label>
          <label class="tv-lab">Laatste dag<input class="tv-in datum" type="date" id="vakantie-tot" data-action="vakantie-datum" value="${form.tot || ''}" aria-label="Laatste vakantiedag"></label>
        </div>
      </div>
      <div class="sec" data-rol="vakantie-voorstel">${vakantieVoorstelHTML(ctx, form)}</div>
      <div class="actions"><button class="btn primary" data-action="vakantie-opslaan" data-rol="vakantie-opslaan"${kan ? '' : ' disabled'}>${ICON.vink}Vakantie opslaan</button></div>
    </div>`;
  }
  // Een vakantiedag heeft niets in te vullen: 'ie laat zien wat 'ie oplevert en kan weg, alleen of
  // in één keer met de hele vakantie eromheen.
  function vakantieDagHTML(iso, ctx) {
    const { state } = ctx;
    const dag = state.dagen[iso] || {};
    const dt = new Date(iso + 'T00:00:00');
    const p = PER.periodeVoorDatum(iso);
    const pd = dagResultaat(state, iso);
    const netto = ctx.weergave === 'netto';
    const reeks = VAK.reeks(state.dagen, iso);
    return `<div class="sheet vak-sheet" role="dialog" aria-modal="true" aria-label="Vakantiedag" tabindex="-1" autofocus>
      <div class="sh-head"><div><div class="t">${U.dagNaam(dt)} ${dt.getDate()} ${MAAND[dt.getMonth()]} <span class="chip">Vakantie</span></div>
          <div class="sh-sub">Telt mee voor het salaris van ${kortDatum(PER.grenzen(p.jaar, p.maand).betaaldag)}</div></div>
        <button class="x" data-action="sluit" aria-label="Sluiten">${ICON.kruis}</button></div>
      <div class="resultaat">
        <span class="lab">Deze dag levert op</span>
        <span class="res-bedrag">${U.fmtEuro(pd ? (netto ? pd.netto : pd.bruto) : 0)}<small>${netto ? 'netto' : 'bruto'}</small></span>
        <div class="vk-som">${U.fmtUren(vakUren(dag))} betaald · geen reiskosten</div>
      </div>
      <div class="hint">Afgeleid van wat je op deze weekdag gemiddeld werkte in de dertien weken ervoor.</div>
      <div class="actions">
        <button class="btn danger" data-action="vakantie-dag-del" data-iso="${iso}">${ICON.prul}Deze dag weghalen</button>
        ${reeks.length > 1 ? `<button class="btn" data-action="vakantie-reeks-del" data-iso="${iso}">${ICON.prul}Hele vakantie (${reeks.length})</button>` : ''}
      </div>
    </div>`;
  }

  function profielKiezerHTML(ctx) {
    const lijst = ctx.profielen || [];
    const kaarten = lijst.map(p => `<button class="profiel-kaart ${ctx.profiel === p.id ? 'on' : ''}" data-action="kies-profiel" data-id="${p.id}">
        <span class="pf-avatar">${initialen(p.naam)}</span>
        <span class="pf-naam">${esc(p.naam)}</span>
        ${ctx.profiel === p.id ? `<span class="pf-vink">${ICON.vink}</span>` : ''}</button>`).join('');
    const sluit = ctx.profiel ? `<button class="x" data-action="sluit" aria-label="Sluiten">${ICON.kruis}</button>` : '';
    return `<div class="sheet profiel-sheet" role="dialog" aria-modal="true" aria-label="Kies profiel" tabindex="-1" autofocus>
      <div class="sh-head"><div><div class="t">Wie ben je?</div></div>${sluit}</div>
      <p class="pf-uitleg">Kies je profiel. Ieder houdt z'n eigen uren bij; je blijft op dit apparaat ingelogd en alles synchroniseert automatisch tussen je apparaten.</p>
      <div class="profiel-grid">${kaarten}</div>
    </div>`;
  }

  function meldingHTML(m) {
    if (!m) return '';
    const knop = m.herstel ? `<button class="meld-undo" data-action="herstel">Ongedaan maken</button>` : '';
    return `<div class="meld ${m.soort || ''}">${esc(m.tekst)}${knop}</div>`;
  }

  return { shellHTML, pageHTML, widgetGallerijHTML, widgetNaam: id => (WIDGETS[id] || {}).naam || id, dagDetailHTML, resultaatHTML, samenvattingHTML, reiskostenUitlegHTML, voortgangHTML, shiftSectieHTML, toeslagSectieHTML, correctieEditorHTML, vakantieEditorHTML, vakantieVoorstelHTML, vakantieDagHTML, profielKiezerHTML, meldingHTML };
});
