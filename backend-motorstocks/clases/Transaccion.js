const fs   = require('fs');
const path = require('path');

const _rutaOrdenes = path.join(__dirname, '..', 'data', 'ordenes.json');
const _rutaVentas  = path.join(__dirname, '..', 'data', 'ventas.json');

class Transaccion {
    // ─── Datos en memoria ────────────────────────────────────────────────────
    static rutaOrdenes = _rutaOrdenes;
    static rutaVentas  = _rutaVentas;
    static lista       = JSON.parse(fs.readFileSync(_rutaOrdenes, 'utf8'));

    // Mapa de autos reservados reconstruido desde las órdenes
    static reservados  = (() => {
        const mapa = {};
        Transaccion.lista.forEach(o => {
            if (o.estado === 'Reservado') {
                const clave = `${o.vehiculo.marca}-${o.vehiculo.modelo}`;
                mapa[clave] = { idOrden: o.idOrden, comprador: `${o.comprador.nombre} ${o.comprador.apellido}` };
            }
        });
        return mapa;
    })();

    static generarId() {
        const anio   = new Date().getFullYear();
        const numero = String(Transaccion.lista.length + 1).padStart(5, '0');
        return `MS-${anio}-${numero}`;
    }

    static guardar() {
        fs.writeFileSync(Transaccion.rutaOrdenes, JSON.stringify(Transaccion.lista, null, 2), 'utf8');
    }

    static leerVentas() {
        return JSON.parse(fs.readFileSync(Transaccion.rutaVentas, 'utf8'));
    }

    static guardarVentas(ventas) {
        fs.writeFileSync(Transaccion.rutaVentas, JSON.stringify(ventas, null, 2), 'utf8');
    }

    // ─── Constructor ─────────────────────────────────────────────────────────
    constructor({ idOrden, fechaOrden, estado = 'Reservado',
                  comprador, vehiculo, vendedor = null,
                  fechaVenta = null, idVenta = null }) {
        this.idOrden    = idOrden;
        this.fechaOrden = fechaOrden || new Date();
        this.estado     = estado;
        this.comprador  = comprador;
        this.vehiculo   = vehiculo;
        this.vendedor   = vendedor;
        this.fechaVenta = fechaVenta;
        this.idVenta    = idVenta;
    }

    // ─── Método de instancia ─────────────────────────────────────────────────
    // Formaliza la transacción: pasa de Reservado → Vendido
    formalizar({ idVenta, vendedor }) {
        this.estado     = 'Vendido';
        this.idVenta    = idVenta;
        this.vendedor   = vendedor || 'Administrador Principal';
        this.fechaVenta = new Date().toISOString();
    }
}

module.exports = Transaccion;
