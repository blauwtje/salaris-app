(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else { root.Salaris = root.Salaris || {}; root.Salaris.tijdkiezer = factory(); }
})(typeof self !== 'undefined' ? self : this, function () {
  const pad = n => String(n).padStart(2, '0');
  const MAX = 23 * 60 + 55;

  function normaliseer(s) {
    let [h, m] = String(s).split(':').map(Number);
    if (isNaN(h)) h = 0; if (isNaN(m)) m = 0;
    m = Math.round(m / 5) * 5;
    let t = h * 60 + m;
    t = Math.max(0, Math.min(MAX, t));
    return pad(Math.floor(t / 60)) + ':' + pad(t % 60);
  }
  function stap(s, deltaMin) {
    let [h, m] = String(s).split(':').map(Number);
    let t = ((h * 60 + m) + deltaMin) % 1440;
    if (t < 0) t += 1440;
    return pad(Math.floor(t / 60)) + ':' + pad(t % 60);
  }
  // 5-min steps: step 0 = 0:00, step 287 = 23:55
  function toStep(t) {
    const parts = (t || '00:00').split(':');
    const h = parseInt(parts[0], 10) || 0, m = parseInt(parts[1], 10) || 0;
    return Math.max(0, Math.min(287, h * 12 + Math.round(m / 5)));
  }
  function fromStep(s) {
    s = Math.max(0, Math.min(287, s));
    return pad(Math.floor(s / 12)) + ':' + pad((s % 12) * 5);
  }
  function paneelHTML(van, tot) {
    const sv = toStep(van), st = toStep(tot);
    const fl = (sv / 287 * 100).toFixed(2), fw = ((st - sv) / 287 * 100).toFixed(2);
    return `<div class="tk-range-wrap">
      <div class="tk-rl-row">
        <span class="tk-rl"><small>Van</small><b data-rol="rl-van">${van}</b></span>
        <span class="tk-rl"><small>Tot</small><b data-rol="rl-tot">${tot}</b></span>
      </div>
      <div class="tk-dual">
        <div class="tk-track-bg"></div>
        <div class="tk-track-fill" data-rol="tf" style="left:${fl}%;width:${fw}%"></div>
        <input type="range" class="tk-range tk-r-van" data-action="tk-slide" data-type="van" min="0" max="287" value="${sv}" aria-label="Begintijd">
        <input type="range" class="tk-range tk-r-tot" data-action="tk-slide" data-type="tot" min="0" max="287" value="${st}" aria-label="Eindtijd">
      </div>
      <div class="tk-extremes"><span>0:00</span><span>23:55</span></div>
    </div>`;
  }
  function segmenten(shifts) {
    const items = (shifts || [])
      .map(s => ({ van: toStep(s.van), tot: toStep(s.tot) }))
      .filter(s => s.tot > s.van)
      .sort((a, b) => a.van - b.van);
    if (!items.length) return { min: 0, max: 0, delen: [] };
    const min = items[0].van, max = items[items.length - 1].tot;
    const delen = []; let cur = min;
    for (const it of items) {
      if (it.van > cur) delen.push({ type: 'pauze', van: cur, tot: it.van });
      delen.push({ type: 'werk', van: it.van, tot: it.tot });
      cur = Math.max(cur, it.tot);
    }
    return { min, max, delen };
  }
  return { normaliseer, stap, paneelHTML, toStep, fromStep, segmenten };
});
