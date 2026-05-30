const express = require('express');
const router = express.Router();
const { getCarros, getCarrosAdmin, registrarCarro, liberarCarro } = require('../controllers/carros.controller');

router.get('/carros', getCarros);
router.get('/carros/admin', getCarrosAdmin);
router.post('/carros', registrarCarro);
router.patch('/carros/:id/liberar', liberarCarro);

module.exports = router;
