const { carrosPath, ordenesPath, leerJSON, guardarJSON } = require('../models/db.model');

function getCarros(req, res) {
    try {
        const carros = leerJSON(carrosPath);
        return res.status(200).json(carros.filter(c => !c.vendido));
    } catch {
        return res.status(500).json({ ok: false, mensaje: 'Error al leer la base de datos.' });
    }
}

function getCarrosAdmin(req, res) {
    try {
        const carros = leerJSON(carrosPath);
        return res.status(200).json(carros);
    } catch {
        return res.status(500).json({ ok: false, mensaje: 'Error al leer la base de datos.' });
    }
}

function getCarroPorId(req, res) {
    const idUsuario = req.query.idUsuario;
    try {
        const carros = leerJSON(carrosPath);
        const vehiculo = carros.find(v => String(v.id) === String(req.params.id));
        if (!vehiculo) return res.status(404).json({ ok: false, mensaje: 'Vehículo no encontrado.' });

        let disponible = !vehiculo.reservado;

        // Si está reservado pero quien pregunta es su comprador → disponible para citas
        if (!disponible && idUsuario) {
            const ordenes = leerJSON(ordenesPath);
            const tieneOrden = ordenes.some(o => {
                if (String(o.comprador.id) !== String(idUsuario)) return false;
                if (o.estado !== 'Reservado') return false;
                if (o.vehiculo.idVehiculo) return String(o.vehiculo.idVehiculo) === String(req.params.id);
                return o.vehiculo.vin && o.vehiculo.vin === vehiculo.vin;
            });
            if (tieneOrden) disponible = true;
        }

        return res.status(200).json({ ok: true, vehiculo: { ...vehiculo, disponible } });
    } catch {
        return res.status(500).json({ ok: false, mensaje: 'Error al leer la base de datos.' });
    }
}

function registrarCarro(req, res) {
    const nuevoCarro = req.body;
    try {
        const carros = leerJSON(carrosPath);

        // Validar VIN único
        if (nuevoCarro.vin) {
            const existeVin = carros.find(c =>
                c.vin && c.vin.toString().toLowerCase() === nuevoCarro.vin.toString().toLowerCase()
            );
            if (existeVin) {
                return res.status(400).json({ ok: false, mensaje: 'El número de VIN ya está registrado en otro vehículo.' });
            }
        }

        // Normalizar texto
        const toTitleCase = str => str
            ? str.trim().charAt(0).toUpperCase() + str.trim().slice(1).toLowerCase()
            : str;

        nuevoCarro.marca       = toTitleCase(nuevoCarro.marca);
        nuevoCarro.modelo      = toTitleCase(nuevoCarro.modelo);
        nuevoCarro.color       = toTitleCase(nuevoCarro.color);
        nuevoCarro.combustible = nuevoCarro.combustible?.trim() ?? nuevoCarro.combustible;
        nuevoCarro.transmision = nuevoCarro.transmision?.trim() ?? nuevoCarro.transmision;
        nuevoCarro.tipo        = nuevoCarro.tipo?.trim() ?? nuevoCarro.tipo;

        if (!nuevoCarro.id) nuevoCarro.id = Date.now().toString();
        carros.push(nuevoCarro);
        guardarJSON(carrosPath, carros);
        return res.status(201).json(nuevoCarro);
    } catch {
        return res.status(500).json({ ok: false, mensaje: 'Error al guardar en la base de datos.' });
    }
}

function liberarCarro(req, res) {
    try {
        const carros = leerJSON(carrosPath);
        const idx = carros.findIndex(c => String(c.id) === String(req.params.id));
        if (idx === -1) return res.status(404).json({ ok: false, mensaje: 'Carro no encontrado.' });
        carros[idx].reservado = false;
        guardarJSON(carrosPath, carros);
        return res.status(200).json({ ok: true, mensaje: 'Carro liberado correctamente.' });
    } catch {
        return res.status(500).json({ ok: false, mensaje: 'Error al liberar el carro.' });
    }
}

module.exports = { getCarros, getCarrosAdmin, getCarroPorId, registrarCarro, liberarCarro };
