const sistemRepository = require('../repositories/sistemRepository');

async function dbTest(req, res, next) {
  try {
    const yazma = await sistemRepository.yazmaSunucusuBilgisi();
    const okuma = await sistemRepository.okumaSunucusuBilgisi();
    res.json({ yazma, okuma });
  } catch (err) {
    next(err);
  }
}

module.exports = { dbTest };