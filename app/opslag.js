(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else { root.Salaris = root.Salaris || {}; root.Salaris.opslag = factory(); }
})(typeof self !== 'undefined' ? self : this, function () {
  const KEY = 'salaris-app-v1';
  const ACTIEF_KEY = 'salaris-actief-profiel';
  const PROFIELEN = [{ id: 'thomas', naam: 'Thomas' }, { id: 'aleyna', naam: 'Aleyna' }];
  const sleutelVoor = id => KEY + '::' + id;
  function defaultState() {
    return {
      versie: 1, dagen: {},
      instellingen: {
        uurloon: 17.98, reiskostenPerKantoordag: 21.62,
        standaardWeergave: 'netto', loonheffingskorting: true,
        thema: 'systeem', accent: '#6C63FF',
        zondagToeslag: false,
        themaOverrides: {},
        urenkaart: { naam: '', adres: '', geboortedatum: '', bsn: '', iban: '', reiskosten: '', contract: '' },
        overzichtWidgets: [
          { id: 'week', zicht: true, groot: false },
          { id: 'maand', zicht: true, groot: false },
          { id: 'vakantiegeld', zicht: true, groot: false },
          { id: 'volgende', zicht: true, groot: false },
          { id: 'voortgang', zicht: true, groot: true },
          { id: 'maanddetail', zicht: true, groot: true },
          { id: 'binnenkort', zicht: true, groot: true },
        ],
      },
    };
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
    ['toeslagen', 'lettertype', 'ovKostenAan', 'ovKostenStandaard', 'startAdres', 'kleuren', 'categorieen']
      .forEach(k => delete out.instellingen[k]);
    for (const [iso, dag] of Object.entries(out.dagen || {})) {
      const oudeDag = (s.dagen && s.dagen[iso]) || {};
      const isZo = new Date(iso + 'T00:00:00').getDay() === 0;
      const oudeFractie = oudeDag.toeslag != null ? oudeDag.toeslag : oudeZo;
      if (isZo && oudeFractie > 0 && !('zondagToeslag' in oudeDag)) dag.zondagToeslag = true;
      delete dag.toeslag;
      delete dag.ovKosten;
    }
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
  function exporteer(state) { return JSON.stringify(state, null, 2); }
  function importeer(tekst) { return migreer(JSON.parse(tekst)); }
  function codeer(state) {
    const json = JSON.stringify(state);
    const b64 = (typeof btoa !== 'undefined') ? btoa(unescape(encodeURIComponent(json))) : Buffer.from(json, 'utf8').toString('base64');
    return 'SAL1:' + b64;
  }
  function decodeer(code) {
    const raw = String(code || '').trim().replace(/^SAL1:/, '');
    const json = (typeof atob !== 'undefined') ? decodeURIComponent(escape(atob(raw))) : Buffer.from(raw, 'base64').toString('utf8');
    return migreer(JSON.parse(json));
  }
  return { laad, bewaar, exporteer, importeer, migreer, defaultState, codeer, decodeer, KEY, PROFIELEN, ACTIEF_KEY, sleutelVoor, actiefProfiel, zetActief, laadProfiel, bewaarProfiel };
});
