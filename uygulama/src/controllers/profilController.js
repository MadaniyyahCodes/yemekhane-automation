const alerjenRepository = require('../repositories/alerjenRepository');

async function goster(req, res, next) {
  try {
    const kaydedildi = req.query.ok === '1';
    const alerjenler = await alerjenRepository.tumu();
    const secilen = await alerjenRepository.secilenIdler(req.kullanici.id, kaydedildi);
    res.render('profil', {
      alerjenler,
      secilen,
      basari: kaydedildi ? 'Alerjen tercihleriniz kaydedildi.' : null,
    });
  } catch (err) {
    next(err);
  }
}

async function kaydet(req, res, next) {
  try {
    const alerjenler = await alerjenRepository.tumu();
    const gecerli = new Set(alerjenler.map((a) => Number(a.id)));
    // Keep only ids that really exist (input checking)
    const idler = [...new Set([].concat(req.body.alerjenler || []).map(Number))]
      .filter((n) => gecerli.has(n));
    await alerjenRepository.kaydet(req.kullanici.id, idler);
    res.redirect('/profil?ok=1');
  } catch (err) {
    next(err);
  }
}

module.exports = { goster, kaydet };