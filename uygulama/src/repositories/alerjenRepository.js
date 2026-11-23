const { yazma, okuma } = require('../config/db');

// Reference list of the 14 allergens: REPLICA
async function tumu() {
  const [satirlar] = await okuma.query('SELECT id, ad FROM alerjenler ORDER BY ad');
  return satirlar;
}

// The user's chosen allergen ids. Right after saving they are read from the PRIMARY.
async function secilenIdler(kullaniciId, kaynaktanOku) {
  const havuz = kaynaktanOku ? yazma : okuma;
  const [satirlar] = await havuz.query(
    'SELECT alerjen_id FROM kullanici_alerjenleri WHERE kullanici_id = ?',
    [kullaniciId]
  );
  return satirlar.map((s) => Number(s.alerjen_id));
}

// The user's chosen allergens with their names, for the menu warnings: REPLICA
async function kullaniciAlerjenleri(kullaniciId) {
  const [satirlar] = await okuma.query(
    'SELECT a.id, a.ad FROM kullanici_alerjenleri ka ' +
    'JOIN alerjenler a ON a.id = ka.alerjen_id ' +
    'WHERE ka.kullanici_id = ? ORDER BY a.ad',
    [kullaniciId]
  );
  return satirlar;
}

// Saving replaces the whole set, in one transaction on the PRIMARY (all or nothing)
async function kaydet(kullaniciId, idler) {
  const baglanti = await yazma.getConnection();
  try {
    await baglanti.beginTransaction();
    await baglanti.query('DELETE FROM kullanici_alerjenleri WHERE kullanici_id = ?', [kullaniciId]);
    if (idler.length > 0) {
      await baglanti.query(
        'INSERT INTO kullanici_alerjenleri (kullanici_id, alerjen_id) VALUES ?',
        [idler.map((id) => [kullaniciId, id])]
      );
    }
    await baglanti.commit();
  } catch (err) {
    await baglanti.rollback();
    throw err;
  } finally {
    baglanti.release();
  }
}

module.exports = { tumu, secilenIdler, kullaniciAlerjenleri, kaydet };