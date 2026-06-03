class Cita {
    constructor({ id, idUsuario, idVehiculo, tipoCita, fecha, horario,
                  estado = 'activa', cliente, auto, imagen, fechaCreacion }) {
        this.id            = id;
        this.idUsuario     = String(idUsuario);
        this.idVehiculo    = idVehiculo;
        this.tipoCita      = tipoCita;
        this.fecha         = fecha;
        this.horario       = horario;
        this.estado        = estado;
        this.cliente       = cliente       || '';
        this.auto          = auto          || '';
        this.imagen        = imagen        || '';
        this.fechaCreacion = fechaCreacion || new Date().toISOString();
    }
}

module.exports = Cita;
