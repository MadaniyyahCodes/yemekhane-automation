const bcrypt = require('bcryptjs');
const kullaniciRepository = require('../repositories/kullaniciRepository');
const oturumRepository = require('../repositories/oturumRepository');

function girisSayfasi(req, res) {
  if (req.kullanici) return res.redirect('/');
  res.render('giris', { hata: null, eposta: '' });
}

async function girisYap(req, res, next) {
  try {
    const eposta = (req.body.eposta || '').trim();
    const sifre = req.body.sifre || '';

    const k = await kullaniciRepository.epostayaGore(eposta);
    const dogru = k && (await bcrypt.compare(sifre, k.sifre_hash));
    if (!dogru) {
      return res.status(401).render('giris', { hata: 'E-posta veya şifre hatalı.', eposta });
    }

    const token = await oturumRepository.olustur({
      id: k.id, eposta: k.eposta, rol: k.rol, ad: k.ad,
    });
    res.cookie('oturum', token, { httpOnly: true, sameSite: 'lax' });
    res.redirect('/');
  } catch (err) {
    next(err);
  }
}

async function cikisYap(req, res, next) {
  try {
    if (req.oturumToken) await oturumRepository.sil(req.oturumToken);
    res.clearCookie('oturum');
    res.redirect('/giris');
  } catch (err) {
    next(err);
  }
}

module.exports = { girisSayfasi, girisYap, cikisYap };