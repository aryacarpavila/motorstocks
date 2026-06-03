class Cuenta {
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
