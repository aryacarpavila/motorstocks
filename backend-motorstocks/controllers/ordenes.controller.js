const { ordenesDeCompra, autosReservados, generarIdOrden, carrosPath, ordenesPath, leerJSON, guardarJSON } = require('../models/db.model');
const Transaccion = require('../clases/Transaccion');

function crearOrden(req, res) {
    const { usuarioId, usuarioNombre, usuarioApellido, usuarioCorreo, auto } = req.body;

    if (!usuarioId && usuarioId !== 0) {
        return res.status(401).json({ ok: false, mensaje: 'Debes iniciar sesión para generar una orden de compra.' });
    }
    if (!auto || !auto.marca || !auto.modelo || !auto.precio) {
        return res.status(400).json({ ok: false, mensaje: 'Los datos del vehículo son inválidos o están incompletos.' });
    }

    const claveAuto = `${auto.marca}-${auto.modelo}`;
    if (autosReservados[claveAuto]) {
        return res.status(409).json({
            ok: false,
            mensaje: `El vehículo ${auto.marca} ${auto.modelo} ya se encuentra reservado. Por favor selecciona otro vehículo.`
        });
    }

    const idOrden   = generarIdOrden();
    const fechaOrden = new Date();

    const nuevaOrden = new Transaccion({
        idOrden,
        fechaOrden,
        comprador: {
            id:       usuarioId,
            nombre:   usuarioNombre,
            apellido: usuarioApellido,
            correo:   usuarioCorreo
        },
        vehiculo: {
            idVehiculo:  auto.id          || null,
            marca:       auto.marca,
            modelo:      auto.modelo,
            ano:         auto.ano,
            precio:      auto.precio,
            color:       auto.color       || 'N/A',
            motor:       auto.motor       || 'N/A',
            transmision: auto.transmision || 'N/A',
            combustible: auto.combustible || 'N/A',
            vin:         auto.vin         || 'N/A'
        }
    });

    ordenesDeCompra.push(nuevaOrden);
    autosReservados[claveAuto] = { idOrden, comprador: `${usuarioNombre} ${usuarioApellido}` };

    try {
        const ordenes = leerJSON(ordenesPath);
        ordenes.push(nuevaOrden);
        guardarJSON(ordenesPath, ordenes);

        const carros = leerJSON(carrosPath);
        const idx = carros.findIndex(c => `${c.marca}-${c.modelo}` === claveAuto);
        if (idx !== -1) carros[idx].reservado = true;
        guardarJSON(carrosPath, carros);
    } catch (e) {
        console.error('Error actualizando archivos de datos:', e);
    }

    console.log(`🛒 [ORDEN #${idOrden}]: "${auto.marca} ${auto.modelo}" reservado por ${usuarioNombre} ${usuarioApellido}`);

    return res.status(201).json({ ok: true, mensaje: '¡Orden de compra generada con éxito!', orden: nuevaOrden });
}

function getOrdenes(req, res) {
    return res.status(200).json({ ok: true, ordenes: ordenesDeCompra });
}

function getOrdenesPorCliente(req, res) {
    const usuarioId = parseInt(req.params.usuarioId);
    if (isNaN(usuarioId)) {
        return res.status(400).json({ ok: false, mensaje: 'ID de usuario inválido.' });
    }
    const misOrdenes = ordenesDeCompra.filter(o => o.comprador.id === usuarioId);
    return res.status(200).json({ ok: true, ordenes: misOrdenes });
}

function getEstadoAuto(req, res) {
    const { marca, modelo } = req.query;
    const clave   = `${marca}-${modelo}`;
    const reserva = autosReservados[clave];
    return res.status(200).json({ ok: true, reservado: !!reserva, detalle: reserva || null });
}

module.exports = { crearOrden, getOrdenes, getOrdenesPorCliente, getEstadoAuto };
