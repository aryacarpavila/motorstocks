const fs = require('fs');
const { ordenesDeCompra, autosReservados, generarIdOrden, dbPath } = require('../models/db.model');

function crearOrden(req, res) {
    const { usuarioId, usuarioNombre, usuarioApellido, usuarioCorreo, auto } = req.body;

    // Validación: todos los datos necesarios deben estar presentes
    if (!usuarioId && usuarioId !== 0) {
        return res.status(401).json({ ok: false, mensaje: 'Debes iniciar sesión para generar una orden de compra.' });
    }
    if (!auto || !auto.marca || !auto.modelo || !auto.precio) {
        return res.status(400).json({ ok: false, mensaje: 'Los datos del vehículo son inválidos o están incompletos.' });
    }

    // Validación: verificar que el auto no esté ya reservado
    const claveAuto = `${auto.marca}-${auto.modelo}`;
    if (autosReservados[claveAuto]) {
        return res.status(409).json({
            ok: false,
            mensaje: `El vehículo ${auto.marca} ${auto.modelo} ya se encuentra reservado. Por favor selecciona otro vehículo.`
        });
    }

    // Generar ID de orden único
    const idOrden = generarIdOrden();
    const fechaOrden = new Date();

    // Crear la orden
    const nuevaOrden = {
        idOrden,
        fechaOrden,
        estado: 'Reservado',
        comprador: {
            id: usuarioId,
            nombre: usuarioNombre,
            apellido: usuarioApellido,
            correo: usuarioCorreo
        },
        vehiculo: {
            marca: auto.marca,
            modelo: auto.modelo,
            ano: auto.ano,
            precio: auto.precio,
            color: auto.color || 'N/A',
            motor: auto.motor || 'N/A',
            transmision: auto.transmision || 'N/A',
            combustible: auto.combustible || 'N/A',
            vin: auto.vin || 'N/A'
        }
    };

    // Guardar la orden y marcar el auto como reservado en memoria
    ordenesDeCompra.push(nuevaOrden);
    autosReservados[claveAuto] = { idOrden, comprador: `${usuarioNombre} ${usuarioApellido}` };

    // Persistir reservado: true en db.json
    try {
        const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        const idx = dbData.carros.findIndex(c => `${c.marca}-${c.modelo}` === claveAuto);
        if (idx !== -1) {
            dbData.carros[idx].reservado = true;
        }
        fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2), 'utf8');
    } catch (e) {
        console.error('Error actualizando db.json:', e);
    }

    console.log(`🛒 [ORDEN #${idOrden}]: Vehículo "${auto.marca} ${auto.modelo}" reservado por ${usuarioNombre} ${usuarioApellido} (${usuarioCorreo})`);

    return res.status(201).json({
        ok: true,
        mensaje: `¡Orden de compra generada con éxito!`,
        orden: nuevaOrden
    });
}

function getOrdenes(req, res) {
    return res.status(200).json({ ok: true, ordenes: ordenesDeCompra });
}

function getOrdenesPorCliente(req, res) {
    const usuarioId = parseInt(req.params.usuarioId);

    if (isNaN(usuarioId)) {
        return res.status(400).json({ ok: false, mensaje: 'ID de usuario inválido.' });
    }

    const misOrdenes = ordenesDeCompra.filter(orden => orden.comprador.id === usuarioId);
    return res.status(200).json({ ok: true, ordenes: misOrdenes });
}

function getEstadoAuto(req, res) {
    const { marca, modelo } = req.query;
    const claveAuto = `${marca}-${modelo}`;
    const reserva = autosReservados[claveAuto];
    if (reserva) {
        return res.status(200).json({ ok: true, reservado: true, detalle: reserva });
    }
    return res.status(200).json({ ok: true, reservado: false });
}

module.exports = { crearOrden, getOrdenes, getOrdenesPorCliente, getEstadoAuto };
