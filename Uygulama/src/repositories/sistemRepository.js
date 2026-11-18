const { yazma, okuma } = require('../config/db');

async function yazmaSunucusuBilgisi() {
  const [satirlar] = await yazma.query(
    'SELECT @@hostname AS sunucu, @@read_only AS salt_okunur'
  );
  return satirlar[0];
}

async function okumaSunucusuBilgisi() {
  const [satirlar] = await okuma.query(
    'SELECT @@hostname AS sunucu, @@read_only AS salt_okunur, ' +
    '(SELECT COUNT(*) FROM kullanicilar) AS kullanici_sayisi'
  );
  return satirlar[0];
}

module.exports = { yazmaSunucusuBilgisi, okumaSunucusuBilgisi };