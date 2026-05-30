const fs = require('fs');
const { leerDB, escribirDB, dbPath } = require('../models/db.model');

function getCarros(req, res) {
    fs.readFile(dbPath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ ok: false, mensaje: 'Error al leer la base de datos' });
        const db = JSON.parse(data);
        // Devolver el arreglo de carros directamente para compatibilidad con el frontend actual
        return res.status(200).json(db.carros.filter(c => !c.vendido));
    });
}

function registrarCarro(req, res) {
    const nuevoCarro = req.body;
    fs.readFile(dbPath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ ok: false, mensaje: 'Error al leer la base de datos' });

        const db = JSON.parse(data);

        // Validar VIN único
        if (nuevoCarro.vin) {
            const existeVin = db.carros.find(carro => carro.vin && carro.vin.toString().toLowerCase() === nuevoCarro.vin.toString().toLowerCase());
            if (existeVin) {
                return res.status(400).json({ ok: false, mensaje: 'El número de VIN ya está registrado en otro vehículo.' });
            }
        }

        // Normalizar texto: primera letra mayúscula, resto minúscula
        const toTitleCase = (str) => str
            ? str.trim().charAt(0).toUpperCase() + str.trim().slice(1).toLowerCase()
            : str;

        nuevoCarro.marca = toTitleCase(nuevoCarro.marca);
        nuevoCarro.modelo = nuevoCarro.modelo ? nuevoCarro.modelo.trim() : nuevoCarro.modelo;
        nuevoCarro.color = toTitleCase(nuevoCarro.color);
        nuevoCarro.combustible = toTitleCase(nuevoCarro.combustible);
        nuevoCarro.transmision = nuevoCarro.transmision ? nuevoCarro.transmision.trim() : nuevoCarro.transmision;
        nuevoCarro.direccion = toTitleCase(nuevoCarro.direccion);

        if (!nuevoCarro.id) {
            nuevoCarro.id = Date.now().toString(); // Asignar un ID único
        }
        db.carros.push(nuevoCarro);

        fs.writeFile(dbPath, JSON.stringify(db, null, 2), (err) => {
            if (err) return res.status(500).json({ ok: false, mensaje: 'Error al guardar en la base de datos' });
            return res.status(201).json(nuevoCarro);
        });
    });
}

module.exports = { getCarros, registrarCarro };
