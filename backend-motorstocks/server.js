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

// Base de datos de órdenes de compra en memoria
const ordenesDeCompra = [];

// ==========================================
// FUNCIÓN: Generar ID de Orden único
// Formato: MS-AÑO-XXXXX (ej: MS-2026-00042)
// ==========================================
function generarIdOrden() {
    const anio = new Date().getFullYear();
    const numero = String(ordenesDeCompra.length + 1).padStart(5, '0');
    return `MS-${anio}-${numero}`;
}

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
    const usuariosSeguros = usuariosRegistrados.map(u => {
        const { password, ...resto } = u;
        return resto;
    });
    return res.status(200).json({ ok: true, usuarios: usuariosSeguros });
});

// ==========================================
// RUTA 4: Generar Orden de Compra (POST)
// ==========================================
// Base de datos de autos reservados en memoria (índice por modelo)
const autosReservados = {};

app.post('/api/orden', (req, res) => {
    const { usuarioId, usuarioNombre, usuarioApellido, usuarioCorreo, auto } = req.body;

    // Validación: todos los datos necesarios deben estar presentes
    if (!usuarioId && usuarioId !== 0) {
        return res.status(401).json({ ok: false, mensaje: 'Debes iniciar sesión para generar una orden de compra.' });
    }
    if (!auto || !auto.marca || !auto.modelo || !auto.precio) {
        return res.status(400).json({ ok: false, mensaje: 'Los datos del vehículo son inválidos o están incompletos.' });
    }

    // Validación: verificar que el auto no esté ya reservado
    const claveAuto = `${auto.marca}-${auto.modelo}`;
    if (autosReservados[claveAuto]) {
        return res.status(409).json({
            ok: false,
            mensaje: `El vehículo ${auto.marca} ${auto.modelo} ya se encuentra reservado. Por favor selecciona otro vehículo.`
        });
    }

    // Generar ID de orden único
    const idOrden = generarIdOrden();
    const fechaOrden = new Date();

    // Crear la orden
    const nuevaOrden = {
        idOrden,
        fechaOrden,
        estado: 'Reservado',
        comprador: {
            id: usuarioId,
            nombre: usuarioNombre,
            apellido: usuarioApellido,
            correo: usuarioCorreo
        },
        vehiculo: {
            marca: auto.marca,
            modelo: auto.modelo,
            ano: auto.ano,
            precio: auto.precio,
            color: auto.color || 'N/A',
            motor: auto.motor || 'N/A',
            transmision: auto.transmision || 'N/A',
            combustible: auto.combustible || 'N/A',
            vin: auto.vin || 'N/A'
        }
    };

    // Guardar la orden y marcar el auto como reservado
    ordenesDeCompra.push(nuevaOrden);
    autosReservados[claveAuto] = { idOrden, comprador: `${usuarioNombre} ${usuarioApellido}` };

    console.log(`🛒 [ORDEN #${idOrden}]: Vehículo "${auto.marca} ${auto.modelo}" reservado por ${usuarioNombre} ${usuarioApellido} (${usuarioCorreo})`);

    return res.status(201).json({
        ok: true,
        mensaje: `¡Orden de compra generada con éxito!`,
        orden: nuevaOrden
    });
});

// ==========================================
// RUTA 5: Ver todas las órdenes (GET) - Solo Admin
// ==========================================
app.get('/api/ordenes', (req, res) => {
    return res.status(200).json({ ok: true, ordenes: ordenesDeCompra });
});

// ==========================================
// RUTA 6: Consultar estado de reserva de un auto (GET)
// ==========================================
app.get('/api/auto/estado', (req, res) => {
    const { marca, modelo } = req.query;
    const claveAuto = `${marca}-${modelo}`;
    const reserva = autosReservados[claveAuto];
    if (reserva) {
        return res.status(200).json({ ok: true, reservado: true, detalle: reserva });
    }
    return res.status(200).json({ ok: true, reservado: false });
});

// ENCENDER EL SERVIDOR
app.listen(PORT, () => {
    console.log(`\n🚀 Servidor Backend de MotorStocks listo y escuchando en: http://localhost:${PORT}`);
    console.log(`👉 Ruta para registrar:    POST http://localhost:${PORT}/api/registro`);
    console.log(`👉 Ruta para login:        POST http://localhost:${PORT}/api/login`);
    console.log(`👉 Ruta para usuarios:     GET  http://localhost:${PORT}/api/usuarios`);
    console.log(`👉 Ruta para orden:        POST http://localhost:${PORT}/api/orden`);
    console.log(`👉 Ruta para ver órdenes:  GET  http://localhost:${PORT}/api/ordenes\n`);
});