const express = require('express');
const router = express.Router();
const { getCarros, registrarCarro } = require('../controllers/carros.controller');

router.get('/carros', getCarros);
router.post('/carros', registrarCarro);

module.exports = router;
