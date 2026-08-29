(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory(require('./cao.js'));
  else { root.Salaris = root.Salaris || {}; root.Salaris.opslag = factory(root.Salaris.cao); }
})(typeof self !== 'undefined' ? self : this, function (cao) {
  const KEY = 'salaris-app-v1';
  const ACTIEF_KEY = 'salaris-actief-profiel';
  const PROFIELEN = [{ id: 'thomas', naam: 'Thomas' }, { id: 'aleyna', naam: 'Aleyna' }];
  const sleutelVoor = id => KEY + '::' + id;
  function defaultState() {
    return {
      versie: 1, dagen: {},
      // Correcties: extra uren die niet aan een specifieke dag hangen (bijv. een nabetaling
      // van een vorige, al afgesloten periode). Gekeyed op de periodesleutel "YYYY-MM"
      // (zie periode.js) → array van { id, uren, notitie }.
      correcties: {},
      instellingen: {
        // Uurloon is afgeleid van schaal + trede (CAO Apotheken) en wordt bij elke wijziging en bij laden opnieuw gezet.
        schaal: 5, trede: 4, uurloon: cao.uurloon(5, 4), reiskostenPerKantoordag: 21.20,
        standaardWeergave: 'netto', loonheffingskorting: true,
        thema: 'systeem', accent: '#6C63FF',
        zondagToeslag: false,
        themaOverrides: {},
        overzichtIndeling: 3, // versie van de standaard-indeling; zie migreer()
        // Elke widget heeft een maat: klein (1x1), breed (2x1) of groot (2x2). Standaard staan
        // er vijf aan; `maand`, `vakantiegeld` en `volgende` herhalen wat de salariskaart al
        // zegt en staan uit. Toevoegen kan via de galerij achter het plusje.
        overzichtWidgets: [
          { id: 'voortgang', zicht: true, maat: 'groot' },
          { id: 'reeks', zicht: true, maat: 'groot' },
          { id: 'maanddetail', zicht: true, maat: 'groot' },
          { id: 'binnenkort', zicht: true, maat: 'breed' },
          { id: 'week', zicht: true, maat: 'klein' },
          { id: 'maand', zicht: false, maat: 'klein' },
          { id: 'vakantiegeld', zicht: false, maat: 'klein' },
          { id: 'volgende', zicht: false, maat: 'klein' },
        ],
      },
    };
  }
  // De indelingen die de app zelf ooit heeft uitgedeeld. Komt de opgeslagen lijst hiermee
  // overeen, dan heeft de gebruiker 'm nooit aangeraakt en mag een nieuwe standaard erin.
  const OUDE_STANDAARDEN = [
    ['week', 'maand', 'vakantiegeld', 'volgende', 'voortgang', 'maanddetail', 'binnenkort'],
    ['voortgang', 'reeks', 'maanddetail', 'week', 'maand', 'vakantiegeld', 'volgende', 'binnenkort'],
    ['voortgang', 'reeks', 'maanddetail', 'week', 'binnenkort', 'maand', 'vakantiegeld', 'volgende'],
    ['voortgang', 'reeks', 'maanddetail', 'binnenkort', 'week', 'maand', 'vakantiegeld', 'volgende'],
  ];
  // Oude indelingen kenden alleen `groot: true|false`. Die zetten we om naar de drie maten:
  // wat groot was blijft groot, de rest wordt klein. De volgorde blijft ongemoeid.
  const MATEN = ['klein', 'breed', 'groot'];
  function naarMaten(lijst) {
    if (!Array.isArray(lijst)) return lijst;
    return lijst.map(w => {
      if (!w || typeof w !== 'object') return w;
      const maat = MATEN.indexOf(w.maat) >= 0 ? w.maat : (w.groot ? 'groot' : 'klein');
      return { id: w.id, zicht: w.zicht !== false, maat };
    });
  }
  function isOudeStandaardIndeling(lijst) {
    if (!Array.isArray(lijst)) return true;
    if (lijst.some(w => !w || w.zicht === false)) return false; // iets verborgen = aangepast
    const ids = lijst.map(w => w.id).join(',');
    return OUDE_STANDAARDEN.some(std => std.join(',') === ids);
  }

  function deepMerge(def, src) {
    if (Array.isArray(def)) return Array.isArray(src) ? src : def;
    if (def && typeof def === 'object') {
      const out = {};
      const keys = new Set([...Object.keys(def), ...Object.keys(src && typeof src === 'object' ? src : {})]);
      for (const k of keys) {
        const has = src && typeof src === 'object' && k in src;
        out[k] = has ? deepMerge(def[k], src[k]) : def[k];
      }
      return out;
    }
    return src === undefined ? def : src;
  }
  function migreer(s) {
    if (!s || typeof s !== 'object') return defaultState();
    const oudInst = (s.instellingen && typeof s.instellingen === 'object') ? s.instellingen : {};
    const oudeZo = (oudInst.toeslagen && oudInst.toeslagen.zo) || 0;
    const out = deepMerge(defaultState(), s);
    delete out.gebeurtenissen;
    // `urenkaart` (kopgegevens van de verwijderde Excel-export, incl. BSN/IBAN) wordt niet meer bewaard.
    ['toeslagen', 'lettertype', 'ovKostenAan', 'ovKostenStandaard', 'startAdres', 'kleuren', 'categorieen', 'urenkaart']
      .forEach(k => delete out.instellingen[k]);
    for (const [iso, dag] of Object.entries(out.dagen || {})) {
      const oudeDag = (s.dagen && s.dagen[iso]) || {};
      const isZo = new Date(iso + 'T00:00:00').getDay() === 0;
      const oudeFractie = oudeDag.toeslag != null ? oudeDag.toeslag : oudeZo;
      if (isZo && oudeFractie > 0 && !('zondagToeslag' in oudeDag)) dag.zondagToeslag = true;
      delete dag.toeslag;
      delete dag.ovKosten;
      // De handmatige loonmaand-override is vervangen door de vaste periodegrens (periode.js).
      delete dag.loonmaand;
    }
    const inst = out.instellingen;
    // Overzicht-indeling: alleen vervangen als 'ie nog nooit is aangepast. Wie zelf geordend,
    // verborgen of vergroot heeft, houdt precies wat 'ie had staan.
    if (oudInst.overzichtIndeling !== 3 && isOudeStandaardIndeling(oudInst.overzichtWidgets)) {
      inst.overzichtWidgets = defaultState().instellingen.overzichtWidgets;
    } else {
      inst.overzichtWidgets = naarMaten(inst.overzichtWidgets);
    }
    inst.overzichtIndeling = 3;
    if (!cao.bestaat(inst.schaal, inst.trede)) { inst.schaal = 5; inst.trede = 4; }
    inst.uurloon = cao.uurloon(inst.schaal, inst.trede);
    return out;
  }
  function laad(store) {
    const raw = store.getItem(KEY);
    if (!raw) return defaultState();
    try { return migreer(JSON.parse(raw)); } catch { return defaultState(); }
  }
  function bewaar(store, state) { store.setItem(KEY, JSON.stringify(state)); }
  function actiefProfiel(store) { return store.getItem(ACTIEF_KEY) || null; }
  function zetActief(store, id) { store.setItem(ACTIEF_KEY, id); }
  function laadProfiel(store, id) {
    const raw = store.getItem(sleutelVoor(id));
    if (raw) { try { return migreer(JSON.parse(raw)); } catch { return defaultState(); } }
    // Eenmalige overgang: het eerste profiel erft de oude single-profiel data (van vóór profielen bestonden).
    if (PROFIELEN.length && id === PROFIELEN[0].id) {
      const oud = store.getItem(KEY);
      if (oud) { try { return migreer(JSON.parse(oud)); } catch {} }
    }
    return defaultState();
  }
  function bewaarProfiel(store, id, state) { store.setItem(sleutelVoor(id), JSON.stringify(state)); }
  return { laad, bewaar, migreer, defaultState, KEY, PROFIELEN, ACTIEF_KEY, sleutelVoor, actiefProfiel, zetActief, laadProfiel, bewaarProfiel };
});
