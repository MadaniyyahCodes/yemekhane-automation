const menuRepository = require('../repositories/menuRepository');
const menuOnbellek = require('../repositories/menuOnbellekRepository');

// Raise this number whenever the structure of cached menus changes
// (Stage 4 changed the data model, so the version is now 4).
const ONBELLEK_SURUMU = 4;

// Cache-aside: look in Redis first, otherwise read the database and fill Redis.
async function menuGetir(yemekhaneId, tarih, ogunId) {
  const anahtar = menuOnbellek.anahtar(yemekhaneId, tarih, ogunId);

  try {
    const onbellekte = await menuOnbellek.getir(yemekhaneId, tarih, ogunId);
    if (onbellekte) {
      console.log(`[menu] REDIS      ${anahtar}`);
      return onbellekte;
    }
  } catch (err) {
    console.error('Redis okunamadi, veritabanina geciliyor:', err.message);
  }

  const satirlar = await menuRepository.menuDetay(yemekhaneId, tarih, ogunId);
  console.log(`[menu] VERITABANI ${anahtar}`);

  // An empty result is not cached, so a menu created later shows up at once
  if (satirlar.length > 0) {
    try {
      await menuOnbellek.yaz(yemekhaneId, tarih, ogunId, satirlar);
    } catch (err) {
      console.error('Redis yazilamadi:', err.message);
    }
  }
  return satirlar;
}

// Called when the admin creates or changes a menu.
async function onbellegiTemizle(yemekhaneId, tarih, ogunId) {
  const anahtar = menuOnbellek.anahtar(yemekhaneId, tarih, ogunId);
  try {
    await menuOnbellek.sil(yemekhaneId, tarih, ogunId);
    console.log(`[menu] SILINDI    ${anahtar}`);
  } catch (err) {
    console.error('Redis anahtari silinemedi:', err.message);
  }

  // Second delete after 2 seconds: if someone viewed the menu while the replica was
  // still a moment behind, that stale copy would otherwise stay cached all day.
  setTimeout(() => {
    menuOnbellek.sil(yemekhaneId, tarih, ogunId).catch(() => {});
  }, 2000);
}

// Runs once when the app starts: removes old-structure menu records from Redis.
async function onbellekSurumunuUygula() {
  const sonuc = await menuOnbellek.surumuUygula(ONBELLEK_SURUMU);
  if (sonuc.degisti) {
    console.log(`[onbellek] surum ${ONBELLEK_SURUMU}: eski menu kayitlari temizlendi (${sonuc.silinen} anahtar)`);
  } else {
    console.log(`[onbellek] surum ${ONBELLEK_SURUMU} guncel, temizlik gerekmedi`);
  }
}

module.exports = { menuGetir, onbellegiTemizle, onbellekSurumunuUygula };