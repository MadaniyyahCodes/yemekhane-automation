const express = require('express');
const { girisGerekli } = require('../middleware/oturum');
const menuController = require('../controllers/menuController');

const router = express.Router();

router.get('/menu/bugun', girisGerekli, menuController.bugun);

module.exports = router;