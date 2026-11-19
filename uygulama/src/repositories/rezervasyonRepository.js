const { yazma, okuma } = require('../config/db');

// Which of these menus has the user already reserved? (list: REPLICA)
async function durumlar(kullaniciId, baslangic, bitis) {
  const [satirlar] = await okuma.query(
    'SELECT r.menu_id, r.durum ' +
    'FROM rezervasyonlar r JOIN v_menu_doluluk d ON d.menu_id = r.menu_id ' +
    'WHERE r.kullanici_id = ? AND d.tarih BETWEEN ? AND ?',
    [kullaniciId, baslangic, bitis]
  );
  return satirlar;
}

// All of a user's reservations, newest first.
// Normally from the REPLICA; from the PRIMARY right after a write.
async function kullanicininTumu(kullaniciId, kaynaktanOku) {
  const havuz = kaynaktanOku ? yazma : okuma;
  const [satirlar] = await havuz.query(
    'SELECT r.id, r.durum, d.menu_id, d.tarih, d.yemekhane, d.ogun, d.rezervasyon_son, ' +
    '       (d.rezervasyon_son < NOW()) AS suresi_doldu ' +
    'FROM rezervasyonlar r JOIN v_menu_doluluk d ON d.menu_id = r.menu_id ' +
    'WHERE r.kullanici_id = ? ' +
    'ORDER BY d.tarih DESC, d.ogun_id DESC, r.id DESC LIMIT 100',
    [kullaniciId]
  );
  return satirlar;
}

// Making a reservation moves money, so the stored procedure does it (WRITE: PRIMARY)
async function yap(kullaniciId, menuId) {
  const [sonuc] = await yazma.query('CALL sp_rezervasyon_yap(?, ?)', [kullaniciId, menuId]);
  return sonuc[0][0]; // { rezervasyon_id, ucret, bakiye }
}

// Cancelling refunds money, so the stored procedure does it too (WRITE: PRIMARY)
async function iptal(kullaniciId, rezervasyonId) {
  const [sonuc] = await yazma.query('CALL sp_rezervasyon_iptal(?, ?)', [kullaniciId, rezervasyonId]);
  return sonuc[0][0]; // { rezervasyon_id, iade, bakiye }
}

module.exports = { durumlar, kullanicininTumu, yap, iptal };