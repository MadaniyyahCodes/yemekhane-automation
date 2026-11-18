const { yazma, okuma } = require('../config/db');

// The current balance is read from the PRIMARY on purpose:
// the replica can be a moment behind right after a write.
async function guncelBakiye(kullaniciId) {
  const [satirlar] = await yazma.query(
    'SELECT bakiye FROM kullanicilar WHERE id = ?',
    [kullaniciId]
  );
  return satirlar[0].bakiye;
}

// The history list is read from the REPLICA.
async function hareketler(kullaniciId) {
  const [satirlar] = await okuma.query(
    'SELECT olusturma AS zaman, tur AS tur, tutar ' +
    'FROM bakiye_hareketleri WHERE kullanici_id = ? ORDER BY id DESC LIMIT 50',
    [kullaniciId]
  );
  return satirlar;
}

// The money logic lives in the stored procedure, not here.
async function yukle(kullaniciId, tutar) {
  const [sonuc] = await yazma.query('CALL sp_bakiye_yukle(?, ?)', [kullaniciId, tutar]);
  return sonuc[0][0]; // { hareket_id, bakiye }
}

module.exports = { guncelBakiye, hareketler, yukle };
