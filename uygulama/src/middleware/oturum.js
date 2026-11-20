const oturumRepository = require('../repositories/oturumRepository');

async function oturumYukle(req, res, next) {
  try {
    const token = req.cookies.oturum || null;
    req.oturumToken = token;
    req.kullanici = token ? await oturumRepository.getirVeYenile(token) : null;
    res.locals.kullanici = req.kullanici; // available in every page
    next();
  } catch (err) {
    next(err);
  }
}

function girisGerekli(req, res, next) {
  if (!req.kullanici) return res.redirect('/giris');
  next();
}

function yoneticiGerekli(req, res, next) {
  if (!req.kullanici) return res.redirect('/giris');
  if (req.kullanici.rol !== 'yonetici') {
    return res.status(403).send('Bu sayfaya erişim yetkiniz yok.');
  }
  next();
}

module.exports = { oturumYukle, girisGerekli, yoneticiGerekli };