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

// Making a reservation moves money, so the stored procedure does it (WRITE: PRIMARY)
async function yap(kullaniciId, menuId) {
  const [sonuc] = await yazma.query('CALL sp_rezervasyon_yap(?, ?)', [kullaniciId, menuId]);
  return sonuc[0][0]; // { rezervasyon_id, ucret, bakiye }
}

module.exports = { durumlar, yap };