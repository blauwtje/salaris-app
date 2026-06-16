(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else { root.Salaris = root.Salaris || {}; root.Salaris.sync = factory(); }
})(typeof self !== 'undefined' ? self : this, function () {
  // Supabase-project (publishable key mág publiek — de data wordt client-side versleuteld).
  const URL_BASE = 'https://gtnzuvyntdmbttlxlrme.supabase.co';
  const KEY = 'sb_publishable_1HaquDrwFzXiRmY0JhbP4g_9MaB5fWU';
  const REST = URL_BASE + '/rest/v1/profielen';

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
  // bericht is zelfdragend en op elk apparaat met hetzelfde wachtwoord te ontsleutelen.
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

  // Haalt het profiel op. Retourneert null (geen rij), {decryptFailed,updatedAt} (verkeerd
  // wachtwoord of onleesbaar) of {state,updatedAt}. Gooit bij netwerk-/serverfout.
  async function pull(id, pass) {
    const r = await fetch(`${REST}?id=eq.${encodeURIComponent(id)}&select=payload,updated_at`, { headers: H() });
    if (!r.ok) throw new Error('pull ' + r.status);
    const rows = await r.json();
    if (!rows.length) return null;
    const row = rows[0];
    try { return { state: JSON.parse(await decrypt(row.payload, pass)), updatedAt: row.updated_at }; }
    catch (e) { return { decryptFailed: true, updatedAt: row.updated_at }; }
  }
  async function push(id, pass, state, updatedAt) {
    const payload = await encrypt(JSON.stringify(state), pass);
    const r = await fetch(REST, {
      method: 'POST',
      headers: { ...H(), Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify([{ id, payload, updated_at: updatedAt }]),
    });
    if (!r.ok) throw new Error('push ' + r.status);
  }

  return { configured, pull, push, encrypt, decrypt, URL_BASE };
});
