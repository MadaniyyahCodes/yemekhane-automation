function gecerliTarih(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s || '')) return false;
  const d = new Date(s + 'T00:00:00Z');
  return !isNaN(d) && d.toISOString().slice(0, 10) === s; // rejects things like 2026-02-30
}

function gunEkle(tarih, gun) {
  const d = new Date(tarih + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + gun);
  return d.toISOString().slice(0, 10);
}

function gunAdi(tarih) {
  return new Date(tarih + 'T00:00:00Z').toLocaleDateString('tr-TR', {
    weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC',
  });
}

module.exports = { gecerliTarih, gunEkle, gunAdi };
