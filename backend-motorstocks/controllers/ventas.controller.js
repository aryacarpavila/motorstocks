const Transaccion = require('../clases/Transaccion');
const Carro       = require('../clases/Carro');

function formalizarVenta(req, res) {
    const { idOrden, vendedor } = req.body;
    if (!idOrden) return res.status(400).json({ ok: false, mensaje: 'Se requiere el ID de la orden.' });

    const orden = Transaccion.lista.find(o => o.idOrden === idOrden);
    if (!orden)                    return res.status(404).json({ ok: false, mensaje: 'Orden no encontrada.' });
    if (orden.estado === 'Vendido') return res.status(409).json({ ok: false, mensaje: 'Esta venta ya fue formalizada previamente.' });

    // Formalizar usando el método de la clase
    const ventas  = Transaccion.leerVentas();
    const idVenta = `VTA-${new Date().getFullYear()}-${String(ventas.length + 1).padStart(5, '0')}`;
    const transaccion = new Transaccion({ ...orden });
    transaccion.formalizar({ idVenta, vendedor });

    // Marcar carro como vendido
    const carros   = Carro.leer();
    const carroIdx = carros.findIndex(c =>
        c.marca?.toLowerCase()  === orden.vehiculo.marca?.toLowerCase() &&
        c.modelo?.toLowerCase() === orden.vehiculo.modelo?.toLowerCase()
    );
    if (carroIdx !== -1) { carros[carroIdx].vendido = true; carros[carroIdx].reservado = false; }

    // Guardar comprobante
    const venta = {
        id: idVenta, fechaVenta: transaccion.fechaVenta, idOrden,
        vehiculo: { ...orden.vehiculo }, comprador: { ...orden.comprador },
        vendedor: transaccion.vendedor
    };
    ventas.push(venta);

    // Actualizar estado de la orden en lista
    orden.estado = 'Vendido';

    Carro.guardar(carros);
    Transaccion.guardar();
    Transaccion.guardarVentas(ventas);

    console.log(`✅ [VENTA #${idVenta}]: ${orden.vehiculo.marca} ${orden.vehiculo.modelo} — ${orden.comprador.nombre} ${orden.comprador.apellido}`);
    return res.status(201).json({ ok: true, venta });
}

function getVentas(req, res) {
    try {
        return res.status(200).json({ ok: true, ventas: Transaccion.leerVentas() });
    } catch {
        return res.status(200).json({ ok: true, ventas: [] });
    }
}

function getVentasPorUsuario(req, res) {
    const usuarioId = parseInt(req.params.usuarioId);
    if (isNaN(usuarioId)) return res.status(400).json({ ok: false, mensaje: 'ID de usuario inválido.' });
    try {
        const ventas = Transaccion.leerVentas().filter(v => v.comprador.id === usuarioId);
        return res.status(200).json({ ok: true, ventas });
    } catch {
        return res.status(200).json({ ok: true, ventas: [] });
    }
}

module.exports = { formalizarVenta, getVentas, getVentasPorUsuario };
