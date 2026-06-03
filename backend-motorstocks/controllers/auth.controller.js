const Cuenta = require('../clases/Cuenta');

function registro(req, res) {
    const { nombre, apellido, correo, fechaNacimiento, password, aceptaTerminos } = req.body;
    let errores = [];

    if (!nombre || !apellido || !correo || !fechaNacimiento || !password) {
        errores.push({ campo: 'general', mensaje: 'Todos los campos del formulario son obligatorios.' });
    }
    if (!aceptaTerminos) {
        errores.push({ campo: 'terminos', mensaje: 'Debe aceptar los términos de operaciones en Caracas.' });
    }

    const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (correo && !regexCorreo.test(correo)) {
        errores.push({ campo: 'correo', mensaje: 'El formato del correo electrónico no es válido.' });
    } else if (correo) {
        const existeEmail = Cuenta.lista.find(u => u.correo.toLowerCase() === correo.toLowerCase());
        if (existeEmail) {
            errores.push({ campo: 'correo', mensaje: 'El correo electrónico ya fue registrado previamente en nuestro sistema.' });
        }
    }

    if (fechaNacimiento) {
        const hoy    = new Date();
        const cumple = new Date(fechaNacimiento);
        const minima = new Date(hoy.getFullYear() - 18, hoy.getMonth(), hoy.getDate());
        if (cumple > minima) {
            errores.push({ campo: 'fechaNacimiento', mensaje: 'Acceso Denegado: Debes ser mayor de 18 años para registrarte.' });
        }
    }

    if (password) {
        const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&._-])[A-Za-z\d@$!%*?&._-]{8,}$/;
        if (!regex.test(password)) {
            errores.push({ campo: 'password', mensaje: 'La contraseña no cumple los requisitos mínimos de seguridad (Debe tener mínimo 8 caracteres, incluir un número y un símbolo especial).' });
        }
    }

    if (errores.length > 0) return res.status(400).json({ ok: false, errores });

    const nuevaCuenta = new Cuenta({
        id: Cuenta.lista.length + 1,
        nombre, apellido, correo, password, fechaNacimiento
    });

    Cuenta.lista.push(nuevaCuenta);
    Cuenta.guardar();
    console.log('🛡️ [REGISTRO]:', nuevaCuenta.correo);

    return res.status(201).json({ ok: true, mensaje: `¡BIENVENIDO ${nombre} ${apellido}, creado con éxito en la plataforma!` });
}

function login(req, res) {
    const { correo, password } = req.body;
    if (!correo || !password) {
        return res.status(400).json({ ok: false, mensaje: 'Debes ingresar correo y contraseña.' });
    }

    const cuenta = Cuenta.lista.find(u => u.correo.toLowerCase() === correo.toLowerCase());
    if (!cuenta || cuenta.password !== password) {
        return res.status(401).json({ ok: false, mensaje: 'Credenciales incorrectas. Verifica tu correo y contraseña.' });
    }

    console.log(`🔑 [LOGIN]: ${cuenta.nombre} ${cuenta.apellido} (Rol: ${cuenta.rol})`);
    return res.status(200).json({
        ok: true,
        mensaje: 'Inicio de sesión exitoso',
        usuario: { id: cuenta.id, nombre: cuenta.nombre, apellido: cuenta.apellido, correo: cuenta.correo, rol: cuenta.rol }
    });
}

module.exports = { registro, login };
