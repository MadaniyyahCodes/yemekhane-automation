const bakiyeRepository = require('../repositories/bakiyeRepository');
const { kullaniciMesaji } = require('../utils/dbHata');

async function sayfaVerisi(kullaniciId) {
  const bakiye = await bakiyeRepository.guncelBakiye(kullaniciId); // primary
  const hareketler = await bakiyeRepository.hareketler(kullaniciId); // replica
  return { bakiye, hareketler };
}

async function goster(req, res, next) {
  try {
    const veri = await sayfaVerisi(req.kullanici.id);
    res.render('bakiye', {
      ...veri,
      hata: null,
      basari: req.query.ok ? 'Bakiye yüklendi.' : null,
    });
  } catch (err) {
    next(err);
  }
}

async function yukle(req, res, next) {
  try {
    const tutar = Number(String(req.body.tutar || '').replace(',', '.'));
    let hata = null;

    if (!Number.isFinite(tutar)) {
      hata = 'Geçerli bir tutar girin.';
    } else {
      try {
        await bakiyeRepository.yukle(req.kullanici.id, tutar);
        return res.redirect('/bakiye?ok=1');
      } catch (err) {
        hata = kullaniciMesaji(err);
        if (!hata) throw err; // not a business error: real failure
      }
    }

    const veri = await sayfaVerisi(req.kullanici.id);
    res.status(400).render('bakiye', { ...veri, hata, basari: null });
  } catch (err) {
    next(err);
  }
}

module.exports = { goster, yukle };