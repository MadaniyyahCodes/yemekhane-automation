const degerlendirmeRepository = require('../repositories/degerlendirmeRepository');

function tarihAdi(tarih) {
  return new Date(tarih + 'T00:00:00Z').toLocaleDateString('tr-TR', {
    weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC',
  });
}

// kaynaktanOku = true right after a write (the replica may be a moment behind)
async function sayfaHazirla(kullanici, kaynaktanOku) {
  const kayitlar = await degerlendirmeRepository.kullanilmisMenuler(kullanici.id, kaynaktanOku);
  const menuler = kayitlar.map((m) => ({
    ...m,
    tarihAdi: tarihAdi(m.tarih),
    degerlendirildi: m.puan !== null,
  }));
  return { menuler };
}

async function liste(req, res, next) {
  try {
    const yeni = req.query.yeni === '1';
    const veri = await sayfaHazirla(req.kullanici, yeni);
    res.render('degerlendirme', {
      ...veri,
      hata: null,
      basari: yeni ? 'Değerlendirmeniz kaydedildi.' : null,
    });
  } catch (err) {
    next(err);
  }
}

async function kaydet(req, res, next) {
  try {
    const menuId = parseInt(req.body.menu_id, 10);
    const puan = parseInt(req.body.puan, 10);
    const yorum = (req.body.yorum || '').trim().slice(0, 500) || null;

    let hata = null;
    if (!Number.isInteger(menuId) || menuId < 1) {
      hata = 'Geçersiz menü.';
    } else if (!Number.isInteger(puan) || puan < 1 || puan > 5) {
      hata = 'Puan 1 ile 5 arasında olmalıdır.';
    } else if (!(await degerlendirmeRepository.kullanildiMi(req.kullanici.id, menuId))) {
      hata = 'Yalnızca kullandığınız menüleri değerlendirebilirsiniz.';
    } else {
      try {
        await degerlendirmeRepository.ekle(req.kullanici.id, menuId, puan, yorum);
        return res.redirect('/degerlendirme?yeni=1');
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') hata = 'Bu menüyü zaten değerlendirdiniz.'; // one vote per menu
        else throw err;
      }
    }

    const veri = await sayfaHazirla(req.kullanici, true);
    res.status(400).render('degerlendirme', { ...veri, hata, basari: null });
  } catch (err) {
    next(err);
  }
}

module.exports = { liste, kaydet };
