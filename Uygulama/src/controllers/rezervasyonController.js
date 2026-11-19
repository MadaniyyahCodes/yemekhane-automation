const menuRepository = require('../repositories/menuRepository');
const rezervasyonRepository = require('../repositories/rezervasyonRepository');
const bakiyeRepository = require('../repositories/bakiyeRepository');
const { kullaniciMesaji } = require('../utils/dbHata');

const DURUM_ETIKETLERI = { aktif: 'Rezervasyonunuz var', kullanildi: 'Kullanıldı' };

function gecerliTarih(s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s || '') && !isNaN(new Date(s + 'T00:00:00Z'));
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

// Students pay the student price; staff and admins pay the staff price
function fiyat(rol, menu) {
  return rol === 'ogrenci' ? menu.ogrenci_fiyati : menu.personel_fiyati;
}

async function sayfaHazirla(kullanici, istenenBaslangic, yeniMenuId) {
  const baslangic = gecerliTarih(istenenBaslangic) ? istenenBaslangic : await menuRepository.bugun();
  const bitis = gunEkle(baslangic, 6);

  const menuler = await menuRepository.haftalik(baslangic, bitis);                   // replica
  const durumlar = await rezervasyonRepository.durumlar(kullanici.id, baslangic, bitis); // replica
  const bakiye = await bakiyeRepository.guncelBakiye(kullanici.id);                  // PRIMARY

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

    gun.menuler.push({
      ...m,
      fiyat: fiyat(kullanici.rol, m),
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
    if (!Number.isInteger(menuId) || menuId < 1) return res.redirect('/menu/hafta');

    try {
      await rezervasyonRepository.yap(req.kullanici.id, menuId);
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