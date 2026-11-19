const express = require('express');
const { girisGerekli } = require('../middleware/oturum');
const rezervasyonController = require('../controllers/rezervasyonController');
const rezervasyonlarimController = require('../controllers/rezervasyonlarimController');

const router = express.Router();

router.get('/menu/hafta', girisGerekli, rezervasyonController.hafta);
router.post('/rezervasyon/yap', girisGerekli, rezervasyonController.yap);
router.get('/rezervasyonlarim', girisGerekli, rezervasyonlarimController.liste);
router.post('/rezervasyon/iptal', girisGerekli, rezervasyonlarimController.iptal);

module.exports = router;