const fs = require('fs');
const { dbPath } = require('../models/db.model');

function getVehiculo(req, res) {
    const idUsuario = req.query.idUsuario;

    fs.readFile(dbPath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ ok: false, mensaje: 'Error al leer la base de datos.' });
        const db = JSON.parse(data);
        const vehiculo = db.carros.find(v => String(v.id) === String(req.params.id));
        if (!vehiculo) return res.status(404).json({ ok: false, mensaje: 'Vehículo no encontrado.' });

        let disponible = !vehiculo.reservado;

        // Si el vehículo está reservado pero quien pregunta es su comprador → disponible para citas
        if (!disponible && idUsuario) {
            const tieneOrden = (db.ordenes || []).some(o => {
                if (String(o.comprador.id) !== String(idUsuario)) return false;
                if (o.estado !== 'Reservado') return false;
                // Preferir match por idVehiculo; fallback a VIN para órdenes antiguas
                if (o.vehiculo.idVehiculo) return String(o.vehiculo.idVehiculo) === String(req.params.id);
                return o.vehiculo.vin && o.vehiculo.vin === vehiculo.vin;
            });
            if (tieneOrden) disponible = true;
        }

        return res.status(200).json({ ok: true, vehiculo: { ...vehiculo, disponible } });
    });
}

module.exports = { getVehiculo };
