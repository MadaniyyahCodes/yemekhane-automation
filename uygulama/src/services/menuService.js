const menuRepository = require('../repositories/menuRepository');
const menuOnbellek = require('../repositories/menuOnbellekRepository');

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

module.exports = { menuGetir, onbellegiTemizle };