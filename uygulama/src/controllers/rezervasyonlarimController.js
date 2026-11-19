const rezervasyonRepository = require('../repositories/rezervasyonRepository');
const bakiyeRepository = require('../repositories/bakiyeRepository');
const { kullaniciMesaji } = require('../utils/dbHata');

const DURUM_ETIKETLERI = { aktif: 'Aktif', kullanildi: 'Kullanıldı', iptal: 'İptal edildi' };

function tarihAdi(tarih) {
  return new Date(tarih + 'T00:00:00Z').toLocaleDateString('tr-TR', {
    weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC',
  });
}

// kaynaktanOku = true right after a write: the replica may be a moment behind,
// so the list is read from the primary instead.
async function sayfaHazirla(kullanici, kaynaktanOku) {
  const kayitlar = await rezervasyonRepository.kullanicininTumu(kullanici.id, kaynaktanOku);
  const bakiye = await bakiyeRepository.guncelBakiye(kullanici.id); // always the primary

  const rezervasyonlar = kayitlar.map((r) => ({
    ...r,
    durumEtiketi: DURUM_ETIKETLERI[r.durum] || r.durum,
    tarihAdi: tarihAdi(r.tarih),
    sonSaat: r.rezervasyon_son ? r.rezervasyon_son.slice(11, 16) : null,
    sureDoldu: Number(r.suresi_doldu) === 1,
  }));

  return { bakiye, rezervasyonlar };
}

async function liste(req, res, next) {
  try {
    const yeni = req.query.yeni === '1';
    const veri = await sayfaHazirla(req.kullanici, yeni);
    res.render('rezervasyonlarim', { ...veri, hata: null, basari: yeni ? 'Rezervasyon iptal edildi.' : null });
  } catch (err) {
    next(err);
  }
}

async function iptal(req, res, next) {
  try {
    const id = parseInt(req.body.rezervasyon_id, 10);
    if (!Number.isInteger(id) || id < 1) return res.redirect('/rezervasyonlarim');

    try {
      // The procedure checks ownership, the deadline and the refund
      await rezervasyonRepository.iptal(req.kullanici.id, id);
    } catch (err) {
      const mesaj = kullaniciMesaji(err); // the procedure's Turkish message
      if (!mesaj) throw err;
      const veri = await sayfaHazirla(req.kullanici, true);
      return res.status(400).render('rezervasyonlarim', { ...veri, hata: mesaj, basari: null });
    }

    res.redirect('/rezervasyonlarim?yeni=1');
  } catch (err) {
    next(err);
  }
}

module.exports = { liste, iptal };