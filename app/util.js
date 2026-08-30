(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else { root.Salaris = root.Salaris || {}; root.Salaris.util = factory(); }
})(typeof self !== 'undefined' ? self : this, function () {
  const DAGEN = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
  const MAANDEN = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];

  function fmtEuro(n) {
    const neg = n < 0;
    const s = (Math.round(Math.abs(n) * 100) / 100).toFixed(2).replace('.', ',');
    const met = s.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return (neg ? '−' : '') + '€' + met;
  }
  function fmtUren(h) { return (Math.round(h * 10) / 10).toFixed(1).replace('.', ',') + 'u'; }
  function parseTime(s) { const [h, m] = s.split(':').map(Number); return h * 60 + m; }

  // Tijden staan altijd als "HH:MM" (24-uurs) in de opslag - dat is ook wat een <input type=time>
  // teruggeeft. Op het scherm volgen we het apparaat: staat dat op 12-uurs, dan lezen alle tijden
  // in de app als "9:00 AM". Eén keer bepalen; de klokinstelling wijzigt niet tijdens een sessie.
  let _klok12 = null;
  function klok12() {
    if (_klok12 === null) {
      try {
        const o = new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).resolvedOptions();
        _klok12 = o.hour12 === true || o.hourCycle === 'h11' || o.hourCycle === 'h12';
      } catch (e) { _klok12 = false; }
    }
    return _klok12;
  }
  // `twaalf` overschrijft de apparaatinstelling (tests, en het voorbeeld in de instellingen).
  function fmtTijd(hhmm, twaalf) {
    if (!hhmm) return '';
    const [h, m] = String(hhmm).split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return String(hhmm);
    const mm = String(m).padStart(2, '0');
    if (!(twaalf === undefined ? klok12() : twaalf)) return `${String(h).padStart(2, '0')}:${mm}`;
    return `${h % 12 === 0 ? 12 : h % 12}:${mm} ${h < 12 ? 'AM' : 'PM'}`;
  }
  function fmtBereik(van, tot, twaalf) { return `${fmtTijd(van, twaalf)}–${fmtTijd(tot, twaalf)}`; }
  function isoDate(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function dagNaam(d) { return DAGEN[d.getDay()]; }
  function dagDatum(d) { return `${d.getDate()} ${MAANDEN[d.getMonth()]} ${d.getFullYear()}`; }

  return { fmtEuro, fmtUren, parseTime, isoDate, dagNaam, dagDatum, klok12, fmtTijd, fmtBereik };
});
