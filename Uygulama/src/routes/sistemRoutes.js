const express = require('express');
const sistemController = require('../controllers/sistemController');

const router = express.Router();

router.get('/db-test', sistemController.dbTest);

module.exports = router;