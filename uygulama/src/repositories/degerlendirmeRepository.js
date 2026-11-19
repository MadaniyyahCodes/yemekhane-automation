const { yazma, okuma } = require('../config/db');

// Menus the user has actually used, with their rating if they already gave one.
// Normally from the REPLICA; from the PRIMARY right after a write.
async function kullanilmisMenuler(kullaniciId, kaynaktanOku) {
  const havuz = kaynaktanOku ? yazma : okuma;
  const [satirlar] = await havuz.query(
    'SELECT r.menu_id, d.tarih, d.yemekhane, d.ogun, g.puan, g.yorum ' +
    'FROM rezervasyonlar r ' +
    'JOIN v_menu_doluluk d ON d.menu_id = r.menu_id ' +
    'LEFT JOIN degerlendirmeler g ON g.menu_id = r.menu_id AND g.kullanici_id = r.kullanici_id ' +
    "WHERE r.kullanici_id = ? AND r.durum = 'kullanildi' " +
    'ORDER BY d.tarih DESC, d.ogun_id DESC',
    [kullaniciId]
  );
  return satirlar;
}

// The "used menus only" rule is checked against the PRIMARY, so it is never stale.
async function kullanildiMi(kullaniciId, menuId) {
  const [satirlar] = await yazma.query(
    "SELECT 1 FROM rezervasyonlar WHERE kullanici_id = ? AND menu_id = ? AND durum = 'kullanildi' LIMIT 1",
    [kullaniciId, menuId]
  );
  return satirlar.length > 0;
}

// Saving a rating is a write: PRIMARY
async function ekle(kullaniciId, menuId, puan, yorum) {
  await yazma.query(
    'INSERT INTO degerlendirmeler (kullanici_id, menu_id, puan, yorum) VALUES (?, ?, ?, ?)',
    [kullaniciId, menuId, puan, yorum]
  );
}

module.exports = { kullanilmisMenuler, kullanildiMi, ekle };