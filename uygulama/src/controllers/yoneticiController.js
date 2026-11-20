const menuRepository = require('../repositories/menuRepository');
const yoneticiRepository = require('../repositories/yoneticiRepository');
const { gecerliTarih, gunEkle, gunAdi } = require('../utils/tarih');

const MESAJLAR = {
  olustu: 'Menü oluşturuldu.',
  guncellendi: 'Menü güncellendi.',
};

// Everything the form needs: canteens, meals, and dishes grouped by category
async function formListeleri() {
  const [yemekhaneler, ogunler, yemekler] = await Promise.all([
    menuRepository.yemekhaneler(),
    menuRepository.ogunler(),
    yoneticiRepository.tumYemekler(),
  ]);
  const kategoriler = [];
  for (const y of yemekler) {
    let son = kategoriler[kategoriler.length - 1];
    if (!son || son.ad !== y.kategori) {
      son = { ad: y.kategori, yemekler: [] };
      kategoriler.push(son);
    }
    son.yemekler.push(y);
  }
  return { yemekhaneler, ogunler, kategoriler };
}

function sayi(deger) {
  return Number(String(deger || '').replace(',', '.'));
}

// Reads the submitted form into one object (plus the raw price text to show again on error)
function formuOku(body) {
  const yemekIdleri = [...new Set([].concat(body.yemekler || []).map(Number))]
    .filter((n) => Number.isInteger(n) && n > 0);
  return {
    yemekhaneId: parseInt(body.yemekhane_id, 10),
    tarih: body.tarih || '',
    ogunId: parseInt(body.ogun_id, 10),
    ogrenciFiyati: sayi(body.ogrenci_fiyati),
    personelFiyati: sayi(body.personel_fiyati),
    ogrenciHam: body.ogrenci_fiyati || '',
    personelHam: body.personel_fiyati || '',
    yemekIdleri,
  };
}

function dogrula(v, listeler, duzenleme) {
  if (!duzenleme) {
    if (!listeler.yemekhaneler.some((y) => Number(y.id) === v.yemekhaneId)) return 'Geçerli bir yemekhane seçin.';
    if (!listeler.ogunler.some((o) => Number(o.id) === v.ogunId)) return 'Geçerli bir öğün seçin.';
    if (!gecerliTarih(v.tarih)) return 'Geçerli bir tarih girin.';
  }
  const fiyatGecerli = (f) => Number.isFinite(f) && f > 0 && f < 1000;
  if (!fiyatGecerli(v.ogrenciFiyati) || !fiyatGecerli(v.personelFiyati)) {
    return 'Fiyatlar 0 ile 1000 TL arasında olmalıdır.';
  }
  if (v.yemekIdleri.length === 0) return 'En az bir yemek seçin.';
  return null;
}

// The shape the form template expects when editing an existing menu
function duzenlemeFormu(kayit) {
  return {
    id: kayit.id,
    yemekhaneAd: kayit.yemekhane,
    ogunAd: kayit.ogun,
    tarih: kayit.tarih,
    ogrenciHam: String(kayit.ogrenci_fiyati),
    personelHam: String(kayit.personel_fiyati),
    yemekIdleri: kayit.yemekIdleri.map(Number),
  };
}

async function liste(req, res, next) {
  try {
    const bugun = await menuRepository.bugun();
    const baslangic = gecerliTarih(req.query.baslangic) ? req.query.baslangic : gunEkle(bugun, -7);
    const bitis = gunEkle(baslangic, 13);

    const menuler = (await yoneticiRepository.menuRaporu(baslangic, bitis)).map((m) => ({
      ...m,
      tarihAdi: gunAdi(m.tarih),
    }));

    res.render('yonetici-liste', {
      menuler,
      baslangic,
      bitis,
      onceki: gunEkle(baslangic, -14),
      sonraki: gunEkle(baslangic, 14),
      basari: MESAJLAR[req.query.ok] || null,
    });
  } catch (err) {
    next(err);
  }
}

async function yeniForm(req, res, next) {
  try {
    const listeler = await formListeleri();
    const bugun = await menuRepository.bugun();
    const menu = {
      yemekhaneId: Number(listeler.yemekhaneler[0].id),
      tarih: bugun,
      ogunId: Number((listeler.ogunler[1] || listeler.ogunler[0]).id),
      ogrenciHam: '',
      personelHam: '',
      yemekIdleri: [],
    };
    res.render('yonetici-form', { ...listeler, menu, duzenleme: false, hata: null });
  } catch (err) {
    next(err);
  }
}

async function olustur(req, res, next) {
  try {
    const listeler = await formListeleri();
    const v = formuOku(req.body);
    let hata = dogrula(v, listeler, false);

    if (!hata) {
      try {
        await yoneticiRepository.menuOlustur(v);
        return res.redirect('/yonetici?ok=olustu');
      } catch (err) {
        if (err.code === 'MENU_VAR' || err.code === 'ER_DUP_ENTRY') {
          hata = 'Bu yemekhane, tarih ve öğün için zaten bir menü var.';
        } else {
          throw err;
        }
      }
    }

    res.status(400).render('yonetici-form', { ...listeler, menu: v, duzenleme: false, hata });
  } catch (err) {
    next(err);
  }
}

async function duzenleForm(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const kayit = Number.isInteger(id) ? await yoneticiRepository.menuGetir(id) : null;
    if (!kayit) return res.status(404).send('Menü bulunamadı.');

    const listeler = await formListeleri();
    res.render('yonetici-form', { ...listeler, menu: duzenlemeFormu(kayit), duzenleme: true, hata: null });
  } catch (err) {
    next(err);
  }
}

async function guncelle(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const kayit = Number.isInteger(id) ? await yoneticiRepository.menuGetir(id) : null;
    if (!kayit) return res.status(404).send('Menü bulunamadı.');

    const listeler = await formListeleri();
    const v = formuOku(req.body);
    const hata = dogrula(v, listeler, true);

    if (!hata) {
      await yoneticiRepository.menuGuncelle(id, v);
      // Stage 3 note: this is where the Redis menu cache key for
      // (kayit.yemekhane_id, kayit.tarih, kayit.ogun_id) will be deleted.
      return res.redirect('/yonetici?ok=guncellendi');
    }

    const menu = {
      ...duzenlemeFormu(kayit),
      ogrenciHam: v.ogrenciHam,
      personelHam: v.personelHam,
      yemekIdleri: v.yemekIdleri,
    };
    res.status(400).render('yonetici-form', { ...listeler, menu, duzenleme: true, hata });
  } catch (err) {
    next(err);
  }
}

module.exports = { liste, yeniForm, olustur, duzenleForm, guncelle };