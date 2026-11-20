const { yazma, okuma } = require('../config/db');

// The occupancy + rating report is a list, so it comes from the REPLICA.
async function menuRaporu(baslangic, bitis) {
  const [satirlar] = await okuma.query(
    'SELECT d.menu_id, d.tarih, d.yemekhane, d.ogun, d.kapasite, d.rezerve, d.doluluk_yuzde, ' +
    '       p.oy_sayisi, p.ortalama_puan, m.ogrenci_fiyati, m.personel_fiyati ' +
    'FROM v_menu_doluluk d ' +
    'JOIN menuler m ON m.id = d.menu_id ' +
    'LEFT JOIN v_menu_puan p ON p.menu_id = d.menu_id ' +
    'WHERE d.tarih BETWEEN ? AND ? ' +
    'ORDER BY d.tarih DESC, d.yemekhane_id, d.ogun_id',
    [baslangic, bitis]
  );
  return satirlar;
}

// Reference data for the form checkboxes: REPLICA
async function tumYemekler() {
  const [satirlar] = await okuma.query(
    'SELECT y.id, y.ad, y.kalori, y.vejetaryen, k.ad AS kategori ' +
    'FROM yemekler y JOIN yemek_kategorileri k ON k.id = y.kategori_id ' +
    'ORDER BY k.ad, y.ad'
  );
  return satirlar;
}

// The menu about to be edited is read from the PRIMARY, so the form is never stale.
async function menuGetir(id) {
  const [menuler] = await yazma.query(
    'SELECT m.id, m.yemekhane_id, m.tarih, m.ogun_id, m.ogrenci_fiyati, m.personel_fiyati, ' +
    '       y.ad AS yemekhane, o.ad AS ogun ' +
    'FROM menuler m ' +
    'JOIN yemekhaneler y ON y.id = m.yemekhane_id ' +
    'JOIN ogunler o ON o.id = m.ogun_id ' +
    'WHERE m.id = ?',
    [id]
  );
  if (!menuler[0]) return null;
  const [yemekler] = await yazma.query('SELECT yemek_id FROM menu_yemekleri WHERE menu_id = ?', [id]);
  return { ...menuler[0], yemekIdleri: yemekler.map((r) => r.yemek_id) };
}

async function yemekleriYaz(baglanti, menuId, yemekIdleri) {
  if (yemekIdleri.length === 0) return;
  await baglanti.query(
    'INSERT INTO menu_yemekleri (menu_id, yemek_id) VALUES ?',
    [yemekIdleri.map((yemekId) => [menuId, yemekId])]
  );
}

// Writes go to the PRIMARY, inside one transaction (all or nothing).
async function menuOlustur(v) {
  const baglanti = await yazma.getConnection();
  try {
    await baglanti.beginTransaction();

    const [mevcut] = await baglanti.query(
      'SELECT id FROM menuler WHERE yemekhane_id = ? AND tarih = ? AND ogun_id = ? FOR UPDATE',
      [v.yemekhaneId, v.tarih, v.ogunId]
    );
    if (mevcut.length > 0) throw Object.assign(new Error('Menü zaten var'), { code: 'MENU_VAR' });

    const [sonuc] = await baglanti.query(
      'INSERT INTO menuler (yemekhane_id, tarih, ogun_id, ogrenci_fiyati, personel_fiyati) VALUES (?, ?, ?, ?, ?)',
      [v.yemekhaneId, v.tarih, v.ogunId, v.ogrenciFiyati, v.personelFiyati]
    );
    await yemekleriYaz(baglanti, sonuc.insertId, v.yemekIdleri);

    await baglanti.commit();
    return sonuc.insertId;
  } catch (err) {
    await baglanti.rollback();
    throw err;
  } finally {
    baglanti.release();
  }
}

async function menuGuncelle(id, v) {
  const baglanti = await yazma.getConnection();
  try {
    await baglanti.beginTransaction();
    await baglanti.query(
      'UPDATE menuler SET ogrenci_fiyati = ?, personel_fiyati = ? WHERE id = ?',
      [v.ogrenciFiyati, v.personelFiyati, id]
    );
    await baglanti.query('DELETE FROM menu_yemekleri WHERE menu_id = ?', [id]);
    await yemekleriYaz(baglanti, id, v.yemekIdleri);
    await baglanti.commit();
  } catch (err) {
    await baglanti.rollback();
    throw err;
  } finally {
    baglanti.release();
  }
}

module.exports = { menuRaporu, tumYemekler, menuGetir, menuOlustur, menuGuncelle };