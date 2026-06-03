const fs   = require('fs');
const path = require('path');

const _ruta = path.join(__dirname, '..', 'data', 'usuarios.json');

class Cuenta {
    // ─── Datos en memoria ────────────────────────────────────────────────────
    static ruta  = _ruta;
    static lista = JSON.parse(fs.readFileSync(_ruta, 'utf8'));

    static guardar() {
        fs.writeFileSync(Cuenta.ruta, JSON.stringify(Cuenta.lista, null, 2), 'utf8');
    }

    // ─── Constructor ─────────────────────────────────────────────────────────
    constructor({ id, nombre, apellido, correo, password,
                  fechaNacimiento, fechaRegistro, rol = 'cliente' }) {
        this.id              = id;
        this.nombre          = nombre;
        this.apellido        = apellido;
        this.correo          = correo.toLowerCase();
        this.password        = password;
        this.fechaNacimiento = fechaNacimiento;
        this.fechaRegistro   = fechaRegistro || new Date();
        this.rol             = rol;
    }
}

module.exports = Cuenta;
