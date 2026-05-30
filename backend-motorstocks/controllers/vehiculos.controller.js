const fs = require('fs');
const { dbPath } = require('../models/db.model');

function getVehiculo(req, res) {
    fs.readFile(dbPath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ ok: false, mensaje: 'Error al leer la base de datos.' });
        const db = JSON.parse(data);
        const vehiculo = db.carros.find(v => String(v.id) === String(req.params.id));
        if (!vehiculo) return res.status(404).json({ ok: false, mensaje: 'Vehículo no encontrado.' });
        return res.status(200).json({ ok: true, vehiculo: { ...vehiculo, disponible: !vehiculo.reservado } });
    });
}

module.exports = { getVehiculo };
