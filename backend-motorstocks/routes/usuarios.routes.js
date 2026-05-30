const express = require('express');
const router = express.Router();
const { getUsuarios } = require('../controllers/usuarios.controller');

router.get('/usuarios', getUsuarios);

module.exports = router;
