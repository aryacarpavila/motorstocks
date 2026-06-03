const Transaccion = require('../clases/Transaccion');
const Carro       = require('../clases/Carro');

function crearOrden(req, res) {
    const { usuarioId, usuarioNombre, usuarioApellido, usuarioCorreo, auto } = req.body;

    if (!usuarioId && usuarioId !== 0) {
        return res.status(401).json({ ok: false, mensaje: 'Debes iniciar sesión para generar una orden de compra.' });
    }
    if (!auto || !auto.marca || !auto.modelo || !auto.precio) {
        return res.status(400).json({ ok: false, mensaje: 'Los datos del vehículo son inválidos o están incompletos.' });
    }

    const claveAuto = `${auto.marca}-${auto.modelo}`;
    if (Transaccion.reservados[claveAuto]) {
        return res.status(409).json({ ok: false, mensaje: `El vehículo ${auto.marca} ${auto.modelo} ya se encuentra reservado.` });
    }

    const nuevaTransaccion = new Transaccion({
        idOrden:   Transaccion.generarId(),
        comprador: { id: usuarioId, nombre: usuarioNombre, apellido: usuarioApellido, correo: usuarioCorreo },
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

    Transaccion.lista.push(nuevaTransaccion);
    Transaccion.reservados[claveAuto] = { idOrden: nuevaTransaccion.idOrden, comprador: `${usuarioNombre} ${usuarioApellido}` };
    Transaccion.guardar();

    const carros = Carro.leer();
    const idx    = carros.findIndex(c => `${c.marca}-${c.modelo}` === claveAuto);
    if (idx !== -1) carros[idx].reservado = true;
    Carro.guardar(carros);

    console.log(`🛒 [ORDEN #${nuevaTransaccion.idOrden}]: "${auto.marca} ${auto.modelo}" reservado por ${usuarioNombre} ${usuarioApellido}`);
    return res.status(201).json({ ok: true, mensaje: '¡Orden de compra generada con éxito!', orden: nuevaTransaccion });
}

function getOrdenes(req, res) {
    return res.status(200).json({ ok: true, ordenes: Transaccion.lista });
}

function getOrdenesPorCliente(req, res) {
    const usuarioId = parseInt(req.params.usuarioId);
    if (isNaN(usuarioId)) return res.status(400).json({ ok: false, mensaje: 'ID de usuario inválido.' });
    return res.status(200).json({ ok: true, ordenes: Transaccion.lista.filter(o => o.comprador.id === usuarioId) });
}

function getEstadoAuto(req, res) {
    const clave   = `${req.query.marca}-${req.query.modelo}`;
    const reserva = Transaccion.reservados[clave];
    return res.status(200).json({ ok: true, reservado: !!reserva, detalle: reserva || null });
}

module.exports = { crearOrden, getOrdenes, getOrdenesPorCliente, getEstadoAuto };
