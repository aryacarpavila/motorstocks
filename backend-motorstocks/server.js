const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000; // El backend correrá en el puerto 3000

// CONFIGURACIONES (Middlewares)
app.use(cors());          // Permite que tu app de Angular (puerto 4200) le haga peticiones al backend
app.use(express.json());  // Permite que el servidor entienda datos en formato JSON que envíe el cliente

// Base de datos simulada en memoria (Array)
const usuariosRegistrados = [
    {
        id: 0,
        nombre: 'Administrador',
        apellido: 'Principal',
        correo: 'admin@motorstocks.com',
        password: 'motorstocks_123',
        rol: 'admin',
        fechaRegistro: new Date()
    }
];

let citaIdCounter = 3;
const listaCitas = [
    { id: 1, clienteId: null, cliente: 'Juan Pérez', auto: 'Tesla Model S Plaid', fecha: '2026-06-01', hora: '10:00 AM', tipo: 'Test Drive', estado: 'Pendiente', fechaCreacion: new Date() },
    { id: 2, clienteId: null, cliente: 'María Gómez', auto: 'Porsche 911 Carrera GTS', fecha: '2026-06-05', hora: '02:30 PM', tipo: 'Consulta de Precio', estado: 'Confirmada', fechaCreacion: new Date() }
];

// ==========================================
// RUTA 1: Recibir registros desde Angular (POST)
// ==========================================
app.post('/api/registro', (req, res) => {
    const { nombre, apellido, correo, fechaNacimiento, password, aceptaTerminos } = req.body;
    let errores = [];

    // Validación de campos vacíos básica
    if (!nombre || !apellido || !correo || !fechaNacimiento || !password) {
        errores.push({ campo: 'general', mensaje: 'Todos los campos del formulario son obligatorios.' });
    }

    if (!aceptaTerminos) {
        errores.push({ campo: 'terminos', mensaje: 'Debe aceptar los términos de operaciones en Caracas.' });
    }

    // ❌ PRIORIDAD 1: Validación de Email (Formato y Duplicado)
    const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (correo && !regexCorreo.test(correo)) {
        errores.push({ campo: 'correo', mensaje: 'El formato del correo electrónico no es válido.' });
    } else if (correo) {
        const existeEmail = usuariosRegistrados.find(user => user.correo.toLowerCase() === correo.toLowerCase());
        if (existeEmail) {
            errores.push({ campo: 'correo', mensaje: 'El correo electrónico ya fue registrado previamente en nuestro sistema.' });
        }
    }

    // ❌ PRIORIDAD 2: Validación de Edad (Mayor de 18 años utilizando el año 2026 actual)
    if (fechaNacimiento) {
        const hoy = new Date();
        const cumpleanos = new Date(fechaNacimiento);
        const fechaMinimaParaSerMayor = new Date(hoy.getFullYear() - 18, hoy.getMonth(), hoy.getDate());

        if (cumpleanos > fechaMinimaParaSerMayor) {
            errores.push({ campo: 'fechaNacimiento', mensaje: 'Acceso Denegado: Debes ser mayor de 18 años para registrarte.' });
        }
    }

    // ❌ PRIORIDAD 3: Requisitos de Seguridad de Contraseña
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

    // ======== SINO HAY ERRORES, AQUÍ SE CREA EL USUARIO REAL ========
    const nuevoCliente = {
        id: usuariosRegistrados.length + 1,
        nombre,
        apellido,
        correo: correo.toLowerCase(),
        password,
        fechaNacimiento,
        fechaRegistro: new Date(),
        rol: 'cliente'
    };

    usuariosRegistrados.push(nuevoCliente);
    console.log('🛡️ [POLÍTICA DE SEGURIDAD]: Usuario creado con éxito:', nuevoCliente);

    return res.status(201).json({
        ok: true,
        mensaje: `¡BIENVENIDO ${nombre} ${apellido}, creado con éxito en la plataforma!`
    });

});

// ==========================================
// RUTA 2: Inicio de Sesión (POST)
// ==========================================
app.post('/api/login', (req, res) => {
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
});

// ==========================================
// RUTA 3: Ver todos los usuarios (GET)
// ==========================================
app.get('/api/usuarios', (req, res) => {
    // Retornamos todos los usuarios sin las contraseñas
    const usuariosSeguros = usuariosRegistrados.map(u => {
        const { password, ...resto } = u;
        return resto;
    });
    return res.status(200).json({ ok: true, usuarios: usuariosSeguros });
});

// ==========================================
// RUTA 4: Obtener todas las citas (GET)
// ==========================================
app.get('/api/citas', (req, res) => {
    return res.status(200).json({ ok: true, citas: listaCitas });
});

// ==========================================
// RUTA 5: Registrar nueva cita (POST)
// ==========================================
app.post('/api/citas', (req, res) => {
    const { clienteId, cliente, auto, fecha, hora, tipo } = req.body;

    if (!cliente || !auto || !fecha || !hora || !tipo) {
        return res.status(400).json({ ok: false, mensaje: 'Todos los campos son obligatorios.' });
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaCita = new Date(fecha + 'T00:00:00');
    if (fechaCita < hoy) {
        return res.status(400).json({ ok: false, mensaje: 'La fecha de la cita debe ser hoy o una fecha futura.' });
    }

    const nuevaCita = {
        id: citaIdCounter++,
        clienteId: clienteId || null,
        cliente,
        auto,
        fecha,
        hora,
        tipo,
        estado: 'Pendiente',
        fechaCreacion: new Date()
    };

    listaCitas.push(nuevaCita);
    console.log(`📅 [CITA]: Nueva cita agendada por ${cliente} para el vehículo ${auto}.`);

    return res.status(201).json({
        ok: true,
        mensaje: `¡Cita agendada con éxito! Te esperamos el ${fecha} a las ${hora}.`
    });
});

// ==========================================
// RUTA 6: Actualizar estado de cita (PATCH)
// ==========================================
app.patch('/api/citas/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { estado } = req.body;

    const estadosValidos = ['Pendiente', 'Confirmada', 'Cancelada'];
    if (!estado || !estadosValidos.includes(estado)) {
        return res.status(400).json({ ok: false, mensaje: 'Estado inválido.' });
    }

    const cita = listaCitas.find(c => c.id === id);
    if (!cita) {
        return res.status(404).json({ ok: false, mensaje: 'Cita no encontrada.' });
    }

    cita.estado = estado;
    console.log(`📅 [CITA]: Cita #${id} de ${cita.cliente} actualizada a estado: ${estado}`);

    return res.status(200).json({ ok: true, mensaje: `Cita actualizada a ${estado}.` });
});

// ENCENDER EL SERVIDOR
app.listen(PORT, () => {
    console.log(`\n🚀 Servidor Backend de MotorStocks listo y escuchando en: http://localhost:${PORT}`);
    console.log(`👉 Ruta para registrar: POST http://localhost:${PORT}/api/registro`);
    console.log(`👉 Ruta para ver usuarios: GET http://localhost:${PORT}/api/usuarios\n`);
});