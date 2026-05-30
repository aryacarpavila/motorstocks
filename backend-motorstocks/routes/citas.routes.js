const express = require('express');
const router = express.Router();
const {
    getCitas,
    getCitasPorUsuario,
    getHorariosDisponibles,
    crearCita,
    actualizarEstadoCita,
    reprogramarCita
} = require('../controllers/citas.controller');

router.get('/citas', getCitas);
router.get('/citas/usuario/:idUsuario', getCitasPorUsuario);
router.get('/horarios-disponibles', getHorariosDisponibles);
router.post('/citas', crearCita);
router.patch('/citas/:id', actualizarEstadoCita);
router.patch('/citas/:id/reprogramar', reprogramarCita);

module.exports = router;
