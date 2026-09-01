(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else { root.Salaris = root.Salaris || {}; root.Salaris.sync = factory(); }
})(typeof self !== 'undefined' ? self : this, function () {
  // Supabase-project (publishable key mág publiek - de data wordt client-side versleuteld).
  const URL_BASE = 'https://gtnzuvyntdmbttlxlrme.supabase.co';
  const KEY = 'sb_publishable_1HaquDrwFzXiRmY0JhbP4g_9MaB5fWU';
  const REST = URL_BASE + '/rest/v1/profielen';
  // App-brede sleutel: geen wachtwoord meer. De payload blijft ciphertext-at-rest in Supabase,
  // maar dit is geen echte geheimhouding (de bron is publiek op GitHub Pages) - alleen obfuscatie.
  const APP_SECRET = 'salaris-app::vast::2026::thomas-aleyna';

  const webcrypto = (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle)
    ? globalThis.crypto
    : (typeof require !== 'undefined' ? require('crypto').webcrypto : null);
  const _btoa = typeof btoa !== 'undefined' ? btoa : (s => Buffer.from(s, 'binary').toString('base64'));
  const _atob = typeof atob !== 'undefined' ? atob : (s => Buffer.from(s, 'base64').toString('binary'));
  const enc = new TextEncoder();
  const dec = new TextDecoder();

  function b64(buf) { const a = new Uint8Array(buf); let s = ''; for (let i = 0; i < a.length; i++) s += String.fromCharCode(a[i]); return _btoa(s); }
  function unb64(str) { const s = _atob(str); const a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return a; }

  async function deriveKey(pass, salt) {
    const base = await webcrypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveKey']);
    return webcrypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 150000, hash: 'SHA-256' },
      base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }
  // Token-formaat: "v1:" + base64( salt(16) | iv(12) | ciphertext ). Salt+iv reizen mee, dus elk
  // bericht is zelfdragend en op elk apparaat met dezelfde sleutel te ontsleutelen.
  async function encrypt(plain, pass) {
    const salt = webcrypto.getRandomValues(new Uint8Array(16));
    const iv = webcrypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(pass, salt);
    const ct = await webcrypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plain));
    const out = new Uint8Array(16 + 12 + ct.byteLength);
    out.set(salt, 0); out.set(iv, 16); out.set(new Uint8Array(ct), 28);
    return 'v1:' + b64(out);
  }
  async function decrypt(token, pass) {
    const raw = unb64(String(token).replace(/^v1:/, ''));
    const salt = raw.slice(0, 16), iv = raw.slice(16, 28), ct = raw.slice(28);
    const key = await deriveKey(pass, salt);
    const pt = await webcrypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
    return dec.decode(pt);
  }

  function configured() { return /^https:\/\//.test(URL_BASE) && KEY.length > 20; }
  const H = () => ({ apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' });

  // Fouten dragen de HTTP-status mee (err.code), zodat de app "offline" kan onderscheiden van
  // "de server weigert" (bijv. 401/403 als de tabelrechten niet kloppen). Zonder dat verschil
  // ziet een gebruiker alleen 0 uren en geen enkele aanwijzing waarom.
  function fout(waar, r) { const e = new Error(waar + ' ' + r.status); e.code = r.status; return e; }

  // Haalt het profiel op. Retourneert null (geen rij), {decryptFailed,updatedAt} (onleesbaar,
  // bv. een rij uit het oude wachtwoord-tijdperk) of {state,updatedAt}. Gooit bij netwerk-/serverfout.
  async function pull(id) {
    const r = await fetch(`${REST}?id=eq.${encodeURIComponent(id)}&select=payload,updated_at`, { headers: H() });
    if (!r.ok) throw fout('pull', r);
    const rows = await r.json();
    if (!rows.length) return null;
    const row = rows[0];
    try { return { state: JSON.parse(await decrypt(row.payload, APP_SECRET)), updatedAt: row.updated_at }; }
    catch (e) { return { decryptFailed: true, updatedAt: row.updated_at }; }
  }
  // Retourneert het stempel zoals de server het bewaard heeft. Dat stempel is de versie waarop
  // dit apparaat verder rekent; het teruglezen voorkomt dat een andere notatie (of een trigger
  // op de tabel) ons laat denken dat de rij intussen door iemand anders is aangeraakt.
  async function push(id, state, updatedAt) {
    const payload = await encrypt(JSON.stringify(state), APP_SECRET);
    const r = await fetch(REST, {
      method: 'POST',
      headers: { ...H(), Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify([{ id, payload, updated_at: updatedAt }]),
    });
    if (!r.ok) throw fout('push', r);
    let rows = null;
    try { rows = await r.json(); } catch (e) { rows = null; }
    return (rows && rows[0] && rows[0].updated_at) || updatedAt;
  }

  // ---------- verzoening tussen cloud en apparaat ----------
  // Twee stempels vergelijken we op tijdstip, niet op tekst: Postgres geeft een timestamptz in
  // een andere notatie terug dan we 'm insturen.
  function zelfdeStempel(a, b) {
    if (!a || !b) return false;
    const ta = new Date(a).getTime(), tb = new Date(b).getTime();
    return Number.isFinite(ta) && ta === tb;
  }
  function heeftDagen(st) { return !!(st && st.dagen && Object.keys(st.dagen).length); }

  // Voegt twee kanten samen zonder ooit iets weg te gooien: elke dag en elke correctie die één
  // van beide kent blijft bestaan. Kent men dezelfde dag, dan wint het apparaat waar je nu op
  // zit - dat is de invoer die de gebruiker zojuist voor zich zag.
  function samenvoegen(cloud, lokaal) {
    const uit = { ...(cloud || {}), ...(lokaal || {}) };
    uit.dagen = { ...((cloud && cloud.dagen) || {}), ...((lokaal && lokaal.dagen) || {}) };
    uit.correcties = voegCorrectiesSamen((cloud && cloud.correcties) || {}, (lokaal && lokaal.correcties) || {});
    return uit;
  }
  // Correcties staan per periodesleutel in een lijst met eigen id's; die lijsten voegen we per
  // id samen in plaats van de ene lijst over de andere te leggen.
  function voegCorrectiesSamen(cloud, lokaal) {
    const uit = {};
    for (const sleutel of new Set([...Object.keys(cloud), ...Object.keys(lokaal)])) {
      const perId = new Map();
      for (const c of (cloud[sleutel] || [])) if (c && c.id) perId.set(c.id, c);
      for (const c of (lokaal[sleutel] || [])) if (c && c.id) perId.set(c.id, c);
      uit[sleutel] = [...perId.values()];
    }
    return uit;
  }

  // Beslist wat er met een binnengehaalde rij moet gebeuren. Zuiver: geen fetch, geen opslag.
  //   lokaal        - de state op dit apparaat (al gemigreerd)
  //   cloud         - de state uit de rij, of null als er geen bruikbare rij is
  //   cloudStempel  - updated_at van de rij
  //   basis         - het stempel waarmee dit apparaat het laatst verzoend heeft (null = nog nooit)
  //   vuil          - staan er lokale wijzigingen klaar die nog niet gepusht zijn?
  //   eigenOpslag   - heeft dit apparaat eigen opgeslagen data voor dit profiel? Zo niet, dan is
  //                   `lokaal` geërfd of leeg en mag het de cloud nooit sturen.
  // Geeft { actie: 'adopteer' | 'push' | 'niets', state }.
  function verzoen({ lokaal, cloud, cloudStempel, basis, vuil, eigenOpslag }) {
    // Geen bruikbare rij: alleen eigen data mag 'm vullen.
    if (!cloud) return (eigenOpslag && heeftDagen(lokaal)) ? { actie: 'push', state: lokaal } : { actie: 'niets', state: lokaal };
    // Nog nooit verzoend op dit apparaat (of net bijgewerkt vanaf de oude opzet): samenvoegen,
    // want beide kanten kunnen uren bevatten die de ander nog niet kent.
    if (!basis) {
      if (!eigenOpslag || !heeftDagen(lokaal)) return { actie: 'adopteer', state: cloud };
      const samen = samenvoegen(cloud, lokaal);
      return JSON.stringify(samen) === JSON.stringify(cloud)
        ? { actie: 'adopteer', state: cloud }
        : { actie: 'push', state: samen };
    }
    // De rij is nog precies zoals wij 'm achterlieten: alleen onze eigen wijzigingen tellen.
    if (zelfdeStempel(cloudStempel, basis)) return vuil ? { actie: 'push', state: lokaal } : { actie: 'niets', state: lokaal };
    // De rij is intussen door een ander apparaat geschreven.
    if (!vuil) return { actie: 'adopteer', state: cloud };
    return { actie: 'push', state: samenvoegen(cloud, lokaal) };
  }

  return { configured, pull, push, encrypt, decrypt, verzoen, samenvoegen, zelfdeStempel, URL_BASE };
});
