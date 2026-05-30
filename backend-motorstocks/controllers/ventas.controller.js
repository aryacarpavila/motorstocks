const { ordenesDeCompra, leerDB, escribirDB } = require('../models/db.model');

function formalizarVenta(req, res) {
    const { idOrden, vendedor } = req.body;

    if (!idOrden) {
        return res.status(400).json({ ok: false, mensaje: 'Se requiere el ID de la orden.' });
    }

    // Leer db.json y actualizar el carro a vendido
    const db = leerDB();

    // Buscar la orden: primero en memoria, luego en db.json (sobrevive reinicios)
    let orden = ordenesDeCompra.find(o => o.idOrden === idOrden);
    if (!orden) {
        orden = (db.ordenes || []).find(o => o.idOrden === idOrden);
    }
    if (!orden) {
        return res.status(404).json({ ok: false, mensaje: 'Orden no encontrada.' });
    }
    if (orden.estado === 'Vendido') {
        return res.status(409).json({ ok: false, mensaje: 'Esta venta ya fue formalizada previamente.' });
    }

    const carroIdx = db.carros.findIndex(c =>
        c.marca?.toLowerCase() === orden.vehiculo.marca?.toLowerCase() &&
        c.modelo?.toLowerCase() === orden.vehiculo.modelo?.toLowerCase()
    );

    if (carroIdx !== -1) {
        db.carros[carroIdx].vendido = true;
        db.carros[carroIdx].reservado = false;
    }

    // Generar el comprobante de venta
    const totalVentas = (db.ventas || []).length;
    const venta = {
        id: `VTA-${new Date().getFullYear()}-${String(totalVentas + 1).padStart(5, '0')}`,
        fechaVenta: new Date().toISOString(),
        idOrden,
        vehiculo: { ...orden.vehiculo },
        comprador: { ...orden.comprador },
        vendedor: vendedor || 'Administrador Principal'
    };

    if (!db.ventas) db.ventas = [];
    db.ventas.push(venta);

    // Actualizar estado de la orden en db.json
    const ordenIdx = (db.ordenes || []).findIndex(o => o.idOrden === idOrden);
    if (ordenIdx !== -1) db.ordenes[ordenIdx].estado = 'Vendido';

    escribirDB(db);

    // Actualizar estado de la orden en memoria si existe
    const ordenMemoria = ordenesDeCompra.find(o => o.idOrden === idOrden);
    if (ordenMemoria) ordenMemoria.estado = 'Vendido';

    console.log(`✅ [VENTA #${venta.id}]: ${orden.vehiculo.marca} ${orden.vehiculo.modelo} formalizado. Comprador: ${orden.comprador.nombre} ${orden.comprador.apellido}`);

    return res.status(201).json({ ok: true, venta });
}

function getVentas(req, res) {
    const db = leerDB();
    return res.status(200).json({ ok: true, ventas: db.ventas || [] });
}

function getVentasPorUsuario(req, res) {
    const usuarioId = parseInt(req.params.usuarioId);
    if (isNaN(usuarioId)) {
        return res.status(400).json({ ok: false, mensaje: 'ID de usuario inválido.' });
    }
    const db = leerDB();
    const misVentas = (db.ventas || []).filter(v => v.comprador.id === usuarioId);
    return res.status(200).json({ ok: true, ventas: misVentas });
}

module.exports = { formalizarVenta, getVentas, getVentasPorUsuario };
