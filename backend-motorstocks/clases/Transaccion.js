class Transaccion {
    constructor({ idOrden, fechaOrden, estado = 'Reservado',
                  comprador, vehiculo, vendedor = null,
                  fechaVenta = null, idVenta = null }) {
        this.idOrden    = idOrden;
        this.fechaOrden = fechaOrden || new Date();
        this.estado     = estado;        // 'Reservado' | 'Vendido'
        this.comprador  = comprador;
        this.vehiculo   = vehiculo;

        // Se completan al formalizar la venta (Sprint 1: formalizar)
        this.vendedor   = vendedor;
        this.fechaVenta = fechaVenta;
        this.idVenta    = idVenta;
    }

    // Formaliza la transacción: pasa de Reservado a Vendido
    formalizar({ idVenta, vendedor }) {
        this.estado     = 'Vendido';
        this.idVenta    = idVenta;
        this.vendedor   = vendedor || 'Administrador Principal';
        this.fechaVenta = new Date().toISOString();
    }
}

module.exports = Transaccion;
