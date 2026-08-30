(function () {
  const S = window.Salaris;
  const store = window.localStorage;
  const TH = S.thema;
  const SY = S.sync;
  let profiel = S.opslag.actiefProfiel(store);
  let appState = profiel ? S.opslag.laadProfiel(store, profiel) : S.opslag.defaultState();
  const today = new Date();
  let zicht = { jaar: today.getFullYear(), maand: today.getMonth() + 1 };
  let pagina = 'overzicht';
  let bewerk = null;        // dag-detail
  let klembord = null;      // { iso, data } - gekopieerde dag, klaar om op andere dagen te plakken
  let highlightIso = null;  // tijdelijke flash op kalendercel
  let overzichtBewerk = false; // indeling-bewerkmodus op overzicht
  let profielKiezerVerplicht = false; // eerste keer: profiel kiezen kan niet weggeklikt worden
  let versie = 0;
  let syncStaat = S.sync.configured() ? 'bezig' : 'nvt'; // sync staat altijd aan zodra geconfigureerd; geen wachtwoord meer
  let pushTimer = null, pushPending = null;
  let vakantieForm = null;   // { van, tot } - de lopende invoer in de vakantie-dialoog

  // Staat het apparaat op AM/PM, dan zijn de tijdvelden breder nodig ("09:00 AM" past niet in
  // de ruimte die "09:00" vraagt). De CSS leest deze klasse; de opgeslagen tijden blijven 24-uurs.
  document.documentElement.classList.toggle('klok12', S.util.klok12());

  const appEl = document.getElementById('app');
  const ovlEl = document.getElementById('overlay');
  const meldEl = document.getElementById('melding');
  const mqDark = window.matchMedia('(prefers-color-scheme: dark)');

  const nuMin = () => { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); };
  const profielNaam = () => { const p = S.opslag.PROFIELEN.find(x => x.id === profiel); return p ? p.naam : ''; };
  const ctx = () => ({ state: appState, weergave: appState.instellingen.standaardWeergave || 'netto', zicht, pagina, vandaagIso: S.util.isoDate(new Date()), nuMin: nuMin(), highlightIso, klembord, overzichtBewerk, versie, profiel, profielen: S.opslag.PROFIELEN, profielNaam: profielNaam(), syncBeschikbaar: SY.configured(), syncStaat, syncTekst: syncTekstVan(syncStaat) });
  const bewaar = () => {
    versie++;
    if (!profiel) return;
    const nu = new Date().toISOString();
    zetTsLokaal(profiel, nu);
    S.opslag.bewaarProfiel(store, profiel, appState);
    syncPush(profiel, nu);
  };
  function openProfielKiezer(verplicht) { profielKiezerVerplicht = !!verplicht; openOverlay(S.ui.profielKiezerHTML(ctx())); }
  let melding = null, meldTimer = 0, meldWeg = 0;
  function meld(tekst, opties) {
    clearTimeout(meldTimer); clearTimeout(meldWeg);
    melding = { tekst, soort: (opties && opties.soort) || '', herstel: (opties && opties.herstel) || null };
    meldEl.innerHTML = S.ui.meldingHTML(melding);
    // Kort genoeg om niet in de weg te zitten; met "Ongedaan maken" iets langer, want dat moet je
    // nog kunnen lezen en aanklikken.
    meldTimer = setTimeout(sluitMelding, melding.herstel ? 5000 : 2400);
  }
  // Eerst uit beeld schuiven, dan pas weghalen: verdwijnen zonder animatie voelt als een storing.
  function sluitMelding() {
    clearTimeout(meldTimer); clearTimeout(meldWeg);
    const el = meldEl.firstElementChild;
    melding = null;
    if (!el) { meldEl.innerHTML = ''; return; }
    el.classList.add('weg');
    meldWeg = setTimeout(() => { meldEl.innerHTML = ''; }, 200);
  }
  // Eén korte uitbarsting bij een mijlpaal - het enige moment waarop de app luidruchtig is.
  // Wie beweging heeft uitgezet krijgt alleen de melding.
  function vierFeest() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const host = document.createElement('div');
    host.className = 'snippers'; host.setAttribute('aria-hidden', 'true');
    const kleuren = ['var(--accent)', 'var(--verdiend)', 'var(--sun)', 'var(--note)'];
    for (let i = 0; i < 30; i++) {
      const snipper = document.createElement('i');
      snipper.style.setProperty('--x', (Math.random() * 100).toFixed(1) + 'vw');
      snipper.style.setProperty('--vt', (Math.random() * 0.4).toFixed(2) + 's');
      snipper.style.setProperty('--dr', Math.round(Math.random() * 720 - 360) + 'deg');
      snipper.style.setProperty('--zw', (0.8 + Math.random() * 0.9).toFixed(2));
      snipper.style.setProperty('--k', kleuren[i % kleuren.length]);
      host.appendChild(snipper);
    }
    document.body.appendChild(host);
    setTimeout(() => host.remove(), 2800);
  }
  // Netto van een loonperiode, los van de render-memo in ui.js - nodig om vóór en ná een
  // wijziging te kunnen vergelijken en zo een gepasseerde mijlpaal te herkennen.
  function periodeNetto(p) {
    const sleutel = S.periode.sleutel(p.jaar, p.maand);
    const dagen = Object.entries(appState.dagen)
      .filter(([iso]) => S.periode.sleutelVoorDatum(iso) === sleutel && !S.feestdagen.isFeestdag(iso))
      .map(([iso, d]) => ({ ...d, datum: iso }));
    const correcties = (appState.correcties && appState.correcties[sleutel]) || [];
    const extraUren = correcties.reduce((s, c) => s + (c.uren || 0), 0);
    return S.reken.maandReken(dagen, appState.instellingen, { extraUren }).totalen.nettoTot;
  }

  // ---------- cloud-sync (versleuteld, per profiel) ----------
  const TS_KEY = 'salaris-sync-ts';
  function tsLokaal(id) { try { return (JSON.parse(localStorage.getItem(TS_KEY) || '{}'))[id] || null; } catch { return null; } }
  function zetTsLokaal(id, ts) { let m = {}; try { m = JSON.parse(localStorage.getItem(TS_KEY) || '{}'); } catch {} m[id] = ts; localStorage.setItem(TS_KEY, JSON.stringify(m)); }
  function profielHeeftData(st) { return !!(st && st.dagen && Object.keys(st.dagen).length); }
  function syncTekstVan(s) {
    return s === 'ok' ? 'Gesynchroniseerd met de cloud.'
      : s === 'bezig' ? 'Synchroniseren…'
      : s === 'offline' ? 'Offline. Lokaal opgeslagen, synct later vanzelf.'
      : '';
  }
  function syncStatus(s) {
    syncStaat = s;
    const dot = document.querySelector('.sync-dot');
    if (dot) { dot.dataset.staat = s; const t = syncTekstVan(s); dot.title = t; dot.setAttribute('aria-label', t); }
  }
  function syncPush(id, ts, snapshot) {
    if (!SY.configured()) return;
    pushPending = { id, ts, state: snapshot || appState };
    clearTimeout(pushTimer);
    pushTimer = setTimeout(async () => {
      const job = pushPending; pushPending = null; if (!job) return;
      try { await SY.push(job.id, job.state, job.ts); syncStatus('ok'); }
      catch (e) { const wasOffline = syncStaat === 'offline'; syncStatus('offline'); if (!wasOffline) meld('Offline. Lokaal opgeslagen, synct later vanzelf.'); }
    }, 800);
  }
  async function syncPull(id) {
    if (!SY.configured() || id !== profiel) return;
    let res;
    try { res = await SY.pull(id); }
    catch (e) { syncStatus('offline'); return; }
    if (id !== profiel) return; // tijdens het wachten van profiel gewisseld
    // Geen bruikbare cloud-state (lege tabel, of onleesbare rij uit het oude wachtwoord-tijdperk):
    // duw lokale data omhoog zodat 'ie opnieuw met de app-sleutel versleuteld wordt.
    if (res === null || res.decryptFailed) {
      if (profielHeeftData(appState)) { const ts = tsLokaal(id) || new Date().toISOString(); zetTsLokaal(id, ts); syncPush(id, ts); }
      syncStatus('ok'); return;
    }
    const lokaal = tsLokaal(id);
    // Nooit eerder gesynct op dit apparaat: de cloud wint zodra daar dagen staan. Lokale data
    // zonder sync-stempel is niet te vertrouwen als bron voor dit profiel (ze kan van de oude
    // single-profiel opslag geërfd zijn) en mag de gedeelde cloud-versie nooit overschrijven.
    const adopt = lokaal
      ? (new Date(res.updatedAt) > new Date(lokaal))
      : (profielHeeftData(res.state) || !profielHeeftData(appState));
    if (adopt) {
      appState = res.state;
      zetTsLokaal(id, res.updatedAt); S.opslag.bewaarProfiel(store, id, appState);
      versie++; pasToeUiterlijk(); renderApp();
    } else {
      const ts = tsLokaal(id) || new Date().toISOString(); zetTsLokaal(id, ts); syncPush(id, ts);
    }
    syncStatus('ok');
  }
  function naProfiel() {
    if (!SY.configured()) return;
    syncStaat = 'bezig'; syncPull(profiel);
  }
  function widgetCfg(id) {
    const arr = appState.instellingen.overzichtWidgets || (appState.instellingen.overzichtWidgets = []);
    let w = arr.find(x => x.id === id);
    if (!w) { w = { id, zicht: true, maat: 'klein' }; arr.push(w); }
    if (!w.maat) w.maat = w.groot ? 'groot' : 'klein';
    return w;
  }
  // Van het overzicht halen, waar je ook op klikt of naartoe sleept: altijd terug te draaien.
  function verwijderWidget(id) {
    const w = widgetCfg(id);
    if (!w.zicht) return;
    herschik(() => { w.zicht = false; });
    meld(`${S.ui.widgetNaam(id)} van je overzicht gehaald`, { herstel: () => { w.zicht = true; } });
  }
  // Vloeiend herschikken (FLIP): onthoud waar elke widget stond, muteer, render, en laat ze
  // van hun oude plek naar de nieuwe glijden. Zonder dit springt het raster hard.
  let nieuweWidget = null;
  function herschik(muteer) {
    const grid = document.querySelector('[data-rol="ov-grid"]');
    const stil = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const voor = new Map();
    if (grid && !stil) grid.querySelectorAll('.ov-w[data-id]').forEach(el => voor.set(el.dataset.id, el.getBoundingClientRect()));
    muteer();
    bewaar();
    renderContent();
    if (stil) return;
    const na = document.querySelector('[data-rol="ov-grid"]');
    if (!na) return;
    na.querySelectorAll('.ov-w[data-id]').forEach(el => {
      const oud = voor.get(el.dataset.id);
      if (!oud) { // nieuw op het raster: laat 'm opkomen i.p.v. verschijnen
        el.animate([{ opacity: 0, transform: 'scale(.9)' }, { opacity: 1, transform: 'none' }],
          { duration: 240, easing: 'cubic-bezier(.2,.8,.2,1)' });
        return;
      }
      const nu = el.getBoundingClientRect();
      const dx = oud.left - nu.left, dy = oud.top - nu.top;
      if (!dx && !dy) return;
      el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }],
        { duration: 260, easing: 'cubic-bezier(.2,.8,.2,1)' });
    });
  }

  function luminantie(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || ''); if (!m) return 1;
    const n = parseInt(m[1], 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  }
  const THEMA_TOKENS = ['--bg', '--surf', '--surf2', '--text', '--muted', '--faint', '--border', '--border-2', '--accent-tekst', '--verdiend-tekst'];
  function pasToeUiterlijk() {
    const inst = appState.instellingen;
    const root = document.documentElement;
    const actiefThema = TH.resolve(inst.thema, mqDark.matches);
    // Eerst alle inline thema-overrides wissen, zodat een vorig (bv. custom) thema niet doorlekt.
    THEMA_TOKENS.forEach(p => root.style.removeProperty(p));
    root.dataset.theme = actiefThema;
    root.style.setProperty('--accent', inst.accent);
    root.style.setProperty('--accent-ink', luminantie(inst.accent) > 0.62 ? '#15171F' : '#FFFFFF');
    root.style.setProperty('--verdiend', inst.accent);
    const ov = (inst.themaOverrides && inst.themaOverrides[actiefThema]) || {};
    const MAP = { achtergrond: '--bg', kaart: '--surf', tekst: '--text', rand: '--border' };
    Object.keys(MAP).forEach(k => { if (ov[k]) root.style.setProperty(MAP[k], ov[k]); });
    root.style.colorScheme = (actiefThema === 'dark' || actiefThema === 'black') ? 'dark' : 'light';
    // Aangepast thema: leid leesbare tekst-/randkleuren (en color-scheme) af van de gekozen achtergrond.
    if (actiefThema === 'custom') {
      const donker = luminantie(ov.achtergrond || '#EEF1F6') < 0.5;
      root.style.colorScheme = donker ? 'dark' : 'light';
      // Kleine tekst in accent/verdiend haalt alleen contrast als 'ie tegen de achtergrond in beweegt.
      const mengsel = pct => `color-mix(in srgb, var(--accent) ${pct}%, ${donker ? '#fff' : '#000'})`;
      root.style.setProperty('--accent-tekst', mengsel(donker ? 62 : 86));
      root.style.setProperty('--verdiend-tekst', mengsel(donker ? 62 : 86));
      root.style.setProperty('--text', donker ? '#F1F4FA' : '#19202E');
      root.style.setProperty('--muted', donker ? '#AEB6C8' : '#586074');
      root.style.setProperty('--faint', donker ? '#7B8398' : '#929BAD');
      root.style.setProperty('--surf2', ov.kaart || ov.achtergrond || '#F3F5FA');
      root.style.setProperty('--border', donker ? 'rgba(255,255,255,.12)' : 'rgba(20,26,42,.09)');
      root.style.setProperty('--border-2', donker ? 'rgba(255,255,255,.2)' : 'rgba(20,26,42,.14)');
    }
  }
  mqDark.addEventListener('change', () => {
    if (appState.instellingen.thema === 'systeem') { pasToeUiterlijk(); if (pagina === 'instellingen' && !ovlEl.open) renderContent(); }
  });

  // Beweging alleen bij een échte overgang: binnenkomst op een pagina (renderApp met
  // `binnenkomst`) of wisselen van maand/periode (renderContent met `wissel`). Herrenders om
  // data - opslaan, schakelaar, de minuutklok - animeren niet.
  const renderApp = (opties = {}) => { appEl.className = 'shell'; appEl.innerHTML = S.ui.shellHTML({ ...ctx(), binnenkomst: !!opties.binnenkomst }); };
  const herstartAnimatie = el => { el.classList.remove('in'); void el.offsetWidth; el.classList.add('in'); };
  const renderContent = (opties = {}) => {
    const c = document.getElementById('content'); if (!c) return;
    const oudScroll = c.querySelector('[data-scroll]');
    const y = oudScroll ? oudScroll.scrollTop : 0;
    const cy = c.scrollTop;
    c.innerHTML = S.ui.pageHTML(ctx());
    const nieuwScroll = c.querySelector('[data-scroll]');
    if (nieuwScroll) nieuwScroll.scrollTop = y;
    c.scrollTop = cy;
    if (opties.wissel) herstartAnimatie(c);
  };
  // Tijdelijke oplichting van een kalendercel weghalen zonder de hele pagina opnieuw te tekenen.
  function wisFlash() {
    highlightIso = null;
    const cel = document.querySelector('.c.flash'); if (cel) cel.classList.remove('flash');
  }
  // Schakelaar ter plekke omzetten, zodat de knop zichtbaar schuift i.p.v. vervangen wordt.
  function patchSwitch(knop, aan) {
    knop.classList.toggle('on', aan);
    knop.setAttribute('aria-checked', String(aan));
    knop.setAttribute('aria-label', aan ? 'Aan' : 'Uit');
    const tekst = knop.querySelector('.sw-tekst'); if (tekst) tekst.textContent = aan ? 'Aan' : 'Uit';
  }
  const openOverlay = html => { ovlEl.innerHTML = html; ovlEl.showModal(); };
  const closeOverlay = () => ovlEl.close();
  ovlEl.addEventListener('close', () => {
    ovlEl.innerHTML = ''; bewerk = null; vakantieForm = null;
    renderContent();
    if (nieuweWidget) {
      const el = document.querySelector(`.ov-w[data-id="${nieuweWidget}"]`);
      nieuweWidget = null;
      if (el && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        el.animate([{ opacity: 0, transform: 'scale(.88)' }, { opacity: 1, transform: 'none' }],
          { duration: 300, easing: 'cubic-bezier(.2,.8,.2,1)' });
      }
    }
  });
  // Verplichte profielkeuze mag niet met Escape of via de achtergrond weg.
  ovlEl.addEventListener('cancel', e => { if (profielKiezerVerplicht) e.preventDefault(); });

  // ---------- dag-detail ----------
  // Elk blok krijgt bij het openen een expliciete locatie. Een oud blok zonder eigen locatie
  // erft die van de dag; daarna volgt het niet meer stilzwijgend blok 1 als je dat omzet.
  function blokkenUit(d) {
    return (d.extra || []).map(e => ({ van: e.van, tot: e.tot, locatie: e.locatie || d.locatie || 'kantoor' }));
  }
  function openDag(iso) {
    const d = appState.dagen[iso] || { van: '09:00', tot: '17:30', locatie: 'kantoor', notitie: '' };
    bewerk = { iso, van: d.van, tot: d.tot, extra: blokkenUit(d), locatie: d.locatie || 'kantoor', notitie: d.notitie || '', zondagToeslag: d.zondagToeslag != null ? d.zondagToeslag : null };
    openOverlay(S.ui.dagDetailHTML(bewerk, ctx()));
  }
  // Plakt de gekopieerde dag (klembord) op iso; blijft in plak-modus zodat meerdere dagen achter elkaar geplakt kunnen worden.
  function plakOpDag(iso) {
    const vorige = appState.dagen[iso];
    appState.dagen[iso] = { ...klembord.data };
    bewaar();
    highlightIso = iso;
    renderContent();
    meld(`Geplakt op ${S.util.dagDatum(new Date(iso + 'T00:00:00'))}`, { herstel: () => { if (vorige) appState.dagen[iso] = vorige; else delete appState.dagen[iso]; } });
    setTimeout(wisFlash, 1600);
  }
  // ---------- vakantie ----------
  function openVakantie() {
    const vandaag = S.util.isoDate(new Date());
    vakantieForm = { van: vandaag, tot: vandaag };
    openOverlay(S.ui.vakantieEditorHTML(ctx(), vakantieForm));
  }
  function openVakantieDag(iso) { bewerk = null; openOverlay(S.ui.vakantieDagHTML(iso, ctx())); }
  function patchVakantie() {
    if (!vakantieForm) return;
    const vak = ovlEl.querySelector('[data-rol="vakantie-voorstel"]');
    if (vak) vak.innerHTML = S.ui.vakantieVoorstelHTML(ctx(), vakantieForm);
    const knop = ovlEl.querySelector('[data-rol="vakantie-opslaan"]');
    if (knop) {
      const v = S.vakantie.voorstel(appState.dagen, vakantieForm.van, vakantieForm.tot);
      knop.disabled = !(v.aantal && v.totaalUren > 0);
    }
  }
  // Verwijdert een reeks vakantiedagen in één keer, met dezelfde herstel-melding als één dag.
  function verwijderVakantie(isos, tekst) {
    const vorige = {};
    isos.forEach(iso => { vorige[iso] = appState.dagen[iso]; delete appState.dagen[iso]; });
    bewaar();
    meld(tekst, { herstel: () => { Object.keys(vorige).forEach(iso => { appState.dagen[iso] = vorige[iso]; }); } });
    closeOverlay();
  }
  function syncNotitie() { const t = ovlEl.querySelector('#notitie'); if (t && bewerk) bewerk.notitie = t.value; }
  function patchVoortgang() {
    if (!bewerk) return;
    const wrap = ovlEl.querySelector('[data-rol="prog"]');
    if (wrap) wrap.innerHTML = S.ui.voortgangHTML(bewerk, ctx());
  }
  function patchGeldigheid() {
    const geldig = S.util.parseTime(bewerk.tot) > S.util.parseTime(bewerk.van);
    const fout = ovlEl.querySelector('[data-rol="tijdfout"]'); if (fout) fout.textContent = geldig ? '' : 'De eindtijd moet na de begintijd liggen.';
    const opsla = ovlEl.querySelector('[data-rol="opslaan"]'); if (opsla) opsla.disabled = !geldig;
  }
  // Werkt alles bij wat van tijden/locatie/toeslag afhangt, zonder de tijdvelden te vervangen (behoud focus).
  function patchAfgeleid() {
    if (!bewerk) return;
    const zet = (rol, html) => { const el = ovlEl.querySelector(`[data-rol="${rol}"]`); if (el) el.innerHTML = html; };
    zet('samenvatting', S.ui.samenvattingHTML(bewerk));
    zet('reiskosten', S.ui.reiskostenUitlegHTML(bewerk, appState.instellingen));
    zet('bd', S.ui.resultaatHTML(bewerk, ctx()));
    patchGeldigheid();
    patchVoortgang();
  }
  // Bouwt ook de blokkenlijst opnieuw op (na blok toevoegen/verwijderen of locatie wisselen).
  function patchDag() {
    if (!bewerk) return;
    const shiftsSec = ovlEl.querySelector('[data-rol="shifts"]');
    if (shiftsSec) shiftsSec.innerHTML = S.ui.shiftSectieHTML(bewerk);
    patchAfgeleid();
  }
  // Bouwt het opslaanbare dag-object uit de lopende bewerking (gebruikt door zowel opslaan als kopiëren).
  function dagDataUitBewerk() {
    const dagData = { van: bewerk.van, tot: bewerk.tot, locatie: bewerk.locatie, notitie: bewerk.notitie };
    if (bewerk.extra && bewerk.extra.length) {
      const geldig = bewerk.extra.filter(e => S.util.parseTime(e.tot) > S.util.parseTime(e.van));
      if (geldig.length) dagData.extra = geldig.map(e => ({ van: e.van, tot: e.tot, locatie: e.locatie || bewerk.locatie }));
    }
    if (bewerk.zondagToeslag != null && bewerk.zondagToeslag !== !!appState.instellingen.zondagToeslag) dagData.zondagToeslag = bewerk.zondagToeslag;
    return dagData;
  }
  // ---------- tijd-invoer ----------
  function leesVeld(idx, veld) { return idx === 0 ? bewerk[veld] : bewerk.extra[idx - 1][veld]; }
  function schrijfVeld(idx, veld, waarde) { if (idx === 0) bewerk[veld] = waarde; else bewerk.extra[idx - 1][veld] = waarde; }

  document.addEventListener('click', e => {
    const el = e.target.closest('[data-action]'); if (!el) return;
    const a = el.dataset.action;
    // navigatie / globaal
    if (a === 'pagina') {
      const doel = el.dataset.val;
      // Nogmaals op de actieve tab: niets opnieuw laden (dus geen animatie); alleen een open bewerkmodus sluiten.
      if (doel === pagina) { if (overzichtBewerk) { overzichtBewerk = false; renderContent(); } return; }
      pagina = doel; overzichtBewerk = false; renderApp({ binnenkomst: true }); return;
    }
    if (a === 'wissel-profiel') { openProfielKiezer(false); return; }
    if (a === 'kies-profiel') {
      const id = el.dataset.id;
      if (id && id !== profiel) {
        profiel = id; S.opslag.zetActief(store, id);
        appState = S.opslag.laadProfiel(store, id);
        versie++; // memo in ui.js cachet op versie; ander profiel = andere data
      }
      profielKiezerVerplicht = false;
      closeOverlay();
      pasToeUiterlijk(); renderApp({ binnenkomst: true }); naProfiel();
      return;
    }
    if (a === 'ov-bewerk') { overzichtBewerk = !overzichtBewerk; renderContent(); return; }
    if (a === 'ov-gallerij') { openOverlay(S.ui.widgetGallerijHTML(ctx())); return; }
    if (a === 'ov-maat') {
      const w = widgetCfg(el.dataset.id);
      if (w.maat === el.dataset.val) return;
      herschik(() => { w.maat = el.dataset.val; });
      return;
    }
    if (a === 'ov-verwijder') { verwijderWidget(el.dataset.id); return; }
    // Slepen bestaat niet op een touchscreen; daar verschuif je een widget met de pijltjes.
    if (a === 'ov-op' || a === 'ov-neer') {
      const arr = appState.instellingen.overzichtWidgets || [];
      const zichtbaar = arr.filter(w => w.zicht !== false);
      const hier = zichtbaar.findIndex(w => w.id === el.dataset.id);
      const buur = zichtbaar[hier + (a === 'ov-op' ? -1 : 1)];
      if (hier < 0 || !buur) return;
      const van = arr.indexOf(zichtbaar[hier]), naar = arr.indexOf(buur);
      herschik(() => { const [w] = arr.splice(van, 1); arr.splice(naar, 0, w); });
      return;
    }
    if (a === 'ov-toevoegen') {
      const id = el.dataset.id;
      const w = widgetCfg(id);
      w.zicht = true;
      // Nieuw toegevoegde widget vooraan: je ziet 'm meteen staan als de galerij dichtgaat.
      const arr = appState.instellingen.overzichtWidgets;
      const idx = arr.indexOf(w);
      if (idx > 0) { arr.splice(idx, 1); arr.unshift(w); }
      overzichtBewerk = true; nieuweWidget = id;
      bewaar(); closeOverlay();
      return;
    }
    if (a === 'ov-w') return; // alleen sleepbaar in bewerkmodus; klik niets
    if (a === 'prev') { if (--zicht.maand < 1) { zicht.maand = 12; zicht.jaar--; } renderContent({ wissel: true }); return; }
    if (a === 'next') { if (++zicht.maand > 12) { zicht.maand = 1; zicht.jaar++; } renderContent({ wissel: true }); return; }
    if (a === 'today') {
      // Kalender: de kalendermaand van vandaag. Loonstrook: de loonperiode waar vandaag in valt.
      const t = new Date();
      zicht = pagina === 'loonstrook' ? S.periode.periodeVoorDatum(S.util.isoDate(t)) : { jaar: t.getFullYear(), maand: t.getMonth() + 1 };
      renderContent({ wissel: true }); return;
    }
    if (a === 'goto-dag') { const iso = el.dataset.iso; const d = new Date(iso + 'T00:00:00'); zicht = { jaar: d.getFullYear(), maand: d.getMonth() + 1 }; pagina = 'kalender'; renderApp({ binnenkomst: true }); return; }
    if (a === 'goto-dag-flash') { const iso = el.dataset.iso; if (!iso) return; const d = new Date(iso + 'T00:00:00'); zicht = { jaar: d.getFullYear(), maand: d.getMonth() + 1 }; pagina = 'kalender'; highlightIso = iso; renderApp({ binnenkomst: true }); setTimeout(wisFlash, 1600); return; }
    if (a === 'dag') {
      const iso = el.dataset.iso;
      if (klembord) { plakOpDag(iso); return; }
      if (S.reken.isVakantie(appState.dagen[iso])) { openVakantieDag(iso); return; }
      openDag(iso); return;
    }
    if (a === 'holi') { meld(el.dataset.naam + ' is geen werkdag'); return; }
    if (a === 'klembord-klaar') { klembord = null; renderApp(); return; }
    if (a === 'sluit') { closeOverlay(); return; }
    if (a === 'herstel') { if (melding && melding.herstel) { melding.herstel(); bewaar(); renderContent(); sluitMelding(); meld('Ongedaan gemaakt'); } return; }
    // instellingen - uiterlijk
    if (a === 'thema') { appState.instellingen.thema = el.dataset.val; bewaar(); pasToeUiterlijk(); renderContent(); return; }
    if (a === 'accent') { appState.instellingen.accent = el.dataset.val; bewaar(); pasToeUiterlijk(); renderContent(); return; }
    if (a === 'thema-kleur-reset') {
      const actiefThema = TH.resolve(appState.instellingen.thema, mqDark.matches);
      if (appState.instellingen.themaOverrides[actiefThema]) { delete appState.instellingen.themaOverrides[actiefThema][el.dataset.token]; }
      bewaar(); pasToeUiterlijk(); location.reload(); return;
    }
    if (a === 'set-weergave') { appState.instellingen.standaardWeergave = el.dataset.val; bewaar(); renderContent(); return; }
    if (a === 'set-zondagtoeslag') { appState.instellingen.zondagToeslag = !appState.instellingen.zondagToeslag; bewaar(); patchSwitch(el, appState.instellingen.zondagToeslag); return; }
    if (a === 'set-schaal' || a === 'set-trede') { zetSchaalTrede(a === 'set-schaal' ? +el.dataset.val : appState.instellingen.schaal, a === 'set-trede' ? +el.dataset.val : appState.instellingen.trede); return; }
    // correcties (loonstrook) - geen dag-detail, eigen kleine overlay
    if (a === 'correctie-nieuw') { openOverlay(S.ui.correctieEditorHTML(ctx())); return; }
    if (a === 'correctie-opslaan') {
      const urenEl = document.getElementById('correctie-uren');
      const notitieEl = document.getElementById('correctie-notitie');
      const uren = parseFloat(String((urenEl && urenEl.value) || '').replace(',', '.'));
      if (!urenEl || isNaN(uren) || uren === 0) { meld('Vul een geldig aantal uren in', { soort: 'fout' }); return; }
      const maandKey = `${zicht.jaar}-${String(zicht.maand).padStart(2, '0')}`;
      const arr = appState.correcties[maandKey] || (appState.correcties[maandKey] = []);
      arr.push({ id: 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), uren, notitie: ((notitieEl && notitieEl.value) || '').trim() });
      bewaar(); meld('Correctie toegevoegd'); closeOverlay();
      return;
    }
    if (a === 'correctie-del') {
      const maandKey = `${zicht.jaar}-${String(zicht.maand).padStart(2, '0')}`;
      const arr = appState.correcties[maandKey];
      const idx = arr ? arr.findIndex(c => c.id === el.dataset.id) : -1;
      if (idx < 0) return;
      const [verwijderd] = arr.splice(idx, 1);
      bewaar();
      meld('Verwijderd', { herstel: () => { arr.splice(idx, 0, verwijderd); } });
      renderContent();
      return;
    }
    // vakantie
    if (a === 'vakantie-nieuw') { openVakantie(); return; }
    if (a === 'vakantie-opslaan') {
      if (!vakantieForm) return;
      const v = S.vakantie.voorstel(appState.dagen, vakantieForm.van, vakantieForm.tot);
      if (!v.aantal || v.totaalUren <= 0) return;
      const isos = v.regels.map(r => r.iso);
      // De uren worden nu vastgelegd: later een oude week aanpassen mag een vakantie die al
      // ingediend is niet met terugwerkende kracht anders laten uitpakken.
      v.regels.forEach(r => { appState.dagen[r.iso] = { soort: 'vakantie', uren: r.uren }; });
      bewaar();
      const eerste = isos[0];
      zicht = { jaar: +eerste.slice(0, 4), maand: +eerste.slice(5, 7) };
      vakantieForm = null;
      meld(`${v.aantal} vakantiedag${v.aantal === 1 ? '' : 'en'} · ${S.util.fmtUren(v.totaalUren)} betaald`, {
        herstel: () => { isos.forEach(iso => delete appState.dagen[iso]); },
      });
      closeOverlay();
      return;
    }
    if (a === 'vakantie-dag-del') { verwijderVakantie([el.dataset.iso], 'Vakantiedag weggehaald'); return; }
    if (a === 'vakantie-reeks-del') {
      const isos = S.vakantie.reeks(appState.dagen, el.dataset.iso);
      verwijderVakantie(isos, `${isos.length} vakantiedagen weggehaald`);
      return;
    }
    // dag-detail
    if (bewerk) {
      // Locatie hangt aan het blok, niet aan de dag: 9–12 kantoor en 16–18 thuis is één dag.
      if (a === 'loc') {
        const idx = +(el.dataset.idx || 0);
        if (idx === 0) bewerk.locatie = el.dataset.val;
        else if (bewerk.extra[idx - 1]) bewerk.extra[idx - 1].locatie = el.dataset.val;
        patchDag(); return;
      }
      if (a === 'dag-vorige') {
        const bron = Object.keys(appState.dagen).filter(k => k < bewerk.iso && !S.reken.isVakantie(appState.dagen[k])).sort().pop();
        if (!bron) return;
        const d = appState.dagen[bron];
        bewerk.van = d.van; bewerk.tot = d.tot; bewerk.locatie = d.locatie || 'kantoor';
        bewerk.extra = blokkenUit(d);
        patchDag();
        meld(`Tijden van ${S.util.dagDatum(new Date(bron + 'T00:00:00'))} overgenomen`);
        return;
      }
      if (a === 'dag-zondagtoeslag') {
        const eff = bewerk.zondagToeslag != null ? bewerk.zondagToeslag : !!appState.instellingen.zondagToeslag;
        bewerk.zondagToeslag = !eff;
        patchSwitch(el, !eff);
        patchAfgeleid();
        return;
      }
      if (a === 'shift-add') {
        if (!bewerk.extra) bewerk.extra = [];
        if (bewerk.extra.length >= 2) return;
        // Sluit aan op het vorige blok en neem diens locatie over: één klik om er thuis van te maken.
        const vorig = bewerk.extra.length ? bewerk.extra[bewerk.extra.length - 1] : bewerk;
        const hhmm = m => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
        const start = Math.min(S.util.parseTime(vorig.tot), 22 * 60);
        bewerk.extra.push({ van: hhmm(start), tot: hhmm(Math.min(start + 120, 23 * 60 + 59)), locatie: vorig.locatie || bewerk.locatie });
        patchDag();
        return;
      }
      if (a === 'shift-del') {
        const idx = parseInt(el.dataset.idx, 10);
        if (bewerk.extra) bewerk.extra.splice(idx, 1);
        patchDag(); return;
      }
      if (a === 'opslaan') {
        syncNotitie();
        if (S.util.parseTime(bewerk.tot) <= S.util.parseTime(bewerk.van)) return;
        const p = S.periode.periodeVoorDatum(bewerk.iso);
        const voor = periodeNetto(p);
        appState.dagen[bewerk.iso] = dagDataUitBewerk();
        bewaar();
        const grens = S.reken.mijlpaal(voor, periodeNetto(p));
        if (grens) { meld(`Mijlpaal gehaald: ${S.util.fmtEuro(grens)} netto deze periode.`, { soort: 'feest' }); vierFeest(); }
        else meld('Opgeslagen');
        closeOverlay(); return;
      }
      if (a === 'verwijderen') {
        syncNotitie();
        const iso = bewerk.iso;
        const vorige = appState.dagen[iso];
        delete appState.dagen[iso];
        bewaar();
        meld('Verwijderd', { herstel: () => { appState.dagen[iso] = vorige; } });
        closeOverlay();
        return;
      }
      if (a === 'dag-kopieer') {
        // Kopieert uit de lopende bewerking (niet de opgeslagen dag): zo gaat een net getypte
        // wijziging niet verloren wanneer je meteen op "Kopieer dag" drukt in plaats van op "Opslaan".
        syncNotitie();
        klembord = { iso: bewerk.iso, data: dagDataUitBewerk() };
        meld(`Gekopieerd van ${S.util.dagDatum(new Date(bewerk.iso + 'T00:00:00'))}`);
        closeOverlay();
        renderApp();
        return;
      }
    }
  });

  document.addEventListener('input', e => {
    const t = e.target;
    if (t.dataset && t.dataset.action === 'tijd' && bewerk) {
      if (t.value) { schrijfVeld(+t.dataset.idx, t.dataset.veld, t.value); patchAfgeleid(); }
      return;
    }
    if (t.dataset && t.dataset.action === 'accent-custom') { document.documentElement.style.setProperty('--accent', t.value); document.documentElement.style.setProperty('--accent-ink', luminantie(t.value) > 0.62 ? '#15171F' : '#FFFFFF'); return; }
  });
  document.addEventListener('change', e => {
    const t = e.target;
    if (t.dataset && t.dataset.action === 'vakantie-datum' && vakantieForm) {
      vakantieForm.van = (document.getElementById('vakantie-van') || {}).value || '';
      vakantieForm.tot = (document.getElementById('vakantie-tot') || {}).value || '';
      // Eén datum invullen bedoelt bijna altijd één dag vrij; de tweede volgt dan vanzelf.
      if (vakantieForm.van && !vakantieForm.tot) { vakantieForm.tot = vakantieForm.van; document.getElementById('vakantie-tot').value = vakantieForm.tot; }
      patchVakantie();
      return;
    }
    if (t.id === 'set-reis') {
      const v = parseFloat(String(t.value).replace(',', '.'));
      if (isNaN(v) || v < 0) { t.value = String(appState.instellingen.reiskostenPerKantoordag); meld('Vul een bedrag in, bijv. 15,50', { soort: 'fout' }); return; }
      appState.instellingen.reiskostenPerKantoordag = v; bewaar(); return;
    }
    if (t.dataset && t.dataset.action === 'accent-custom') { appState.instellingen.accent = t.value; bewaar(); pasToeUiterlijk(); renderContent(); return; }
    if (t.dataset && t.dataset.action === 'thema-kleur') {
      const actiefThema = TH.resolve(appState.instellingen.thema, mqDark.matches);
      appState.instellingen.themaOverrides[actiefThema] = appState.instellingen.themaOverrides[actiefThema] || {};
      appState.instellingen.themaOverrides[actiefThema][t.dataset.token] = t.value;
      bewaar(); pasToeUiterlijk(); renderContent(); return;
    }
  });

  // Uurloon volgt altijd uit de CAO-tabel; een trede die in de nieuwe schaal niet bestaat, klemt op de hoogste.
  function zetSchaalTrede(schaal, trede) {
    const inst = appState.instellingen;
    const treden = S.cao.treden(schaal);
    if (!treden.length) return;
    inst.schaal = schaal;
    inst.trede = treden.includes(trede) ? trede : treden[treden.length - 1];
    inst.uurloon = S.cao.uurloon(inst.schaal, inst.trede);
    bewaar(); renderContent();
  }

  ovlEl.addEventListener('click', e => { if (e.target === ovlEl && !profielKiezerVerplicht) closeOverlay(); });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (klembord) { klembord = null; renderApp(); }
  });
  window.addEventListener('online', () => syncPull(profiel));
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') syncPull(profiel); });
  // Constant synchroon houden: pull elke 30s zolang het tabblad zichtbaar is en er niets openstaat
  // (wijzigingen van het andere apparaat komen vanzelf binnen; een open editor niet wegtrekken).
  setInterval(() => { if (document.visibilityState === 'visible' && !ovlEl.open) syncPull(profiel); }, 30000);

  // ---- drag & drop werkuren tussen kalenderdagen ----
  let dragSrcIso = null;
  document.addEventListener('dragstart', e => {
    const el = e.target.closest('[data-action="dag"][draggable]');
    if (!el) return;
    dragSrcIso = el.dataset.iso;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', dragSrcIso);
    requestAnimationFrame(() => el.classList.add('dragging'));
  });
  document.addEventListener('dragend', () => {
    document.querySelectorAll('.c.dragging,.c.drag-over').forEach(el => el.classList.remove('dragging', 'drag-over'));
    dragSrcIso = null;
  });
  document.addEventListener('dragover', e => {
    const el = e.target.closest('[data-action="dag"]');
    if (!el || el.classList.contains('out') || el.classList.contains('holi')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    document.querySelectorAll('.c.drag-over').forEach(c => c.classList.remove('drag-over'));
    el.classList.add('drag-over');
  });
  document.addEventListener('drop', e => {
    e.preventDefault();
    const targetEl = e.target.closest('[data-action="dag"]');
    if (!targetEl || !dragSrcIso) return;
    const srcIso = dragSrcIso;
    const targetIso = targetEl.dataset.iso;
    if (targetIso === srcIso || targetEl.classList.contains('holi')) return;
    const srcData = appState.dagen[srcIso];
    if (!srcData) return;
    const vorigeSrc = srcData, vorigeTarget = appState.dagen[targetIso];
    appState.dagen[targetIso] = { ...srcData };
    delete appState.dagen[srcIso];
    bewaar();
    meld(`Uren verplaatst naar ${targetIso}`, {
      herstel: () => {
        appState.dagen[srcIso] = vorigeSrc;
        if (vorigeTarget) appState.dagen[targetIso] = vorigeTarget; else delete appState.dagen[targetIso];
      },
    });
    renderContent();
  });

  // ---- drag & drop: overzicht-widgets ordenen en weggooien ----
  let dragWid = null;
  const wisSleepStand = () => {
    document.querySelectorAll('.ov-w.dragging,.ov-w.drag-over').forEach(el => el.classList.remove('dragging', 'drag-over'));
    const bak = document.querySelector('[data-rol="prullenbak"]'); if (bak) bak.classList.remove('over');
  };
  document.addEventListener('dragstart', e => {
    const el = e.target.closest('[data-action="ov-w"][draggable]'); if (!el) return;
    dragWid = el.dataset.id;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', dragWid);
    requestAnimationFrame(() => el.classList.add('dragging'));
    document.body.classList.add('sleept-widget');
  });
  document.addEventListener('dragend', () => { wisSleepStand(); dragWid = null; document.body.classList.remove('sleept-widget'); });
  document.addEventListener('dragover', e => {
    if (!dragWid) return;
    const bak = e.target.closest('[data-rol="prullenbak"]');
    if (bak) {
      e.preventDefault(); e.dataTransfer.dropEffect = 'move';
      document.querySelectorAll('.ov-w.drag-over').forEach(c => c.classList.remove('drag-over'));
      bak.classList.add('over');
      return;
    }
    const bakUit = document.querySelector('[data-rol="prullenbak"]'); if (bakUit) bakUit.classList.remove('over');
    const el = e.target.closest('[data-action="ov-w"]'); if (!el) return;
    e.preventDefault(); e.dataTransfer.dropEffect = 'move';
    document.querySelectorAll('.ov-w.drag-over').forEach(c => c.classList.remove('drag-over'));
    if (el.dataset.id !== dragWid) el.classList.add('drag-over');
  });
  document.addEventListener('drop', e => {
    if (!dragWid) return;
    const id = dragWid;
    // In de prullenbak laten vallen = van het overzicht halen. Blijft terug te zetten via het plusje.
    if (e.target.closest('[data-rol="prullenbak"]')) {
      e.preventDefault(); wisSleepStand(); dragWid = null;
      verwijderWidget(id);
      return;
    }
    const el = e.target.closest('[data-action="ov-w"]'); if (!el) return;
    e.preventDefault();
    const targetId = el.dataset.id;
    wisSleepStand(); dragWid = null;
    const arr = appState.instellingen.overzichtWidgets;
    const from = arr.findIndex(w => w.id === id), to = arr.findIndex(w => w.id === targetId);
    if (from < 0 || to < 0 || from === to) return;
    herschik(() => { const [m] = arr.splice(from, 1); arr.splice(to, 0, m); });
  });

  pasToeUiterlijk();
  renderApp();
  if (!profiel) openProfielKiezer(true); else naProfiel();
  // Minuutklok: overzicht én kalender tonen een meelopende teller, dus beide moeten mee.
  let laatsteProgStatus = null;
  setInterval(() => {
    if (ovlEl.open) { patchVoortgang(); return; }
    if (pagina !== 'overzicht' && pagina !== 'kalender') return;
    const vd = appState.dagen[S.util.isoDate(new Date())];
    const status = vd && !S.reken.isVakantie(vd) ? S.uren.voortgangShifts(S.reken.blokken(vd), nuMin()).status : null;
    if (S.uren.intervalMoetVerversen(laatsteProgStatus, status)) renderContent();
    laatsteProgStatus = status;
  }, 60000);
})();
