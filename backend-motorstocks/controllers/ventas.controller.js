const { ordenesDeCompra, carrosPath, ordenesPath, ventasPath, leerJSON, guardarJSON } = require('../models/db.model');
const Transaccion = require('../clases/Transaccion');

function formalizarVenta(req, res) {
    const { idOrden, vendedor } = req.body;

    if (!idOrden) {
        return res.status(400).json({ ok: false, mensaje: 'Se requiere el ID de la orden.' });
    }

    let carros, ordenes, ventas;
    try {
        carros  = leerJSON(carrosPath);
        ordenes = leerJSON(ordenesPath);
        ventas  = leerJSON(ventasPath);
    } catch {
        return res.status(500).json({ ok: false, mensaje: 'Error al leer la base de datos.' });
    }

    // Buscar la orden en memoria primero (más rápido), luego en archivo
    let orden = ordenesDeCompra.find(o => o.idOrden === idOrden);
    if (!orden) orden = ordenes.find(o => o.idOrden === idOrden);
    if (!orden) return res.status(404).json({ ok: false, mensaje: 'Orden no encontrada.' });
    if (orden.estado === 'Vendido') {
        return res.status(409).json({ ok: false, mensaje: 'Esta venta ya fue formalizada previamente.' });
    }

    // Marcar carro como vendido en carros.json
    const carroIdx = carros.findIndex(c =>
        c.marca?.toLowerCase() === orden.vehiculo.marca?.toLowerCase() &&
        c.modelo?.toLowerCase() === orden.vehiculo.modelo?.toLowerCase()
    );
    if (carroIdx !== -1) {
        carros[carroIdx].vendido   = true;
        carros[carroIdx].reservado = false;
    }

    // Formalizar la transacción usando la clase Transaccion
    const transaccion = new Transaccion({ ...orden });
    const idVenta = `VTA-${new Date().getFullYear()}-${String(ventas.length + 1).padStart(5, '0')}`;
    transaccion.formalizar({ idVenta, vendedor });

    const venta = {
        id:         idVenta,
        fechaVenta: transaccion.fechaVenta,
        idOrden,
        vehiculo:   { ...orden.vehiculo },
        comprador:  { ...orden.comprador },
        vendedor:   transaccion.vendedor
    };
    ventas.push(venta);

    // Actualizar estado de la orden en archivo
    const ordenIdx = ordenes.findIndex(o => o.idOrden === idOrden);
    if (ordenIdx !== -1) ordenes[ordenIdx].estado = 'Vendido';

    // Persistir los tres archivos
    try {
        guardarJSON(carrosPath,  carros);
        guardarJSON(ordenesPath, ordenes);
        guardarJSON(ventasPath,  ventas);
    } catch {
        return res.status(500).json({ ok: false, mensaje: 'Error al guardar en la base de datos.' });
    }

    // Actualizar orden en memoria
    const ordenMemoria = ordenesDeCompra.find(o => o.idOrden === idOrden);
    if (ordenMemoria) ordenMemoria.estado = 'Vendido';

    console.log(`✅ [VENTA #${venta.id}]: ${orden.vehiculo.marca} ${orden.vehiculo.modelo} — Comprador: ${orden.comprador.nombre} ${orden.comprador.apellido}`);

    return res.status(201).json({ ok: true, venta });
}

function getVentas(req, res) {
    try {
        const ventas = leerJSON(ventasPath);
        return res.status(200).json({ ok: true, ventas });
    } catch {
        return res.status(200).json({ ok: true, ventas: [] });
    }
}

function getVentasPorUsuario(req, res) {
    const usuarioId = parseInt(req.params.usuarioId);
    if (isNaN(usuarioId)) {
        return res.status(400).json({ ok: false, mensaje: 'ID de usuario inválido.' });
    }
    try {
        const ventas   = leerJSON(ventasPath);
        const misVentas = ventas.filter(v => v.comprador.id === usuarioId);
        return res.status(200).json({ ok: true, ventas: misVentas });
    } catch {
        return res.status(200).json({ ok: true, ventas: [] });
    }
}

module.exports = { formalizarVenta, getVentas, getVentasPorUsuario };
