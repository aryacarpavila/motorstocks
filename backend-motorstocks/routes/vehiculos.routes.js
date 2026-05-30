const express = require('express');
const router = express.Router();
const { getVehiculo } = require('../controllers/vehiculos.controller');

router.get('/vehiculos/:id', getVehiculo);

module.exports = router;
