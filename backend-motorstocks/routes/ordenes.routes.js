const express = require('express');
const router = express.Router();
const { crearOrden, getOrdenes, getOrdenesPorCliente, getEstadoAuto } = require('../controllers/ordenes.controller');

router.post('/orden', crearOrden);
router.get('/ordenes', getOrdenes);
router.get('/ordenes/cliente/:usuarioId', getOrdenesPorCliente);
router.get('/auto/estado', getEstadoAuto);

module.exports = router;
