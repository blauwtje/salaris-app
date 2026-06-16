(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else { root.Salaris = root.Salaris || {}; root.Salaris.thema = factory(); }
})(typeof self !== 'undefined' ? self : this, function () {
  // De vier keuzes die de gebruiker in instellingen heeft. 'systeem' volgt het OS-thema.
  const THEMAS = [
    { id: 'systeem', label: 'Systeem' },
    { id: 'licht', label: 'Licht' },
    { id: 'donker', label: 'Donker' },
    { id: 'zwart', label: 'Extra donker' },
    { id: 'aangepast', label: 'Aangepast' },
  ];

  // Accent-presets (snel kiezen); de gebruiker kan daarnaast een eigen kleur prikken.
  const ACCENTS = [
    { naam: 'Violet', hex: '#6C63FF' },
    { naam: 'Indigo', hex: '#4F6BFF' },
    { naam: 'Cyaan', hex: '#0EA5E9' },
    { naam: 'Teal', hex: '#12A594' },
    { naam: 'Smaragd', hex: '#16A34A' },
    { naam: 'Amber', hex: '#E08A00' },
    { naam: 'Roze', hex: '#EC4899' },
    { naam: 'Rood', hex: '#E5484D' },
    { naam: 'Grafiet', hex: '#64748B' },
  ];

  // Zet de gekozen modus om naar een concreet thema dat als data-theme op <html> staat.
  function resolve(modus, prefersDark) {
    if (modus === 'aangepast') return 'custom';
    if (modus === 'zwart') return 'black';
    if (modus === 'donker') return 'dark';
    if (modus === 'licht') return 'light';
    return prefersDark ? 'dark' : 'light'; // systeem
  }

  return { THEMAS, ACCENTS, resolve };
});
