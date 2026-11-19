const express = require('express');
const { girisGerekli } = require('../middleware/oturum');
const rezervasyonController = require('../controllers/rezervasyonController');

const router = express.Router();

router.get('/menu/hafta', girisGerekli, rezervasyonController.hafta);
router.post('/rezervasyon/yap', girisGerekli, rezervasyonController.yap);

module.exports = router;