(function () {
  const S = window.Salaris;
  const store = window.localStorage;
  const TH = S.thema;
  const SY = S.sync;
  let profiel = S.opslag.actiefProfiel(store);
  let appState = profiel ? S.opslag.laadProfiel(store, profiel) : S.opslag.defaultState();
  let weergave = appState.instellingen.standaardWeergave || 'netto';
  const today = new Date();
  let zicht = { jaar: today.getFullYear(), maand: today.getMonth() + 1 };
  let pagina = 'overzicht';
  let bewerk = null;        // dag-detail
  let highlightIso = null;  // tijdelijke flash op kalendercel
  let overzichtBewerk = false; // indeling-bewerkmodus op overzicht
  let profielKiezerVerplicht = false; // eerste keer: profiel kiezen kan niet weggeklikt worden
  let versie = 0;
  let syncStaat = S.sync.configured() ? 'bezig' : 'nvt'; // sync staat altijd aan zodra geconfigureerd; geen wachtwoord meer
  let pushTimer = null, pushPending = null;
  localStorage.removeItem('salaris-sync-pass'); // overblijfsel uit het wachtwoord-tijdperk opruimen

  const appEl = document.getElementById('app');
  const ovlEl = document.getElementById('overlay');
  const liveEl = document.getElementById('live');
  const mqDark = window.matchMedia('(prefers-color-scheme: dark)');

  const nuMin = () => { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); };
  const profielNaam = () => { const p = S.opslag.PROFIELEN.find(x => x.id === profiel); return p ? p.naam : ''; };
  const ctx = () => ({ state: appState, weergave, zicht, pagina, vandaagIso: S.util.isoDate(new Date()), nuMin: nuMin(), highlightIso, overzichtBewerk, versie, profiel, profielen: S.opslag.PROFIELEN, profielNaam: profielNaam(), syncBeschikbaar: SY.configured(), syncTekst: syncTekstVan(syncStaat) });
  const bewaar = () => {
    versie++;
    if (!profiel) return;
    const nu = new Date().toISOString();
    zetTsLokaal(profiel, nu);
    S.opslag.bewaarProfiel(store, profiel, appState);
    syncPush(profiel, nu);
  };
  function openProfielKiezer(verplicht) { profielKiezerVerplicht = !!verplicht; openOverlay(S.ui.profielKiezerHTML(ctx())); }
  const announce = t => { liveEl.textContent = t; };

  // ---------- cloud-sync (versleuteld, per profiel) ----------
  const TS_KEY = 'salaris-sync-ts';
  function tsLokaal(id) { try { return (JSON.parse(localStorage.getItem(TS_KEY) || '{}'))[id] || null; } catch { return null; } }
  function zetTsLokaal(id, ts) { let m = {}; try { m = JSON.parse(localStorage.getItem(TS_KEY) || '{}'); } catch {} m[id] = ts; localStorage.setItem(TS_KEY, JSON.stringify(m)); }
  function profielHeeftData(st) { return !!(st && st.dagen && Object.keys(st.dagen).length); }
  function syncTekstVan(s) {
    return s === 'ok' ? 'Gesynchroniseerd met de cloud.'
      : s === 'bezig' ? 'Synchroniseren…'
      : s === 'offline' ? 'Offline — lokaal opgeslagen, synct later vanzelf.'
      : '';
  }
  function syncStatus(s) { syncStaat = s; if (pagina === 'instellingen' && ovlEl.classList.contains('hidden')) renderContent(); }
  function syncPush(id, ts, snapshot) {
    if (!SY.configured()) return;
    pushPending = { id, ts, state: snapshot || appState };
    clearTimeout(pushTimer);
    pushTimer = setTimeout(async () => {
      const job = pushPending; pushPending = null; if (!job) return;
      try { await SY.push(job.id, job.state, job.ts); syncStatus('ok'); }
      catch (e) { syncStatus('offline'); }
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
    // Nooit eerder gesynct op dit apparaat: cloud wint alleen als lokaal leeg is (beschermt bestaande data).
    const adopt = lokaal ? (new Date(res.updatedAt) > new Date(lokaal)) : !profielHeeftData(appState);
    if (adopt) {
      appState = res.state; weergave = appState.instellingen.standaardWeergave || 'netto';
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
    if (!w) { w = { id, zicht: true, groot: false }; arr.push(w); }
    return w;
  }

  function luminantie(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || ''); if (!m) return 1;
    const n = parseInt(m[1], 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  }
  const THEMA_TOKENS = ['--bg', '--surf', '--surf2', '--text', '--muted', '--faint', '--border', '--border-2'];
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
      root.style.setProperty('--text', donker ? '#F1F4FA' : '#19202E');
      root.style.setProperty('--muted', donker ? '#AEB6C8' : '#586074');
      root.style.setProperty('--faint', donker ? '#7B8398' : '#929BAD');
      root.style.setProperty('--surf2', ov.kaart || ov.achtergrond || '#F3F5FA');
      root.style.setProperty('--border', donker ? 'rgba(255,255,255,.12)' : 'rgba(20,26,42,.09)');
      root.style.setProperty('--border-2', donker ? 'rgba(255,255,255,.2)' : 'rgba(20,26,42,.14)');
    }
  }
  mqDark.addEventListener('change', () => {
    if (appState.instellingen.thema === 'systeem') { pasToeUiterlijk(); if (pagina === 'instellingen' && ovlEl.classList.contains('hidden')) renderContent(); }
  });

  const renderApp = () => { appEl.className = 'shell'; appEl.innerHTML = S.ui.shellHTML(ctx()); };
  const renderContent = () => {
    const c = document.getElementById('content'); if (!c) return;
    const oudScroll = c.querySelector('[data-scroll]');
    const y = oudScroll ? oudScroll.scrollTop : 0;
    const cy = c.scrollTop;
    c.innerHTML = S.ui.pageHTML(ctx());
    const nieuwScroll = c.querySelector('[data-scroll]');
    if (nieuwScroll) nieuwScroll.scrollTop = y;
    c.scrollTop = cy;
  };
  const openOverlay = html => { ovlEl.innerHTML = html; ovlEl.classList.remove('hidden'); };
  const closeOverlay = () => {
    ovlEl.classList.add('hidden'); ovlEl.innerHTML = ''; bewerk = null;
    const c = document.getElementById('content');
    if (c) c.classList.add('no-anim');
    renderContent();
    requestAnimationFrame(() => { if (c) c.classList.remove('no-anim'); });
  };

  // ---------- dag-detail ----------
  function openDag(iso) {
    const d = appState.dagen[iso] || { van: '09:00', tot: '17:30', locatie: 'kantoor', notitie: '' };
    bewerk = { iso, van: d.van, tot: d.tot, extra: d.extra ? d.extra.map(e => ({ ...e })) : [], locatie: d.locatie || 'kantoor', notitie: d.notitie || '', zondagToeslag: d.zondagToeslag != null ? d.zondagToeslag : null };
    openOverlay(S.ui.dagDetailHTML(bewerk, ctx()));
  }
  function syncNotitie() { const t = ovlEl.querySelector('#notitie'); if (t && bewerk) bewerk.notitie = t.value; }
  function patchVoortgang() {
    if (!bewerk) return;
    const wrap = ovlEl.querySelector('[data-rol="prog"]');
    if (wrap) wrap.innerHTML = S.ui.voortgangHTML(bewerk, ctx());
  }
  function patchDag() {
    if (!bewerk) return;
    const root = ovlEl;
    const shiftsSec = root.querySelector('[data-rol="shifts"]');
    if (shiftsSec) shiftsSec.innerHTML = S.ui.shiftSectieHTML(bewerk);
    root.querySelectorAll('[data-action="loc"]').forEach(btn => btn.setAttribute('aria-selected', String(btn.dataset.val === bewerk.locatie)));
    const tl = root.querySelector('[data-rol="tijdlijn"]');
    if (tl) tl.innerHTML = S.ui.tijdlijnHTML(bewerk);
    const bd = root.querySelector('[data-rol="bd"]');
    if (bd) bd.innerHTML = S.ui.breakdownHTML(bewerk, ctx());
    const toeslagEl = root.querySelector('[data-rol="toeslag"]');
    if (toeslagEl) toeslagEl.innerHTML = S.ui.toeslagSectieHTML(bewerk, ctx());
    const geldig = S.util.parseTime(bewerk.tot) > S.util.parseTime(bewerk.van);
    const fout = root.querySelector('[data-rol="tijdfout"]'); if (fout) fout.textContent = geldig ? '' : 'Eindtijd moet na de begintijd liggen.';
    const opsla = root.querySelector('[data-rol="opslaan"]'); if (opsla) { opsla.disabled = !geldig; opsla.style.opacity = geldig ? '' : '.5'; }
    patchVoortgang();
  }
  // Werkt alleen de van-tijd afhankelijke delen bij, zonder de shift-lijst opnieuw op te bouwen (behoud focus in tijdvelden).
  function patchNaTijd() {
    if (!bewerk) return;
    const root = ovlEl;
    const tl = root.querySelector('[data-rol="tijdlijn"]'); if (tl) tl.innerHTML = S.ui.tijdlijnHTML(bewerk);
    const bd = root.querySelector('[data-rol="bd"]'); if (bd) bd.innerHTML = S.ui.breakdownHTML(bewerk, ctx());
    const toeslagEl = root.querySelector('[data-rol="toeslag"]'); if (toeslagEl) toeslagEl.innerHTML = S.ui.toeslagSectieHTML(bewerk, ctx());
    const geldig = S.util.parseTime(bewerk.tot) > S.util.parseTime(bewerk.van);
    const fout = root.querySelector('[data-rol="tijdfout"]'); if (fout) fout.textContent = geldig ? '' : 'Eindtijd moet na de begintijd liggen.';
    const opsla = root.querySelector('[data-rol="opslaan"]'); if (opsla) { opsla.disabled = !geldig; opsla.style.opacity = geldig ? '' : '.5'; }
    patchVoortgang();
  }
  // ---------- tijd-invoer ----------
  function leesVeld(idx, veld) { return idx === 0 ? bewerk[veld] : bewerk.extra[idx - 1][veld]; }
  function schrijfVeld(idx, veld, waarde) { if (idx === 0) bewerk[veld] = waarde; else bewerk.extra[idx - 1][veld] = waarde; }

  document.addEventListener('click', e => {
    const el = e.target.closest('[data-action]'); if (!el) return;
    const a = el.dataset.action;
    // navigatie / globaal
    if (a === 'pagina') { pagina = el.dataset.val; overzichtBewerk = false; renderApp(); return; }
    if (a === 'genereer-urenkaart') { genereerUrenkaart(); return; }
    if (a === 'wissel-profiel') { openProfielKiezer(false); return; }
    if (a === 'kies-profiel') {
      const id = el.dataset.id;
      if (id && id !== profiel) {
        profiel = id; S.opslag.zetActief(store, id);
        appState = S.opslag.laadProfiel(store, id);
        weergave = appState.instellingen.standaardWeergave || 'netto';
        versie++; // memo in ui.js cachet op versie; ander profiel = andere data
      }
      profielKiezerVerplicht = false;
      ovlEl.classList.add('hidden'); ovlEl.innerHTML = '';
      pasToeUiterlijk(); renderApp(); naProfiel();
      return;
    }
    if (a === 'weergave') { weergave = el.dataset.val; if (bewerk) patchDag(); else renderContent(); return; }
    if (a === 'ov-bewerk') { overzichtBewerk = !overzichtBewerk; renderContent(); return; }
    if (a === 'ov-size') { widgetCfg(el.dataset.id).groot = !widgetCfg(el.dataset.id).groot; bewaar(); renderContent(); return; }
    if (a === 'ov-hide') { widgetCfg(el.dataset.id).zicht = false; bewaar(); renderContent(); return; }
    if (a === 'ov-show') { widgetCfg(el.dataset.id).zicht = true; bewaar(); renderContent(); return; }
    if (a === 'ov-w') return; // alleen sleepbaar in bewerkmodus; klik niets
    if (a === 'prev') { if (--zicht.maand < 1) { zicht.maand = 12; zicht.jaar--; } renderContent(); return; }
    if (a === 'next') { if (++zicht.maand > 12) { zicht.maand = 1; zicht.jaar++; } renderContent(); return; }
    if (a === 'today') { const t = new Date(); zicht = { jaar: t.getFullYear(), maand: t.getMonth() + 1 }; renderContent(); return; }
    if (a === 'goto-dag') { const iso = el.dataset.iso; const d = new Date(iso + 'T00:00:00'); zicht = { jaar: d.getFullYear(), maand: d.getMonth() + 1 }; pagina = 'kalender'; renderApp(); return; }
    if (a === 'goto-dag-flash') { const iso = el.dataset.iso; if (!iso) return; const d = new Date(iso + 'T00:00:00'); zicht = { jaar: d.getFullYear(), maand: d.getMonth() + 1 }; pagina = 'kalender'; highlightIso = iso; renderApp(); setTimeout(() => { highlightIso = null; renderContent(); }, 1600); return; }
    if (a === 'dag') { openDag(el.dataset.iso); return; }
    if (a === 'holi') { announce(el.dataset.naam + ' — geen werkdag'); return; }
    if (a === 'sluit') { closeOverlay(); return; }
    // instellingen — uiterlijk
    if (a === 'thema') { appState.instellingen.thema = el.dataset.val; bewaar(); pasToeUiterlijk(); renderContent(); return; }
    if (a === 'accent') { appState.instellingen.accent = el.dataset.val; bewaar(); pasToeUiterlijk(); renderContent(); return; }
    if (a === 'thema-kleur-reset') {
      const actiefThema = TH.resolve(appState.instellingen.thema, mqDark.matches);
      if (appState.instellingen.themaOverrides[actiefThema]) { delete appState.instellingen.themaOverrides[actiefThema][el.dataset.token]; }
      bewaar(); pasToeUiterlijk(); location.reload(); return;
    }
    if (a === 'set-weergave') { appState.instellingen.standaardWeergave = el.dataset.val; weergave = el.dataset.val; bewaar(); renderContent(); return; }
    if (a === 'set-zondagtoeslag') { appState.instellingen.zondagToeslag = !appState.instellingen.zondagToeslag; bewaar(); renderContent(); return; }
    if (a === 'export') { exportData(); return; }
    if (a === 'import') { importData(); return; }
    if (a === 'code-toon') {
      const wrap = document.querySelector('[data-rol="mijn-code"]');
      const lbl = document.querySelector('[data-rol="code-knop-tekst"]');
      const ta = document.getElementById('overzet-mijncode');
      if (!wrap) return;
      const nuVerborgen = wrap.classList.toggle('hidden');
      if (!nuVerborgen) {
        if (ta) { ta.value = S.opslag.codeer(appState); ta.focus(); ta.select(); try { document.execCommand('copy'); } catch (e) {} }
        if (lbl) lbl.textContent = 'Verberg mijn code';
        announce('Code gegenereerd en gekopieerd');
      } else if (lbl) { lbl.textContent = 'Toon mijn code'; }
      return;
    }
    if (a === 'code-toepassen') {
      const ta = document.getElementById('overzet-code');
      if (!ta || !ta.value.trim()) { announce('Plak eerst een code'); return; }
      try {
        const nieuw = S.opslag.decodeer(ta.value);
        if (!confirm('Huidige gegevens vervangen door de geplakte code?')) return;
        appState = nieuw; weergave = appState.instellingen.standaardWeergave || 'netto';
        bewaar(); pasToeUiterlijk(); renderApp(); announce('Gegevens overgezet');
      } catch (e) { announce('Ongeldige code'); }
      return;
    }
    // dag-detail
    if (bewerk) {
      if (a === 'loc') { bewerk.locatie = el.dataset.val; patchDag(); return; }
      if (a === 'dag-zondagtoeslag') {
        const eff = bewerk.zondagToeslag != null ? bewerk.zondagToeslag : !!appState.instellingen.zondagToeslag;
        bewerk.zondagToeslag = !eff;
        patchDag(); return;
      }
      if (a === 'shift-add') {
        if (!bewerk.extra) bewerk.extra = [];
        if (bewerk.extra.length < 2) { bewerk.extra.push({ van: '14:00', tot: '18:00' }); patchDag(); }
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
        const dagData = { van: bewerk.van, tot: bewerk.tot, locatie: bewerk.locatie, notitie: bewerk.notitie };
        if (bewerk.extra && bewerk.extra.length) dagData.extra = bewerk.extra.filter(e => S.util.parseTime(e.tot) > S.util.parseTime(e.van));
        if (bewerk.zondagToeslag != null && bewerk.zondagToeslag !== !!appState.instellingen.zondagToeslag) dagData.zondagToeslag = bewerk.zondagToeslag;
        appState.dagen[bewerk.iso] = dagData;
        bewaar(); announce('Opgeslagen'); closeOverlay(); return;
      }
      if (a === 'verwijderen') { syncNotitie(); if (confirm('Deze dag verwijderen?')) { delete appState.dagen[bewerk.iso]; bewaar(); announce('Verwijderd'); closeOverlay(); } return; }
    }
  });

  document.addEventListener('input', e => {
    const t = e.target;
    if (t.dataset && t.dataset.action === 'tijd' && bewerk) {
      if (t.value) { schrijfVeld(+t.dataset.idx, t.dataset.veld, t.value); patchNaTijd(); }
      return;
    }
    if (t.dataset && t.dataset.action === 'accent-custom') { document.documentElement.style.setProperty('--accent', t.value); document.documentElement.style.setProperty('--accent-ink', luminantie(t.value) > 0.62 ? '#15171F' : '#FFFFFF'); return; }
  });
  document.addEventListener('change', e => {
    const t = e.target;
    if (t.id === 'set-uurloon') { const v = parseFloat(String(t.value).replace(',', '.')); if (!isNaN(v)) { appState.instellingen.uurloon = v; bewaar(); renderContent(); } return; }
    if (t.id === 'set-reis') { const v = parseFloat(String(t.value).replace(',', '.')); if (!isNaN(v)) { appState.instellingen.reiskostenPerKantoordag = v; bewaar(); renderContent(); } return; }
    if (t.id && t.id.startsWith('uk-')) { (appState.instellingen.urenkaart = appState.instellingen.urenkaart || {})[t.id.slice(3)] = t.value; bewaar(); return; }
    if (t.dataset && t.dataset.action === 'accent-custom') { appState.instellingen.accent = t.value; bewaar(); pasToeUiterlijk(); renderContent(); return; }
    if (t.dataset && t.dataset.action === 'thema-kleur') {
      const actiefThema = TH.resolve(appState.instellingen.thema, mqDark.matches);
      appState.instellingen.themaOverrides[actiefThema] = appState.instellingen.themaOverrides[actiefThema] || {};
      appState.instellingen.themaOverrides[actiefThema][t.dataset.token] = t.value;
      bewaar(); pasToeUiterlijk(); renderContent(); return;
    }
  });

  function exportData() {
    const blob = new Blob([S.opslag.exporteer(appState)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = 'salaris-backup' + (profiel ? '-' + profiel : '') + '.json'; a.click(); URL.revokeObjectURL(url);
    announce('Back-up geëxporteerd');
  }
  function genereerUrenkaart() {
    const namen = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
    const [j, m] = S.util.isoDate(new Date()).split('-').map(Number);
    const model = S.excel.urenkaartModel(appState, [S.excel.vorigeMaand(j, m), { jaar: j, maand: m }]);
    const blob = new Blob([S.excel.bouwXlsx(model)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = `urenkaart-${namen[m - 1]}-${j}.xlsx`; a.click(); URL.revokeObjectURL(url);
    announce('Urenkaart-Excel gegenereerd');
  }
  function importData() {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'application/json';
    inp.onchange = () => {
      const f = inp.files[0]; if (!f) return; const r = new FileReader();
      r.onload = () => { try { appState = S.opslag.importeer(r.result); weergave = appState.instellingen.standaardWeergave || 'netto'; bewaar(); pasToeUiterlijk(); renderApp(); announce('Back-up geïmporteerd'); } catch { announce('Ongeldig back-upbestand'); } };
      r.readAsText(f);
    };
    inp.click();
  }

  ovlEl.addEventListener('click', e => { if (e.target === ovlEl && !profielKiezerVerplicht) closeOverlay(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !ovlEl.classList.contains('hidden') && !profielKiezerVerplicht) closeOverlay();
  });
  window.addEventListener('online', () => syncPull(profiel));
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') syncPull(profiel); });
  // Constant synchroon houden: pull elke 30s zolang het tabblad zichtbaar is en er niets openstaat
  // (wijzigingen van het andere apparaat komen vanzelf binnen; een open editor niet wegtrekken).
  setInterval(() => { if (document.visibilityState === 'visible' && ovlEl.classList.contains('hidden')) syncPull(profiel); }, 30000);

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
    const targetIso = targetEl.dataset.iso;
    if (targetIso === dragSrcIso || targetEl.classList.contains('holi')) return;
    const srcData = appState.dagen[dragSrcIso];
    if (!srcData) return;
    if (appState.dagen[targetIso] && !confirm(`Werkdata van ${targetIso} overschrijven met die van ${dragSrcIso}?`)) return;
    appState.dagen[targetIso] = { ...srcData };
    delete appState.dagen[dragSrcIso];
    bewaar();
    announce(`Uren verplaatst naar ${targetIso}`);
    renderContent();
  });

  // ---- drag & drop: overzicht-widgets ordenen ----
  let dragWid = null;
  document.addEventListener('dragstart', e => {
    const el = e.target.closest('[data-action="ov-w"][draggable]'); if (!el) return;
    dragWid = el.dataset.id;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', dragWid);
    requestAnimationFrame(() => el.classList.add('dragging'));
  });
  document.addEventListener('dragend', () => {
    document.querySelectorAll('.ov-w.dragging,.ov-w.drag-over').forEach(el => el.classList.remove('dragging', 'drag-over'));
    dragWid = null;
  });
  document.addEventListener('dragover', e => {
    if (!dragWid) return;
    const el = e.target.closest('[data-action="ov-w"]'); if (!el) return;
    e.preventDefault(); e.dataTransfer.dropEffect = 'move';
    document.querySelectorAll('.ov-w.drag-over').forEach(c => c.classList.remove('drag-over'));
    if (el.dataset.id !== dragWid) el.classList.add('drag-over');
  });
  document.addEventListener('drop', e => {
    if (!dragWid) return;
    const el = e.target.closest('[data-action="ov-w"]'); if (!el) return;
    e.preventDefault();
    const targetId = el.dataset.id;
    const arr = appState.instellingen.overzichtWidgets;
    const from = arr.findIndex(w => w.id === dragWid), to = arr.findIndex(w => w.id === targetId);
    if (from < 0 || to < 0 || from === to) return;
    const [m] = arr.splice(from, 1); arr.splice(to, 0, m);
    bewaar(); renderContent();
  });

  pasToeUiterlijk();
  renderApp();
  if (!profiel) openProfielKiezer(true); else naProfiel();
  let laatsteProgStatus = null;
  setInterval(() => {
    if (!ovlEl.classList.contains('hidden')) { patchVoortgang(); return; }
    if (pagina !== 'overzicht') return;
    const vd = appState.dagen[S.util.isoDate(new Date())];
    const status = vd ? S.uren.voortgang(vd.van, vd.tot, nuMin()).status : null;
    if (S.uren.intervalMoetVerversen(laatsteProgStatus, status)) renderContent();
    laatsteProgStatus = status;
  }, 60000);
})();
