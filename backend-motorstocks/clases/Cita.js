const fs   = require('fs');
const path = require('path');

const _ruta = path.join(__dirname, '..', 'data', 'citas.json');

class Cita {
    // ─── Datos en memoria ────────────────────────────────────────────────────
    static ruta     = _ruta;
    static lista    = JSON.parse(fs.readFileSync(_ruta, 'utf8'));
    static HORARIOS = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];
    static _contador = Cita.lista.length > 0
        ? Math.max(...Cita.lista.map(c => parseInt(c.id) || 0)) + 1
        : 1;

    static siguienteId() {
        return String(Cita._contador++);
    }

    static guardar() {
        fs.writeFileSync(Cita.ruta, JSON.stringify(Cita.lista, null, 2), 'utf8');
    }

    // ─── Constructor ─────────────────────────────────────────────────────────
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
