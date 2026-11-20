const express = require('express');
const { yoneticiGerekli } = require('../middleware/oturum');
const yoneticiController = require('../controllers/yoneticiController');

const router = express.Router();

router.get('/yonetici', yoneticiGerekli, yoneticiController.liste);
router.get('/yonetici/menu/yeni', yoneticiGerekli, yoneticiController.yeniForm);
router.post('/yonetici/menu/yeni', yoneticiGerekli, yoneticiController.olustur);
router.get('/yonetici/menu/:id/duzenle', yoneticiGerekli, yoneticiController.duzenleForm);
router.post('/yonetici/menu/:id/duzenle', yoneticiGerekli, yoneticiController.guncelle);

module.exports = router;