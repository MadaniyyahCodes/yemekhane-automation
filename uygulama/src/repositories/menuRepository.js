const { okuma } = require('../config/db');

// Lists and menus are read from the REPLICA.
async function bugun() {
  const [satirlar] = await okuma.query('SELECT CURDATE() AS bugun');
  return satirlar[0].bugun; // e.g. "2026-11-19"
}

async function yemekhaneler() {
  const [satirlar] = await okuma.query('SELECT id, ad FROM yemekhaneler ORDER BY id');
  return satirlar;
}

async function ogunler() {
  const [satirlar] = await okuma.query('SELECT id, ad FROM ogunler ORDER BY sira');
  return satirlar;
}

// One row per dish, in category order (the view does the joins)
async function menuDetay(yemekhaneId, tarih, ogunId) {
  const [satirlar] = await okuma.query(
    'SELECT * FROM v_menu_detay ' +
    'WHERE yemekhane_id = ? AND tarih = ? AND ogun_id = ? ' +
    'ORDER BY kategori_sira, yemek',
    [yemekhaneId, tarih, ogunId]
  );
  return satirlar;
}

// One row per menu in a date range: free seats, prices, and whether the cut-off has passed.
// The "has the deadline passed" comparison is left to the database (NOW()).
async function haftalik(baslangic, bitis) {
  const [satirlar] = await okuma.query(
    'SELECT d.menu_id, d.tarih, d.yemekhane_id, d.yemekhane, d.ogun_id, d.ogun, ' +
    '       d.kapasite, d.rezerve, d.bos_yer, d.rezervasyon_son, ' +
    '       (d.rezervasyon_son < NOW()) AS suresi_doldu, ' +
    '       f.ogrenci_fiyati, f.personel_fiyati ' +
    'FROM v_menu_doluluk d ' +
    'JOIN (SELECT menu_id, MAX(ogrenci_fiyati) AS ogrenci_fiyati, MAX(personel_fiyati) AS personel_fiyati ' +
    '      FROM v_menu_detay GROUP BY menu_id) f ON f.menu_id = d.menu_id ' +
    'WHERE d.tarih BETWEEN ? AND ? ' +
    'ORDER BY d.tarih, d.yemekhane_id, d.ogun_id',
    [baslangic, bitis]
  );
  return satirlar;
}

module.exports = { bugun, yemekhaneler, ogunler, menuDetay, haftalik };