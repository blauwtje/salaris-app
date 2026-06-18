(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports)
    module.exports = factory(require('./reken.js'), require('./feestdagen.js'));
  else { root.Salaris = root.Salaris || {}; root.Salaris.excel = factory(root.Salaris.reken, root.Salaris.feestdagen); }
})(typeof self !== 'undefined' ? self : this, function (reken, feestdagen) {
  const MAAND_NAMEN = ['JANUARI', 'FEBRUARI', 'MAART', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AUGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DECEMBER'];
  const DOW = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];

  function vorigeMaand(jaar, maand) {
    return maand === 1 ? { jaar: jaar - 1, maand: 12 } : { jaar, maand: maand - 1 };
  }
  function dagenVanMaand(state, jaar, maand) {
    const pre = `${jaar}-${String(maand).padStart(2, '0')}`;
    return Object.entries(state.dagen || {})
      .filter(([iso]) => iso.startsWith(pre) && !feestdagen.isFeestdag(iso))
      .map(([iso, d]) => ({ ...d, datum: iso }));
  }
  function fmtTijd(s) { return String(s).replace(/^0/, ''); }
  function vanTotStr(d) {
    const shifts = [{ van: d.van, tot: d.tot }].concat(d.extra || []);
    const txt = shifts.filter(s => s.van && s.tot).map(s => `${fmtTijd(s.van)}-${fmtTijd(s.tot)}`).join(', ');
    return d.locatie === 'thuis' && txt ? `${txt} (ONLINE)` : txt;
  }
  function maandModel(state, jaar, maand) {
    const inst = state.instellingen;
    const werk = dagenVanMaand(state, jaar, maand);
    const perDag = {};
    reken.maandReken(werk, inst).perDag.forEach(d => { perDag[d.datum] = d; });
    const werkMap = {};
    werk.forEach(d => { werkMap[d.datum] = d; });
    const dagenInMaand = new Date(jaar, maand, 0).getDate();
    const rijen = [];
    let totaalUren = 0, aantalDagen = 0, dagenThuis = 0, toeslagDagen = 0;
    for (let dag = 1; dag <= dagenInMaand; dag++) {
      const iso = `${jaar}-${String(maand).padStart(2, '0')}-${String(dag).padStart(2, '0')}`;
      const dow = DOW[new Date(jaar, maand - 1, dag).getDay()];
      const wd = werkMap[iso], pd = perDag[iso];
      const gewerkt = !!(wd && pd && (wd.van || (wd.extra && wd.extra.length)));
      if (gewerkt) {
        const uren = pd.betaaldeUren;
        const thuis = wd.locatie === 'thuis';
        rijen.push({ dow, dag, vanTot: vanTotStr(wd), uren, gewerkt: true, thuis });
        totaalUren += uren; aantalDagen++;
        if (thuis) dagenThuis++;
        if (reken.toeslagFractie(wd, inst) > 0) toeslagDagen++;
      } else {
        rijen.push({ dow, dag, vanTot: '', uren: '', gewerkt: false, thuis: false });
      }
    }
    return { jaar, maand, label: MAAND_NAMEN[maand - 1], rijen, totaalUren: Math.round(totaalUren * 100) / 100, aantalDagen, dagenThuis, toeslagDagen };
  }
  function urenkaartModel(state, maanden) {
    const kop = (state.instellingen && state.instellingen.urenkaart) || {};
    return { kop, maanden: maanden.map(m => maandModel(state, m.jaar, m.maand)) };
  }

  // ---------- .xlsx (OOXML, store-only ZIP, geen deps) ----------
  const CONTENT_TYPES = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>';
  const RELS = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>';
  const WORKBOOK = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Urenkaart" sheetId="1" r:id="rId1"/></sheets></workbook>';
  const WB_RELS = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>';
  const STYLES = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs></styleSheet>';

  function escXml(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function colLetter(n) { let s = ''; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = (n - m - 1) / 26; } return s; }

  function sheetXml(model) {
    const cellen = [];
    const tekst = (col, row, val, vet) => cellen.push({ row, col, xml: `<c r="${colLetter(col)}${row}" t="inlineStr"${vet ? ' s="1"' : ''}><is><t xml:space="preserve">${escXml(val)}</t></is></c>` });
    const getal = (col, row, val, vet) => cellen.push({ row, col, xml: `<c r="${colLetter(col)}${row}"${vet ? ' s="1"' : ''}><v>${val}</v></c>` });

    const k = model.kop || {};
    const koplijnen = [];
    if (k.naam) koplijnen.push(k.naam);
    if (k.reiskosten) koplijnen.push('Reiskosten: ' + k.reiskosten);
    if (k.adres) koplijnen.push('Adres: ' + k.adres);
    if (k.geboortedatum) koplijnen.push('Geboortedatum: ' + k.geboortedatum);
    if (k.bsn) koplijnen.push('BSN: ' + k.bsn);
    if (k.iban) koplijnen.push('IBAN: ' + k.iban);
    if (k.contract) koplijnen.push('Contract: ' + k.contract);
    koplijnen.forEach((lijn, i) => tekst(1, i + 1, lijn, i === 0));

    const blok = (maand, c0) => {
      tekst(c0, 10, maand.label, true);
      tekst(c0 + 2, 10, 'Van/Tot', true);
      tekst(c0 + 3, 10, 'Uren', true);
      maand.rijen.forEach(r => {
        const row = 10 + r.dag;
        tekst(c0, row, r.dow, false);
        getal(c0 + 1, row, r.dag, false);
        if (r.gewerkt) { tekst(c0 + 2, row, r.vanTot, false); getal(c0 + 3, row, r.uren, false); }
      });
      tekst(c0 + 2, 43, 'Totaal', true); getal(c0 + 3, 43, maand.totaalUren, true);
      tekst(c0 + 2, 44, 'Aantal dagen', true); getal(c0 + 3, 44, maand.aantalDagen, false);
      tekst(c0 + 2, 45, 'Dagen thuis', true); getal(c0 + 3, 45, maand.dagenThuis, false);
      tekst(c0 + 2, 46, 'Toeslag 150% (dagen)', true); getal(c0 + 3, 46, maand.toeslagDagen, false);
    };
    if (model.maanden[0]) blok(model.maanden[0], 1);
    if (model.maanden[1]) blok(model.maanden[1], 6);

    const perRij = {};
    cellen.forEach(c => { (perRij[c.row] = perRij[c.row] || []).push(c); });
    const rijXml = Object.keys(perRij).map(Number).sort((a, b) => a - b).map(rn => {
      const cs = perRij[rn].sort((a, b) => a.col - b.col).map(c => c.xml).join('');
      return `<row r="${rn}">${cs}</row>`;
    }).join('');
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rijXml}</sheetData></worksheet>`;
  }

  let _crcTabel;
  function crc32(bytes) {
    if (!_crcTabel) {
      _crcTabel = [];
      for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); _crcTabel[n] = c >>> 0; }
    }
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i++) crc = (crc >>> 8) ^ _crcTabel[(crc ^ bytes[i]) & 0xFF];
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }
  function zipStore(files) {
    const enc = new TextEncoder();
    const u16 = n => [n & 0xFF, (n >>> 8) & 0xFF];
    const u32 = n => [n & 0xFF, (n >>> 8) & 0xFF, (n >>> 16) & 0xFF, (n >>> 24) & 0xFF];
    const delen = [], centraal = [];
    let offset = 0;
    for (const f of files) {
      const naam = enc.encode(f.name), crc = crc32(f.data), grootte = f.data.length;
      const lokaal = new Uint8Array([].concat(u32(0x04034b50), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(crc), u32(grootte), u32(grootte), u16(naam.length), u16(0)));
      delen.push(lokaal, naam, f.data);
      centraal.push(new Uint8Array([].concat(u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(crc), u32(grootte), u32(grootte), u16(naam.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset))), naam);
      offset += lokaal.length + naam.length + f.data.length;
    }
    const centraalStart = offset;
    let centraalLengte = 0;
    centraal.forEach(b => { delen.push(b); centraalLengte += b.length; });
    delen.push(new Uint8Array([].concat(u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length), u32(centraalLengte), u32(centraalStart), u16(0))));
    let totaal = 0; delen.forEach(d => { totaal += d.length; });
    const uit = new Uint8Array(totaal);
    let p = 0; delen.forEach(d => { uit.set(d, p); p += d.length; });
    return uit;
  }
  function bouwXlsx(model) {
    const enc = new TextEncoder();
    return zipStore([
      { name: '[Content_Types].xml', data: enc.encode(CONTENT_TYPES) },
      { name: '_rels/.rels', data: enc.encode(RELS) },
      { name: 'xl/workbook.xml', data: enc.encode(WORKBOOK) },
      { name: 'xl/_rels/workbook.xml.rels', data: enc.encode(WB_RELS) },
      { name: 'xl/styles.xml', data: enc.encode(STYLES) },
      { name: 'xl/worksheets/sheet1.xml', data: enc.encode(sheetXml(model)) },
    ]);
  }

  return { urenkaartModel, vorigeMaand, bouwXlsx, sheetXml };
});
