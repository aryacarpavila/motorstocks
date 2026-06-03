const { usuariosRegistrados, guardarUsuarios } = require('../models/db.model');
const Cuenta = require('../clases/Cuenta');

function registro(req, res) {
    const { nombre, apellido, correo, fechaNacimiento, password, aceptaTerminos } = req.body;
    let errores = [];

    // Validación de campos vacíos básica
    if (!nombre || !apellido || !correo || !fechaNacimiento || !password) {
        errores.push({ campo: 'general', mensaje: 'Todos los campos del formulario son obligatorios.' });
    }

    if (!aceptaTerminos) {
        errores.push({ campo: 'terminos', mensaje: 'Debe aceptar los términos de operaciones en Caracas.' });
    }

    // PRIORIDAD 1: Validación de Email (Formato y Duplicado)
    const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (correo && !regexCorreo.test(correo)) {
        errores.push({ campo: 'correo', mensaje: 'El formato del correo electrónico no es válido.' });
    } else if (correo) {
        const existeEmail = usuariosRegistrados.find(user => user.correo.toLowerCase() === correo.toLowerCase());
        if (existeEmail) {
            errores.push({ campo: 'correo', mensaje: 'El correo electrónico ya fue registrado previamente en nuestro sistema.' });
        }
    }

    // PRIORIDAD 2: Validación de Edad (Mayor de 18 años)
    if (fechaNacimiento) {
        const hoy = new Date();
        const cumpleanos = new Date(fechaNacimiento);
        const fechaMinimaParaSerMayor = new Date(hoy.getFullYear() - 18, hoy.getMonth(), hoy.getDate());

        if (cumpleanos > fechaMinimaParaSerMayor) {
            errores.push({ campo: 'fechaNacimiento', mensaje: 'Acceso Denegado: Debes ser mayor de 18 años para registrarte.' });
        }
    }

    // PRIORIDAD 3: Requisitos de Seguridad de Contraseña
    if (password) {
        const regexPassword = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&._-])[A-Za-z\d@$!%*?&._-]{8,}$/;
        if (!regexPassword.test(password)) {
            errores.push({ campo: 'password', mensaje: 'La contraseña no cumple los requisitos mínimos de seguridad (Debe tener mínimo 8 caracteres, incluir un número y un símbolo especial).' });
        }
    }

    // Si hay algún error, devolvemos todos juntos
    if (errores.length > 0) {
        return res.status(400).json({ ok: false, errores: errores });
    }

    // SINO HAY ERRORES, AQUÍ SE CREA EL USUARIO REAL
    const nuevoCliente = new Cuenta({
        id: usuariosRegistrados.length + 1,
        nombre,
        apellido,
        correo,
        password,
        fechaNacimiento,
        rol: 'cliente'
    });

    usuariosRegistrados.push(nuevoCliente);
    guardarUsuarios();
    console.log('🛡️ [POLÍTICA DE SEGURIDAD]: Usuario creado con éxito:', nuevoCliente);

    return res.status(201).json({
        ok: true,
        mensaje: `¡BIENVENIDO ${nombre} ${apellido}, creado con éxito en la plataforma!`
    });
}

function login(req, res) {
    const { correo, password } = req.body;

    if (!correo || !password) {
        return res.status(400).json({ ok: false, mensaje: 'Debes ingresar correo y contraseña.' });
    }

    const usuario = usuariosRegistrados.find(user => user.correo.toLowerCase() === correo.toLowerCase());

    if (!usuario) {
        return res.status(401).json({ ok: false, mensaje: 'Credenciales incorrectas. Verifica tu correo y contraseña.' });
    }

    if (usuario.password !== password) {
        return res.status(401).json({ ok: false, mensaje: 'Credenciales incorrectas. Verifica tu correo y contraseña.' });
    }

    console.log(`🔑 [LOGIN]: Usuario ${usuario.nombre} ${usuario.apellido} inició sesión. (Rol: ${usuario.rol})`);

    return res.status(200).json({
        ok: true,
        mensaje: 'Inicio de sesión exitoso',
        usuario: {
            id: usuario.id,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            correo: usuario.correo,
            rol: usuario.rol
        }
    });
}

module.exports = { registro, login };
