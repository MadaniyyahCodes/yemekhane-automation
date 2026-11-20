const menuRepository = require('../repositories/menuRepository');
const menuService = require('../services/menuService');

function tamSayi(deger, varsayilan) {
  const n = parseInt(deger, 10);
  return Number.isInteger(n) && n > 0 ? n : varsayilan;
}

async function bugun(req, res, next) {
  try {
    // ?tarih=2026-11-12 is an optional testing aid; by default it is today
    const gecerliTarih = /^\d{4}-\d{2}-\d{2}$/.test(req.query.tarih || '');
    const tarih = gecerliTarih ? req.query.tarih : await menuRepository.bugun();

    const yemekhaneler = await menuRepository.yemekhaneler();
    const ogunler = await menuRepository.ogunler();

    const yemekhaneId = tamSayi(req.query.yemekhane, yemekhaneler[0].id);
    const ogunId = tamSayi(req.query.ogun, (ogunler[1] || ogunler[0]).id); // lunch by default

    // The menu comes through the cache layer (Redis first, then the database)
    const satirlar = await menuService.menuGetir(yemekhaneId, tarih, ogunId);
    const yemekler = satirlar.filter((s) => s.yemek); // ignore a menu with no dishes

    let menu = null;
    if (satirlar.length > 0) {
      // Business rule: the application adds up the calories
      const toplamKalori = yemekler.reduce((toplam, y) => toplam + (y.kalori || 0), 0);

      // Group dishes by category (the rows already come in category order)
      const kategoriler = [];
      for (const y of yemekler) {
        let son = kategoriler[kategoriler.length - 1];
        if (!son || son.ad !== y.kategori) {
          son = { ad: y.kategori, yemekler: [] };
          kategoriler.push(son);
        }
        son.yemekler.push(y);
      }

      menu = {
        yemekhane: satirlar[0].yemekhane,
        ogun: satirlar[0].ogun,
        sonSaat: satirlar[0].rezervasyon_son ? satirlar[0].rezervasyon_son.slice(11, 16) : null,
        toplamKalori,
        kategoriler,
      };
    }

    res.render('menu-bugun', { tarih, yemekhaneler, ogunler, yemekhaneId, ogunId, menu });
  } catch (err) {
    next(err);
  }
}

module.exports = { bugun };