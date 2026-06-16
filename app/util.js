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
  function isoDate(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function dagNaam(d) { return DAGEN[d.getDay()]; }
  function dagDatum(d) { return `${d.getDate()} ${MAANDEN[d.getMonth()]} ${d.getFullYear()}`; }

  return { fmtEuro, fmtUren, parseTime, isoDate, dagNaam, dagDatum };
});
