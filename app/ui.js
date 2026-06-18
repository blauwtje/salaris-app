(function (root, factory) {
  const deps = r => [r.util, r.uren, r.reken, r.state, r.kalender, r.feestdagen, r.tijdkiezer, r.thema];
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else { root.Salaris = root.Salaris || {}; root.Salaris.ui = factory(...deps(root.Salaris)); }
})(typeof self !== 'undefined' ? self : this, function (util, uren, reken, state, kalender, feestdagen, tijdkiezer, thema) {
  const S = typeof self !== 'undefined' ? self.Salaris : {};
  const U = util || S.util;
  const REK = reken || S.reken;
  const ST = state || S.state;
  const KAL = kalender || S.kalender;
  const UR = uren || S.uren;
  const FD = feestdagen || S.feestdagen;
  const TK = tijdkiezer || S.tijdkiezer;
  const TH = thema || S.thema;

  const MAAND = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const ICON = {
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    week: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
    maand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 8v8M8 12h8"/><circle cx="12" cy="12" r="9"/></svg>',
    klok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    pijl: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    omhoog: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
    euro: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M7 15h6a3 3 0 0 0 0-6H7M7 12h7M9 9V6m0 12v-3"/></svg>',
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
  };
  const THEMA_ICON = { systeem: ICON.laptop, licht: ICON.sun, donker: ICON.moon, zwart: ICON.oled };

  const initialen = n => String(n || '').trim().charAt(0).toUpperCase();
  const eK = n => '€' + Math.round(n).toLocaleString('nl-NL');
  function resterend(min) { const h = Math.floor(min / 60), m = min % 60; return (h ? h + 'u ' : '') + m + 'm'; }
  function maandagVan(d) { const x = new Date(d); const off = (x.getDay() + 6) % 7; x.setDate(x.getDate() - off); return x; }
  function dagenVanMaand(state, jaar, maand) {
    const pre = `${jaar}-${String(maand).padStart(2, '0')}`;
    return Object.entries(state.dagen)
      .filter(([iso]) => iso.startsWith(pre) && !FD.isFeestdag(iso))
      .map(([iso, d]) => ({ ...d, datum: iso }));
  }
  // Memo: één overzicht-render vraagt dezelfde maand ~9x op. Cache per jaar-maand-versie;
  // `versie` wordt door main.js bij elke bewaar() opgehoogd, dus mutaties invalideren vanzelf.
  let _renderVersie = 0;
  const _maandCache = new Map();
  function maandResultaat(state, jaar, maand) {
    const sleutel = `${jaar}-${maand}-${_renderVersie}`;
    const cached = _maandCache.get(sleutel);
    if (cached) return cached;
    const res = REK.maandReken(dagenVanMaand(state, jaar, maand), state.instellingen);
    const map = {}; res.perDag.forEach(d => { map[d.datum] = d; });
    const val = { res, map };
    if (_maandCache.size > 24) _maandCache.clear();
    _maandCache.set(sleutel, val);
    return val;
  }
  function bedragVoorDag(state, iso, weergave) {
    const [j, m] = iso.split('-').map(Number);
    const { map } = maandResultaat(state, j, m);
    const d = map[iso]; if (!d) return 0;
    return weergave === 'bruto' ? d.bruto : d.netto;
  }

  function maandTotalen(state, jaar, maand) {
    const { res } = maandResultaat(state, jaar, maand);
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

  // ---------- ZIJBALK ----------
  function navItem(pagina, huidig, icon, label) {
    const on = pagina === huidig ? ' aria-current="page" class="ni on"' : ' class="ni"';
    return `<button data-action="pagina" data-val="${pagina}"${on}>${icon}<span>${label}</span></button>`;
  }
  function sidebarHTML(ctx) {
    const p = ctx.pagina;
    return `<div class="brand"><span class="dot"></span>Salaris</div>
      <nav class="nav" aria-label="Pagina's">
        ${navItem('overzicht', p, ICON.maand, 'Overzicht')}
        ${navItem('kalender', p, ICON.week, 'Kalender')}
        ${navItem('loonstrook', p, ICON.euro, 'Loonstrook')}
        ${navItem('instellingen', p, ICON.gear, 'Instellingen')}
      </nav>
      ${ctx.profielNaam ? `<button class="sb-profiel" data-action="wissel-profiel" title="Wissel profiel">
        <span class="pf-avatar sm">${initialen(ctx.profielNaam)}</span>
        <span class="pf-naam">${esc(ctx.profielNaam)}</span>
        <span class="pf-chev">${ICON.wissel}</span></button>` : ''}
      <div class="sb-foot">${ICON.slot}Alles lokaal in je browser bewaard.</div>`;
  }

  // ---------- PAGINAKOP ----------
  function paginakopHTML(titel, weergave, metPil = true, extra = '') {
    const pil = metPil ? `<div class="seg teal" role="tablist" aria-label="Bruto of netto">
        <button data-action="weergave" data-val="bruto" aria-selected="${weergave === 'bruto'}">Bruto</button>
        <button data-action="weergave" data-val="netto" aria-selected="${weergave === 'netto'}">Netto</button>
      </div>` : '';
    return `<div class="paginakop"><h2>${titel}</h2><div class="spacer"></div>${extra}${pil}</div>`;
  }

  // ---------- OVERZICHT ----------
  function overzichtPage(ctx) {
    const { state, weergave, vandaagIso } = ctx;
    const vandaag = new Date(vandaagIso + 'T00:00:00');
    const jaar = vandaag.getFullYear(), maand = vandaag.getMonth() + 1;
    const M = maandTotalen(state, jaar, maand);
    const urenMaand = ST.urenInMaand(state.dagen, jaar, maand);
    const maMaandag = maandagVan(vandaag);
    const urenWeek = ST.urenInWeek(state.dagen, U.isoDate(maMaandag));
    let weekBedrag = 0;
    for (let i = 0; i < 7; i++) { const d = new Date(maMaandag); d.setDate(maMaandag.getDate() + i); const iso = U.isoDate(d); if (state.dagen[iso]) weekBedrag += bedragVoorDag(state, iso, weergave); }
    const maandBedrag = weergave === 'bruto' ? M.brutoTot : M.netto;

    const volg = ST.volgendeWerkdag(state.dagen, vandaagIso);
    let volgBig = 'Nog geen', volgSub = 'toekomstige dag ingevuld';
    if (volg) {
      const vd2 = state.dagen[volg]; const dt = new Date(volg + 'T00:00:00');
      const bedrag = bedragVoorDag(state, volg, weergave);
      const fr = REK.toeslagFractie({ datum: volg, zondagToeslag: vd2.zondagToeslag != null ? vd2.zondagToeslag : undefined }, state.instellingen);
      volgBig = `${U.dagNaam(dt)} ${dt.getDate()} ${MAAND[dt.getMonth()]}`;
      volgSub = `${U.fmtEuro(bedrag)} · ${vd2.van}–${vd2.tot}${fr > 0 ? ` · +${Math.round(fr * 100)}%` : ''}`;
    }

    const vd = state.dagen[vandaagIso];
    let progCard;
    if (vd) {
      const vdShifts = [{ van: vd.van, tot: vd.tot }, ...(vd.extra || [])];
      const v = UR.voortgangShifts(vdShifts, ctx.nuMin);
      const bezig = v.status === 'bezig' || v.status === 'pauze';
      const meta = v.status === 'voor' ? `begint om ${v.eersteVan}`
        : v.status === 'klaar' ? 'werkdag klaar'
        : v.status === 'pauze' ? `pauze · volgende dienst om ${v.volgendeVan}`
        : `<b>${Math.round(v.pct)}%</b> · nog ${resterend(v.resterendeMin)}`;
      const tijdTekst = vdShifts.map(s => `${s.van}–${s.tot}`).join(', ');
      progCard = `<div class="card">
        <div class="prog-top"><div class="lab">${ICON.klok}Werkdag vandaag</div>${bezig ? '<span class="live"><span class="pd"></span>Bezig</span>' : ''}</div>
        <div class="track"><div class="fill" style="width:${v.pct}%"></div></div>
        <div class="prog-meta"><span>${tijdTekst} · ${vd.locatie}</span><span>${meta}</span></div></div>`;
    } else {
      progCard = `<div class="card"><div class="lab">${ICON.klok}Werkdag vandaag</div><div class="sub muted" style="margin-top:.6rem">Vandaag geen uren ingevuld.</div></div>`;
    }

    const next = n => { let d; if (vandaag.getDate() > n) d = new Date(jaar, maand, n); else d = new Date(jaar, maand - 1, n); return d; };
    const d19 = next(19), d25 = next(25);
    const d19Iso = U.isoDate(d19), d25Iso = U.isoDate(d25);
    const agen19 = Math.round((d19.getTime() - vandaag.getTime()) / 86400000);
    const agen25 = Math.round((d25.getTime() - vandaag.getTime()) / 86400000);
    const daysAway = n => n <= 0 ? 'vandaag' : n === 1 ? 'morgen' : `over ${n} dagen`;

    const t = M.res.totalen;
    const salaris = M.res.perDag.reduce((s, d) => s + d.basisloon, 0);
    const toeslag = M.res.perDag.reduce((s, d) => s + d.toeslag, 0);
    const totUrenM = M.res.perDag.reduce((s, d) => s + d.betaaldeUren, 0);
    const brutoUur = state.instellingen.uurloon;
    const nettoUur = totUrenM > 0 ? t.nettoTot / totUrenM : 0;
    const uurloonBlok = `<div class="uurloon-grid" style="margin-top:.7rem">
        <div class="ul-box"><span class="ul-l">Bruto / uur</span><span class="ul-v">${U.fmtEuro(brutoUur)}</span></div>
        <div class="ul-box net"><span class="ul-l">Netto / uur</span><span class="ul-v">${U.fmtEuro(nettoUur)}</span></div>
      </div>`;
    const nettoRatio = t.brutoTot > 0 ? Math.round(t.nettoTot / t.brutoTot * 100) : 0;
    let lsRows;
    if (weergave === 'netto') {
      lsRows = `<div class="row bruto"><span class="k">Bruto totaal</span><span class="v">${U.fmtEuro(M.svBase)}</span></div>
        <div class="row inhoud"><span class="k">Inhoudingen</span><span class="v">−${U.fmtEuro(M.inhoudingen)}</span></div>
        <div class="row"><span class="k">Reiskosten <span class="f">(onbelast)</span></span><span class="v">${U.fmtEuro(t.reiskostenTot)}</span></div>
        <div class="rule"></div>
        <div class="row netto"><span class="k">Netto</span><span class="v">${U.fmtEuro(t.nettoTot)}</span></div>
        <div class="netto-ratio-wrap"><div class="netto-ratio-meta"><span>Netto verhouding</span><b>${nettoRatio}%</b></div><div class="netto-bar-bg"><div class="netto-bar-fg" style="width:${nettoRatio}%"></div></div></div>`;
    } else {
      lsRows = `<div class="row bruto"><span class="k">Bruto totaal</span><span class="v">${U.fmtEuro(M.svBase)}</span></div>
        <div class="row"><span class="k">Reiskosten <span class="f">(onbelast)</span></span><span class="v">${U.fmtEuro(t.reiskostenTot)}</span></div>
        <div class="rule"></div>
        <div class="row netto"><span class="k">Bruto + reiskosten</span><span class="v">${U.fmtEuro(t.brutoTot)}</span></div>`;
    }

    const bewerk = !!ctx.overzichtBewerk;
    const widgetDefs = {
      week: { label: 'Deze week', html: `<div class="card clickable" data-action="goto-dag" data-iso="${vandaagIso}"><div class="lab">${ICON.week}Deze week</div><div class="big">${U.fmtUren(urenWeek).replace('u', '')}<small> u</small></div><div class="sub">${U.fmtEuro(weekBedrag)} ${weergave}</div></div>` },
      maand: { label: 'Deze maand (uren)', html: `<div class="card clickable" data-action="goto-dag" data-iso="${vandaagIso}"><div class="lab">${ICON.maand}Deze maand</div><div class="big">${U.fmtUren(urenMaand).replace('u', '')}<small> u</small></div><div class="sub">${U.fmtEuro(maandBedrag)} ${weergave}</div></div>` },
      vakantiegeld: { label: 'Vakantiegeld', html: `<div class="card clickable" data-action="pagina" data-val="loonstrook"><div class="lab">${ICON.euro}Vakantiegeld</div><div class="big">${U.fmtEuro(M.vakantiegeld)}</div><div class="sub muted">deze maand opgebouwd</div></div>` },
      volgende: { label: 'Volgende werkdag', html: volg ? `<div class="card clickable" data-action="goto-dag-flash" data-iso="${volg}"><div class="lab">${ICON.pijl}Volgende werkdag</div><div class="big" style="font-size:1.2rem;margin-top:.5rem">${volgBig}</div><div class="sub">${volgSub}</div></div>` : `<div class="card"><div class="lab">${ICON.pijl}Volgende werkdag</div><div class="big" style="font-size:1.2rem;margin-top:.5rem">${volgBig}</div><div class="sub">${volgSub}</div></div>` },
      voortgang: { label: 'Werkdag vandaag', html: progCard },
      maanddetail: { label: 'Deze maand (bedragen)', html: `<div class="card"><div class="lab">${ICON.euro}Deze maand</div><div class="bd" style="box-shadow:none;border:0;padding:.6rem 0 0;background:transparent">${lsRows}</div>${uurloonBlok}</div>` },
      binnenkort: { label: 'Binnenkort', html: `<div class="card"><div class="lab">${ICON.klok}Binnenkort</div><div class="up">
            <button class="up-row btn-row" data-action="goto-dag" data-iso="${d19Iso}"><span class="ic hr">${ICON.omhoog}</span><span><b>${d19.getDate()} ${MAAND[d19.getMonth()]}</b> <span class="d">— uren indienen</span><span class="days-away">${daysAway(agen19)}</span></span></button>
            <button class="up-row btn-row" data-action="goto-dag" data-iso="${d25Iso}"><span class="ic pay">${ICON.euro}</span><span><b>${d25.getDate()} ${MAAND[d25.getMonth()]}</b> <span class="d">— salaris</span><span class="days-away">${daysAway(agen25)}</span></span></button>
          </div></div>` },
    };
    const reg = ['week', 'maand', 'vakantiegeld', 'volgende', 'voortgang', 'maanddetail', 'binnenkort'];
    let cfg = (state.instellingen.overzichtWidgets || []).filter(wd => reg.includes(wd.id));
    reg.forEach(id => { if (!cfg.some(wd => wd.id === id)) cfg.push({ id, zicht: true, groot: false }); });

    const editKnop = `<button class="btn ${bewerk ? 'primary' : ''}" data-action="ov-bewerk">${ICON.pen}${bewerk ? 'Klaar' : 'Indeling'}</button>`;

    let cards;
    if (bewerk) {
      cards = cfg.map(wd => {
        const d = widgetDefs[wd.id];
        return `<div class="ov-w ${wd.groot ? 'groot' : ''} ${wd.zicht ? '' : 'ov-uit'}" draggable="true" data-action="ov-w" data-id="${wd.id}">
          <div class="ov-ctrls"><span class="ov-drag" aria-hidden="true">⋮⋮</span><span class="ov-wlabel">${d.label}</span>
            <button class="ov-cbtn" data-action="ov-size" data-id="${wd.id}" title="Grootte">${wd.groot ? '1×' : '2×'}</button>
            <button class="ov-cbtn" data-action="ov-${wd.zicht ? 'hide' : 'show'}" data-id="${wd.id}">${wd.zicht ? 'Verberg' : 'Toon'}</button>
          </div>
          <div class="ov-prev">${d.html}</div></div>`;
      }).join('');
    } else {
      cards = cfg.filter(wd => wd.zicht).map(wd => `<div class="ov-w ${wd.groot ? 'groot' : ''}">${widgetDefs[wd.id].html}</div>`).join('');
    }

    return `${paginakopHTML('Overzicht', weergave, true, editKnop)}
      ${bewerk ? '<div class="ov-hint">Sleep om te ordenen · 2× = dubbele breedte · verberg wat je niet nodig hebt.</div>' : ''}
      <div class="ov-grid${bewerk ? ' bewerk' : ''}" data-rol="ov-grid" data-scroll>${cards}</div>`;
  }

  // ---------- KALENDER ----------
  function dagCelHTML(c, ctx, map, idx) {
    const { state, weergave } = ctx;
    if (c.uitMaand) return `<div class="c out"><div class="c-top"><span class="num">${c.dagNummer}</span></div></div>`;
    if (c.geblokkeerd) return `<div class="c holi" data-action="holi" data-naam="${esc(c.feestdag)}"><div class="c-top"><span class="num">${c.dagNummer}</span>${ICON.slot.replace('<svg', '<svg class="lock"')}</div><div class="holi-naam">${esc(c.feestdag)}</div></div>`;

    const pd = map[c.iso];
    const heeftWerk = !!pd;

    const heeftNotitie = !!(state.dagen[c.iso] && state.dagen[c.iso].notitie);
    const marks = [];
    if (heeftWerk) marks.push(`<span class="mk loc">${state.dagen[c.iso].locatie === 'thuis' ? 'T' : 'K'}</span>`);
    if (c.hrDeadline) marks.push('<span class="mk hr" title="Uren indienen"></span>');
    if (c.salarisdag) marks.push('<span class="mk pay">€</span>');
    if (c.toeslag > 0) marks.push(`<span class="mk toesl" title="Toeslag +${Math.round(c.toeslag * 100)}%">+${Math.round(c.toeslag * 100)}%</span>`);
    if (heeftNotitie) marks.push('<span class="mk note" title="Heeft opmerking"></span>');

    const specialLabel = c.hrDeadline ? `<div class="c-special hr">Uren indienen</div>` : c.salarisdag ? `<div class="c-special pay">Salaris</div>` : '';

    let werk = '';
    if (pd) { const bedrag = weergave === 'bruto' ? pd.bruto : pd.netto; werk = `<div class="c-work"><span class="u">${U.fmtUren(pd.betaaldeUren)}</span><span class="e">${eK(bedrag)}</span></div>`; }

    const cls = ['c']; if (c.vandaag) cls.push('today'); if (c.zondag) cls.push('weekend'); if (c.toeslag > 0) cls.push('toeslagdag'); if (heeftWerk) cls.push('worked', 'has-content'); if (heeftNotitie) cls.push('has-note'); if (ctx.highlightIso === c.iso) cls.push('flash');
    const draggable = heeftWerk ? ' draggable="true"' : '';
    return `<div class="${cls.join(' ')}"${draggable} data-action="dag" data-iso="${c.iso}">
      <div class="c-top"><span class="num">${c.dagNummer}</span><span class="marks">${marks.join('')}</span></div>
      ${specialLabel}
      ${werk}
    </div>`;
  }

  function kalenderPage(ctx) {
    const { state, weergave, zicht } = ctx;
    const cellen = KAL.maandModel(zicht.jaar, zicht.maand, state.dagen, state.instellingen, ctx.vandaagIso);
    const { map } = maandResultaat(state, zicht.jaar, zicht.maand);
    const cellHTML = cellen.map((c, i) => dagCelHTML(c, ctx, map, i)).join('');

    const M = maandTotalen(state, zicht.jaar, zicht.maand);
    const urenMaand = ST.urenInMaand(state.dagen, zicht.jaar, zicht.maand);

    const VOLDAG = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag'];
    const dow = VOLDAG.map((d, i) => `<b class="${i >= 5 ? 'we' : ''}" title="${d}"><span class="dow-lg">${d}</span><span class="dow-sm">${d.slice(0, 2)}</span></b>`).join('');

    return `${paginakopHTML('Kalender', weergave, true)}
      <div class="kal-wrap">
        <div class="calcard">
          <div class="calhead">
            <button class="nav-btn" data-action="prev" aria-label="Vorige maand">${ICON.chevL}</button>
            <h3>${MAAND[zicht.maand - 1].charAt(0).toUpperCase() + MAAND[zicht.maand - 1].slice(1)} ${zicht.jaar}</h3>
            <button class="nav-btn" data-action="next" aria-label="Volgende maand">${ICON.chevR}</button>
            <button class="today-btn" data-action="today">Vandaag</button>
          </div>
          <div class="dow">${dow}</div>
          <div class="cal">${cellHTML}</div>
        </div>
        <aside class="kal-rail">
          <div class="card"><div class="lab">${ICON.maand}Deze maand</div>
            <div class="bd" style="box-shadow:none;border:0;padding:.6rem 0 0;background:transparent">
              <div class="row"><span class="k">Uren</span><span class="v">${U.fmtUren(urenMaand)}</span></div>
              <div class="row"><span class="k">Bruto</span><span class="v">${U.fmtEuro(M.brutoTot)}</span></div>
              <div class="row netto"><span class="k">Netto</span><span class="v">${U.fmtEuro(M.netto)}</span></div>
              <div class="row"><span class="k">Vakantiegeld</span><span class="v">${U.fmtEuro(M.vakantiegeld)}</span></div>
            </div>
          </div>
          <div class="card"><div class="lab">Legenda</div>
            <div class="legend">
              <span class="leg-row stat"><span class="leg-dot" style="background:var(--verdiend)"></span><span>gewerkt</span></span>
              <span class="leg-row stat"><span class="leg-dot" style="background:var(--suntint)"></span><span>toeslagdag</span></span>
              <span class="leg-row stat"><span class="leg-dot circ" style="background:var(--accent)"></span><span>19e: indienen</span></span>
              <span class="leg-row stat"><span class="leg-dot circ" style="background:var(--verdiend-soft)"></span><span>25e: salaris</span></span>
              <span class="leg-row stat"><span class="leg-dot" style="background:var(--surf3);border:1px solid var(--border-2)"></span><span>feestdag</span></span>
              <span class="leg-row stat"><span class="leg-dot" style="background:color-mix(in srgb,#F472B6 40%,var(--surf2))"></span><span>opmerking</span></span>
            </div>
          </div>
        </aside>
      </div>`;
  }

  // ---------- LOONSTROOK ----------
  function loonstrookPage(ctx) {
    const { state, weergave, zicht } = ctx;
    const { res } = maandResultaat(state, zicht.jaar, zicht.maand);
    const t = res.totalen;
    const salaris = res.perDag.reduce((s, d) => s + d.basisloon, 0);
    const toeslag = res.perDag.reduce((s, d) => s + d.toeslag, 0);
    const svBase = t.brutoTot - t.reiskostenTot;
    const netto = weergave === 'netto';
    const pct = n => svBase > 0 && n > 0 ? `<span class="pct-badge">${(n / svBase * 100).toFixed(1)}%</span>` : '';
    const nettoRatio = t.brutoTot > 0 ? Math.round(t.nettoTot / t.brutoTot * 100) : 0;

    let rows = `<div class="row"><span class="k">Salaris</span><span class="v">${U.fmtEuro(salaris)}</span></div>`;
    if (toeslag > 0) rows += `<div class="row toeslag"><span class="k">Toeslag</span><span class="v">${U.fmtEuro(toeslag)}</span></div>`;
    rows += `<div class="rule"></div><div class="row bruto"><span class="k">Bruto totaal</span><span class="v">${U.fmtEuro(svBase)}</span></div>`;
    if (netto) {
      rows += `<div class="row inhoud sub-i"><span class="k">Pensioen${pct(t.pensioen)}</span><span class="v">−${U.fmtEuro(t.pensioen)}</span></div>
        <div class="row inhoud sub-i"><span class="k">PAWW${pct(t.paww)}</span><span class="v">−${U.fmtEuro(t.paww)}</span></div>
        <div class="row inhoud sub-i"><span class="k">WGA${pct(t.wga)}</span><span class="v">−${U.fmtEuro(t.wga)}</span></div>
        <div class="row inhoud sub-i"><span class="k">Loonheffing (tabel)${pct(t.loonheffingTabel)}</span><span class="v">−${U.fmtEuro(t.loonheffingTabel)}</span></div>
        <div class="row inhoud sub-i"><span class="k">Loonheffing (bijz. tarief)${pct(t.loonheffingBT)}</span><span class="v">−${U.fmtEuro(t.loonheffingBT)}</span></div>`;
    }
    rows += `<div class="row"><span class="k">Reiskosten <span class="f">(onbelast)</span></span><span class="v">${U.fmtEuro(t.reiskostenTot)}</span></div>`;
    if (netto) {
      rows += `<div class="rule"></div><div class="row netto"><span class="k">Netto</span><span class="v">${U.fmtEuro(t.nettoTot)}</span></div>`;
      rows += `<div class="netto-ratio-wrap"><div class="netto-ratio-meta"><span>Netto verhouding</span><b>${nettoRatio}%</b></div><div class="netto-bar-bg"><div class="netto-bar-fg" style="width:${nettoRatio}%"></div></div><div class="netto-ratio-meta" style="margin-top:.3rem;margin-bottom:0"><span>${U.fmtEuro(t.nettoTot)} van ${U.fmtEuro(t.brutoTot)} bruto</span></div></div>`;
    } else rows += `<div class="rule"></div><div class="row netto"><span class="k">Bruto + reiskosten</span><span class="v">${U.fmtEuro(t.brutoTot)}</span></div>`;

    const dagRows = res.perDag.map(d => {
      const dt = new Date(d.datum + 'T00:00:00');
      const ds = state.dagen[d.datum] || {};
      const bedrag = netto ? d.netto : d.bruto;
      const allShifts = [{ van: ds.van, tot: ds.tot }];
      if (ds.extra) ds.extra.forEach(e => allShifts.push(e));
      const tijden = allShifts.filter(s => s.van && s.tot).map(s => `${s.van}–${s.tot}`).join(', ');
      const locTekst = ds.locatie === 'thuis' ? 'Thuis' : 'Kantoor';
      const fr = REK.toeslagFractie({ datum: d.datum, zondagToeslag: ds.zondagToeslag != null ? ds.zondagToeslag : undefined }, state.instellingen);
      return `<div class="dag-row">
        <span class="dr-dt">${U.dagNaam(dt)}, ${dt.getDate()} ${MAAND[dt.getMonth()]}${fr > 0 ? ` <span class="dr-tsl">+${Math.round(fr * 100)}%</span>` : ''}</span>
        <span class="dr-tijd">${tijden}</span>
        <span class="dr-loc-t">${locTekst}</span>
        <span class="dr-uren">${U.fmtUren(d.betaaldeUren)}</span>
        <span class="dr-bedrag">${U.fmtEuro(bedrag)}</span>
      </div>`;
    }).join('');
    const dagListCard = res.perDag.length ? `<div class="card">
      <div class="lab">${ICON.week}Gewerkte dagen · ${res.perDag.length} dag${res.perDag.length !== 1 ? 'en' : ''}</div>
      <div class="dag-list">${dagRows}</div>
    </div>` : `<div class="card"><div class="lab">${ICON.week}Gewerkte dagen</div><div class="sub muted" style="margin-top:.6rem">Nog geen gewerkte dagen deze maand.</div></div>`;

    const totUren = res.perDag.reduce((s, d) => s + d.betaaldeUren, 0);
    const brutoUur = state.instellingen.uurloon;
    const nettoUur = totUren > 0 ? t.nettoTot / totUren : 0;
    const uurloonCard = `<div class="card"><div class="lab">${ICON.euro}Uurloon</div>
      <div class="uurloon-grid">
        <div class="ul-box"><span class="ul-l">Bruto per uur</span><span class="ul-v">${U.fmtEuro(brutoUur)}</span></div>
        <div class="ul-box net"><span class="ul-l">Netto per uur <span class="f">(gemiddeld)</span></span><span class="ul-v">${U.fmtEuro(nettoUur)}</span></div>
      </div></div>`;

    return `${paginakopHTML('Loonstrook', weergave)}
      <div class="loon-wrap">
        <div class="loon-main">
          <div class="calhead">
            <button class="nav-btn" data-action="prev" aria-label="Vorige maand">${ICON.chevL}</button>
            <h3>${MAAND[zicht.maand - 1].charAt(0).toUpperCase() + MAAND[zicht.maand - 1].slice(1)} ${zicht.jaar}</h3>
            <button class="nav-btn" data-action="next" aria-label="Volgende maand">${ICON.chevR}</button>
            <button class="today-btn" data-action="today">Deze maand</button>
          </div>
          <div class="card"><div class="bd" style="box-shadow:none;border:0;background:transparent;padding:0">${rows}</div>
            <div class="foot" style="margin-top:1rem">${ICON.slot}Vakantiegeld opgebouwd deze maand: ${U.fmtEuro(t.vakantiegeldReservering)} (in mei uitbetaald).</div>
          </div>
        </div>
        <div>${uurloonCard}${dagListCard}</div>
      </div>`;
  }

  // ---------- INSTELLINGEN ----------
  function geldVeld(id, val) { return `<div class="amount"><span class="e">€</span><input id="${id}" class="amt-in" type="text" inputmode="decimal" value="${val}"></div>`; }
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
      <div class="hint" style="margin-bottom:.6rem">Kies je achtergrond- en kaartkleur — de tekst wordt automatisch leesbaar gekozen. De accentkleur stel je hierboven in.</div>${rows}</div>`;
  }
  function overzettenHTML() {
    return `<div class="group-lab" style="margin-top:1rem">${ICON.up2}Overzetten tussen apparaten</div>
      <div class="hint" style="margin-bottom:.5rem">Kopieer de code op dit apparaat en plak 'm op je andere apparaat (of andersom). Geen QR nodig.</div>
      <button class="btn" data-action="code-toon" style="width:100%;justify-content:center">${ICON.down}<span data-rol="code-knop-tekst">Toon mijn code</span></button>
      <div class="mijn-code hidden" data-rol="mijn-code">
        <textarea class="note-input" id="overzet-mijncode" readonly spellcheck="false" style="font-family:monospace;font-size:.72rem;margin-top:.5rem"></textarea>
      </div>
      <div class="group-lab" style="margin-top:1rem">Code van ander apparaat</div>
      <textarea class="note-input" id="overzet-code" placeholder="Plak hier een code van je andere apparaat…" spellcheck="false" style="font-family:monospace;font-size:.72rem"></textarea>
      <div class="actions" style="margin-top:.5rem"><button class="btn primary" data-action="code-toepassen" style="flex:1">${ICON.vink}Code toepassen</button></div>`;
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

    return `${paginakopHTML('Instellingen', ctx.weergave, false)}
      <div class="set-wrap" data-scroll><div class="set-sections">
        <section class="set-sec wide"><h3 class="set-h">${ICON.persoon}Profiel</h3>
          <div class="set-row"><div class="info"><div class="name">Wie ben je?</div><div class="hint">Elk profiel houdt eigen uren én instellingen bij.</div></div>
            <button class="btn" data-action="wissel-profiel">${ICON.wissel}${esc(ctx.profielNaam || 'Kies profiel')}</button></div>
          ${ctx.syncBeschikbaar ? `<div class="set-row"><div class="info"><div class="name">Synchronisatie tussen apparaten</div><div class="hint">Staat automatisch aan. ${esc(ctx.syncTekst || '')}</div></div></div>` : ''}
        </section>
        <section class="set-sec wide"><h3 class="set-h">${ICON.euro}Loon &amp; toeslag</h3>
          <div class="set-grid2">
            <div class="set-row"><div class="info"><div class="name">Uurloon</div><div class="hint">Je bruto loon per uur.</div></div>${geldVeld('set-uurloon', i.uurloon)}</div>
            <div class="set-row"><div class="info"><div class="name">Reiskostenvergoeding per kantoordag</div><div class="hint">Onbelaste vergoeding op kantoordagen.</div></div>${geldVeld('set-reis', i.reiskostenPerKantoordag)}</div>
          </div>
          <div class="set-row"><div class="info"><div class="name">Zondagtoeslag +50%</div><div class="hint">Standaard op zondagen. Per zondag aan/uit in de kalender.</div></div>${switchHTML('set-zondagtoeslag', !!i.zondagToeslag)}</div>
        </section>
        <section class="set-sec wide"><h3 class="set-h">${ICON.palette}Uiterlijk</h3>
          <div class="group-lab" style="margin-top:0">Thema</div>
          <div class="theme-grid">${themaCards}</div>
          <div class="set-row" style="border:0;padding:.9rem 0 .3rem"><div class="info"><div class="name">Accentkleur</div><div class="hint">Bepaalt knoppen, "vandaag" en accenten.</div></div></div>
          <div class="sw-row">${swatches}</div>
          ${themaKleurenHTML(i)}
        </section>
        <section class="set-sec wide"><h3 class="set-h">${ICON.down}Data</h3>
          <div class="set-row"><div class="info"><div class="name">Standaard weergave</div><div class="hint">Bruto = puur bruto · Netto = mét loonheffingskorting en inhoudingen.</div></div>
            <div class="seg" role="tablist"><button data-action="set-weergave" data-val="bruto" aria-selected="${w === 'bruto'}">Bruto</button><button data-action="set-weergave" data-val="netto" aria-selected="${w === 'netto'}">Netto</button></div></div>
          <div class="actions" style="margin-top:.5rem"><button class="btn" data-action="export" style="flex:1">${ICON.down}Exporteren (bestand)</button><button class="btn" data-action="import" style="flex:1">${ICON.up2}Importeren (bestand)</button></div>
          ${overzettenHTML()}
          <div class="foot">${ICON.slot}Alles wordt lokaal in je browser bewaard en blijft na herstart staan.</div>
        </section>
      </div></div>`;
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
  function shellHTML(ctx) {
    return `<aside class="sb">${sidebarHTML(ctx)}</aside><main id="content" class="content">${pageHTML(ctx)}</main>`;
  }

  // ---------- DAG-DETAIL ----------
  function voortgangHTML(b, ctx) {
    const isVandaag = b.iso === ctx.vandaagIso;
    const geldig = U.parseTime(b.tot) > U.parseTime(b.van);
    if (!isVandaag || !geldig) return '';
    const shifts = [{ van: b.van, tot: b.tot }, ...(b.extra || [])];
    const v = UR.voortgangShifts(shifts, ctx.nuMin);
    const bezig = v.status === 'bezig' || v.status === 'pauze';
    const meta = v.status === 'voor' ? `begint om ${v.eersteVan}`
      : v.status === 'klaar' ? 'werkdag klaar'
      : v.status === 'pauze' ? `pauze · volgende dienst om ${v.volgendeVan}`
      : `<b>${Math.round(v.pct)}%</b> — nog ${resterend(v.resterendeMin)} tot ${v.huidigeTot}`;
    return `<div class="card prog-card">
      <div class="prog-meta" style="margin-bottom:.4rem"><span class="lab" style="margin:0">Voortgang werkdag</span>${bezig ? '<span class="live"><span class="pd"></span>Bezig</span>' : ''}</div>
      <div class="track"><div class="fill" style="width:${v.pct}%"></div></div>
      <div class="prog-meta" style="margin-top:.4rem"><span>${meta}</span></div></div>`;
  }

  function breakdownHTML(b, ctx) {
    _renderVersie = ctx.versie || 0; // ook bereikbaar via patchDag (buiten pageHTML); houd cache-sleutel actueel
    const { state } = ctx;
    const inst = state.instellingen;
    const dt = new Date(b.iso + 'T00:00:00');
    const dd = REK.dagBruto({ datum: b.iso, van: b.van, tot: b.tot, extra: b.extra, locatie: b.locatie, zondagToeslag: b.zondagToeslag }, inst);
    const brutoDag = dd.basisloon + dd.toeslag + dd.reiskosten;
    let bd = `<div class="row"><span class="k">Gewerkt</span><span class="v" style="color:var(--muted);font-weight:500">${U.fmtUren(dd.klokuren)} → <b style="color:var(--text)">${U.fmtUren(dd.betaaldeUren)} betaald</b></span></div>
      <div class="row"><span class="k">Basisloon <span class="f">${U.fmtUren(dd.betaaldeUren)} × ${U.fmtEuro(inst.uurloon)}</span></span><span class="v">${U.fmtEuro(dd.basisloon)}</span></div>`;
    if (dd.toeslag > 0) bd += `<div class="row toeslag"><span class="k">Toeslag</span><span class="v">${U.fmtEuro(dd.toeslag)}</span></div>`;
    if (dd.reiskosten > 0) bd += `<div class="row"><span class="k">Reiskosten <span class="f">(kantoor, onbelast)</span></span><span class="v">${U.fmtEuro(dd.reiskosten)}</span></div>`;
    bd += `<div class="rule"></div><div class="row bruto"><span class="k">Bruto totaal</span><span class="v">${U.fmtEuro(brutoDag)}</span></div>`;
    const { map } = maandResultaat(state, dt.getFullYear(), dt.getMonth() + 1);
    const pd = map[b.iso]; const nettoDag = pd ? pd.netto : brutoDag; const inhoud = brutoDag - nettoDag;
    bd += `<div class="row inhoud"><span class="k">Inhoudingen <span class="f">(belasting, pensioen e.d.)</span></span><span class="v">−${U.fmtEuro(inhoud)}</span></div>
      <div class="rule"></div><div class="row netto"><span class="k">Netto deze dag</span><span class="v">${U.fmtEuro(nettoDag)}</span></div>`;
    return bd;
  }

  function tijdlijnHTML(b) {
    const shifts = [{ van: b.van, tot: b.tot }, ...(b.extra || [])];
    const seg = TK.segmenten(shifts);
    if (!seg.delen.length) return '';
    const span = seg.max - seg.min || 1;
    const pos = s => ((s - seg.min) / span * 100).toFixed(2);
    const balk = seg.delen.map(d => {
      const left = pos(d.van), w = (pos(d.tot) - pos(d.van)).toFixed(2);
      const cls = d.type === 'werk' ? 'tl-werk' : 'tl-pauze';
      const tt = `${TK.fromStep(d.van)}–${TK.fromStep(d.tot)}`;
      return `<div class="tl-seg ${cls}" style="left:${left}%;width:${w}%" title="${tt}"></div>`;
    }).join('');
    return `<div class="tl-wrap" data-rol="tijdlijn">
      <div class="tl-bar">${balk}</div>
      <div class="tl-ends"><span>${TK.fromStep(seg.min)}</span><span>${TK.fromStep(seg.max)}</span></div>
      <div class="tl-leg"><span class="tl-k werk">Werk</span><span class="tl-k pauze">Pauze / tussentijd</span></div>
    </div>`;
  }

  // Native tijd-invoer: typbaar én op mobiel de OS-tijdkiezer (zoals iOS). Compact, geen popup-groei.
  function tijdVeldHTML(idx, veld, waarde) {
    return `<input class="tv-in" type="time" step="60" value="${waarde}" data-action="tijd" data-veld="${veld}" data-idx="${idx}"
      aria-label="${veld === 'van' ? 'Begintijd' : 'Eindtijd'} dienst ${idx + 1}">`;
  }

  function shiftSectieHTML(b) {
    const shifts = [{ van: b.van, tot: b.tot }, ...(b.extra || [])];
    const canAdd = shifts.length < 3;
    const rows = shifts.map((sh, i) => {
      return `<div class="shift-item" data-shift-idx="${i}">
        <div class="shift-head">
          ${shifts.length > 1 ? `<span class="shift-nr">Dienst ${i + 1}</span>` : '<span class="shift-nr">Werktijd</span>'}
          ${i > 0 ? `<button class="btn-icon" data-action="shift-del" data-idx="${i - 1}" aria-label="Verwijder dienst ${i + 1}">${ICON.kruis}</button>` : ''}
        </div>
        <div class="tv-row">
          <label class="tv-lab">Van${tijdVeldHTML(i, 'van', sh.van)}</label>
          <label class="tv-lab">Tot${tijdVeldHTML(i, 'tot', sh.tot)}</label>
        </div>
      </div>`;
    }).join('');
    return rows
      + (canAdd ? `<button class="btn ghost" data-action="shift-add" style="width:100%;margin-top:.55rem;justify-content:center">${ICON.plus}Dienst toevoegen</button>` : '');
  }

  function toeslagSectieHTML(b, ctx) {
    const inst = ctx.state.instellingen;
    if (new Date(b.iso + 'T00:00:00').getDay() !== 0) return ''; // alleen zondag
    const aan = b.zondagToeslag != null ? b.zondagToeslag : !!inst.zondagToeslag;
    return `<div class="sec"><div class="lab">${ICON.euro}Toeslag deze dag</div>
      <div class="set-row" style="border:0;padding:0">
        <div class="info"><div class="name">Zondagtoeslag +50%</div>
          <div class="hint">${inst.zondagToeslag ? 'Staat standaard aan op zondagen.' : 'Staat standaard uit.'}</div></div>
        ${switchHTML('dag-zondagtoeslag', aan)}
      </div></div>`;
  }

  function dagDetailHTML(b, ctx) {
    const { state, vandaagIso } = ctx;
    const dt = new Date(b.iso + 'T00:00:00');
    const isVandaag = b.iso === vandaagIso;
    const geldig = U.parseTime(b.tot) > U.parseTime(b.van);
    return `<div class="sheet wide" role="dialog" aria-modal="true">
      <div class="sh-head"><div><div class="t">${U.dagNaam(dt)} ${dt.getDate()} ${MAAND[dt.getMonth()]} ${dt.getFullYear()}</div>${isVandaag ? '<span class="chip">Vandaag</span>' : ''}</div>
        <button class="x" data-action="sluit" aria-label="Sluiten">${ICON.kruis}</button></div>
      <div class="sh-prog" data-rol="prog">${voortgangHTML(b, ctx)}</div>
      <div class="sh-cols">
        <div class="sh-col">
          <div class="sec"><div class="lab">${ICON.klok}Werktijden</div>
            <div data-rol="shifts">${shiftSectieHTML(b)}</div>
            <div data-rol="tijdlijn">${tijdlijnHTML(b)}</div>
            <div data-rol="tijdfout" style="color:var(--danger);font-size:.78rem;margin-top:.5rem">${geldig ? '' : 'Eindtijd moet na de begintijd liggen.'}</div></div>
          <div class="sec"><div class="lab">Locatie</div>
            <div class="seg full" role="tablist">
              <button data-action="loc" data-val="kantoor" aria-selected="${b.locatie === 'kantoor'}">${ICON.kantoor}Kantoor</button>
              <button data-action="loc" data-val="thuis" aria-selected="${b.locatie === 'thuis'}">${ICON.thuis}Thuis</button>
            </div></div>
          <div class="sec"><div class="lab">${ICON.pen}Notitie</div>
            <textarea class="note-input" id="notitie" placeholder="Bijv. drukke dag, extra taak…">${esc(b.notitie || '')}</textarea></div>
        </div>
        <div class="sh-col">
          <div class="sec"><div class="lab">${ICON.euro}Verdiend op deze dag</div>
            <div class="bd" data-rol="bd">${breakdownHTML(b, ctx)}</div></div>
          <div data-rol="toeslag">${toeslagSectieHTML(b, ctx)}</div>
        </div>
      </div>
      <div class="actions"><button class="btn primary" data-action="opslaan" data-rol="opslaan" ${geldig ? '' : 'disabled style="opacity:.5"'}>${ICON.vink}Werkdag opslaan</button>
        ${state.dagen[b.iso] ? `<button class="btn danger" data-action="verwijderen">${ICON.prul}Verwijderen</button>` : ''}</div>
    </div>`;
  }

  function profielKiezerHTML(ctx) {
    const lijst = ctx.profielen || [];
    const kaarten = lijst.map(p => `<button class="profiel-kaart ${ctx.profiel === p.id ? 'on' : ''}" data-action="kies-profiel" data-id="${p.id}">
        <span class="pf-avatar">${initialen(p.naam)}</span>
        <span class="pf-naam">${esc(p.naam)}</span>
        ${ctx.profiel === p.id ? `<span class="pf-vink">${ICON.vink}</span>` : ''}</button>`).join('');
    const sluit = ctx.profiel ? `<button class="x" data-action="sluit" aria-label="Sluiten">${ICON.kruis}</button>` : '';
    return `<div class="sheet profiel-sheet" role="dialog" aria-modal="true" aria-label="Kies profiel">
      <div class="sh-head"><div><div class="t">Wie ben je?</div></div>${sluit}</div>
      <p class="pf-uitleg">Kies je profiel. Ieder houdt z'n eigen uren bij; je blijft op dit apparaat ingelogd en alles synchroniseert automatisch tussen je apparaten.</p>
      <div class="profiel-grid">${kaarten}</div>
    </div>`;
  }

  return { shellHTML, pageHTML, dagDetailHTML, breakdownHTML, voortgangHTML, shiftSectieHTML, toeslagSectieHTML, tijdlijnHTML, profielKiezerHTML };
});
