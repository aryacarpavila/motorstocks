const express = require('express');
const router = express.Router();
const { formalizarVenta, getVentas, getVentasPorUsuario } = require('../controllers/ventas.controller');

router.post('/ventas', formalizarVenta);
router.get('/ventas', getVentas);
router.get('/ventas/usuario/:usuarioId', getVentasPorUsuario);

module.exports = router;
