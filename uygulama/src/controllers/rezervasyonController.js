const menuRepository = require('../repositories/menuRepository');
const rezervasyonRepository = require('../repositories/rezervasyonRepository');
const bakiyeRepository = require('../repositories/bakiyeRepository');
const { kullaniciMesaji } = require('../utils/dbHata');
const { gecerliTarih, gunEkle, gunAdi } = require('../utils/tarih');

const DURUM_ETIKETLERI = { aktif: 'Rezervasyonunuz var', kullanildi: 'Kullanıldı' };

// Students pay the student price; staff and admins pay the staff price
function fiyatlar(rol, menu) {
  return rol === 'ogrenci'
    ? { tam: menu.ogrenci_fiyati, yarim: menu.ogrenci_yarim_fiyati }
    : { tam: menu.personel_fiyati, yarim: menu.personel_yarim_fiyati };
}

async function sayfaHazirla(kullanici, istenenBaslangic, yeniMenuId) {
  const baslangic = gecerliTarih(istenenBaslangic) ? istenenBaslangic : await menuRepository.bugun();
  const bitis = gunEkle(baslangic, 6);

  const menuler = await menuRepository.haftalik(baslangic, bitis);                       // replica
  const durumlar = await rezervasyonRepository.durumlar(kullanici.id, baslangic, bitis); // replica
  const bakiye = await bakiyeRepository.guncelBakiye(kullanici.id);                      // PRIMARY

  const durumHaritasi = new Map(durumlar.map((d) => [d.menu_id, d.durum]));

  const gunler = [];
  for (const m of menuler) {
    let gun = gunler[gunler.length - 1];
    if (!gun || gun.tarih !== m.tarih) {
      gun = { tarih: m.tarih, ad: gunAdi(m.tarih), menuler: [] };
      gunler.push(gun);
    }

    let durum = durumHaritasi.get(m.menu_id) || null;
    // The replica may be a moment behind: trust the reservation we just made
    if (yeniMenuId && m.menu_id === yeniMenuId) durum = 'aktif';

    const f = fiyatlar(kullanici.rol, m);
    gun.menuler.push({
      ...m,
      fiyat: f.tam,
      yarimFiyat: f.yarim,
      yarimVar: Number(m.yarim_porsiyon_var) === 1,
      sonSaat: m.rezervasyon_son ? m.rezervasyon_son.slice(11, 16) : null,
      durumEtiketi: DURUM_ETIKETLERI[durum] || null,
    });
  }

  return { baslangic, onceki: gunEkle(baslangic, -7), sonraki: gunEkle(baslangic, 7), bakiye, gunler };
}

async function hafta(req, res, next) {
  try {
    const yeni = parseInt(req.query.ok, 10) || null;
    const veri = await sayfaHazirla(req.kullanici, req.query.baslangic, yeni);
    res.render('menu-hafta', { ...veri, hata: null, basari: yeni ? 'Rezervasyon yapıldı.' : null });
  } catch (err) {
    next(err);
  }
}

async function yap(req, res, next) {
  try {
    const menuId = parseInt(req.body.menu_id, 10);
    const baslangic = gecerliTarih(req.body.baslangic) ? req.body.baslangic : null;
    // Breakfast cards send no choice, so it defaults to a full portion.
    // The procedure validates the value and rejects half portions at breakfast.
    const porsiyon = req.body.porsiyon || 'tam';
    if (!Number.isInteger(menuId) || menuId < 1) return res.redirect('/menu/hafta');

    try {
      await rezervasyonRepository.yap(req.kullanici.id, menuId, porsiyon);
    } catch (err) {
      const mesaj = kullaniciMesaji(err); // the procedure's Turkish message
      if (!mesaj) throw err;
      const veri = await sayfaHazirla(req.kullanici, baslangic, null);
      return res.status(400).render('menu-hafta', { ...veri, hata: mesaj, basari: null });
    }

    res.redirect(`/menu/hafta?ok=${menuId}` + (baslangic ? `&baslangic=${baslangic}` : ''));
  } catch (err) {
    next(err);
  }
}

module.exports = { hafta, yap };