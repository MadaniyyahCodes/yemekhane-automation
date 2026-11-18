const { okuma } = require('../config/db');

// Lists and menus are read from the REPLICA.
async function bugun() {
  const [satirlar] = await okuma.query('SELECT CURDATE() AS bugun');
  return satirlar[0].bugun; // e.g. "2026-11-18"
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

module.exports = { bugun, yemekhaneler, ogunler, menuDetay };