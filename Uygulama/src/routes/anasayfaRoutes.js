const express = require('express');
const { girisGerekli } = require('../middleware/oturum');
const anasayfaController = require('../controllers/anasayfaController');

const router = express.Router();

router.get('/', girisGerekli, anasayfaController.anasayfa);

module.exports = router;