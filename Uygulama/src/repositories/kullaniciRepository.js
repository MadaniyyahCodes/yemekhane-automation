const { okuma } = require('../config/db');

async function epostayaGore(eposta) {
  const [satirlar] = await okuma.query(
    'SELECT id, eposta, rol, ad AS ad, sifre_hash AS sifre_hash ' +
    'FROM kullanicilar WHERE eposta = ?',
    [eposta]
  );
  return satirlar[0] || null;
}

module.exports = { epostayaGore };