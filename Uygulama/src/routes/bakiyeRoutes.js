const express = require('express');
const { girisGerekli } = require('../middleware/oturum');
const bakiyeController = require('../controllers/bakiyeController');

const router = express.Router();

router.get('/bakiye', girisGerekli, bakiyeController.goster);
router.post('/bakiye/yukle', girisGerekli, bakiyeController.yukle);

module.exports = router;