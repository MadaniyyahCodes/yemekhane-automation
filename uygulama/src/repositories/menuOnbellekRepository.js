const redis = require('../config/redis');

const anahtar = (yemekhaneId, tarih, ogunId) => `menu:${yemekhaneId}:${tarih}:${ogunId}`;

// Seconds until the end of the menu's date (Istanbul time); never less than 60
function sonaKadarSaniye(tarih) {
  const gunSonu = new Date(`${tarih}T23:59:59+03:00`);
  const saniye = Math.ceil((gunSonu.getTime() - Date.now()) / 1000);
  return Math.max(saniye, 60);
}

async function getir(yemekhaneId, tarih, ogunId) {
  const veri = await redis.get(anahtar(yemekhaneId, tarih, ogunId));
  return veri ? JSON.parse(veri) : null;
}

async function yaz(yemekhaneId, tarih, ogunId, satirlar) {
  await redis.set(anahtar(yemekhaneId, tarih, ogunId), JSON.stringify(satirlar), {
    EX: sonaKadarSaniye(tarih),
  });
}

async function sil(yemekhaneId, tarih, ogunId) {
  await redis.del(anahtar(yemekhaneId, tarih, ogunId));
}

module.exports = { anahtar, getir, yaz, sil };