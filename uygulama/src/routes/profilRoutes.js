const express = require('express');
const { girisGerekli } = require('../middleware/oturum');
const profilController = require('../controllers/profilController');

const router = express.Router();

router.get('/profil', girisGerekli, profilController.goster);
router.post('/profil/alerjen', girisGerekli, profilController.kaydet);

module.exports = router;