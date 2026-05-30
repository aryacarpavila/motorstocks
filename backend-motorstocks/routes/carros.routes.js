const express = require('express');
const router  = express.Router();
const { getCarros, getCarrosAdmin, getCarroPorId, registrarCarro, liberarCarro } = require('../controllers/carros.controller');

router.get('/carros',              getCarros);
router.get('/carros/admin',        getCarrosAdmin);
router.get('/carros/:id',          getCarroPorId);   // verificar disponibilidad de un carro
router.post('/carros',             registrarCarro);
router.patch('/carros/:id/liberar', liberarCarro);

module.exports = router;
