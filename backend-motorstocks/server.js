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

// Vehículos con disponibilidad
const listaVehiculos = [
    { id: 'v001', nombre: 'Tesla Model S Plaid',     disponible: true },
    { id: 'v002', nombre: 'Porsche 911 Carrera GTS', disponible: true },
    { id: 'v003', nombre: 'BMW M4 Competition',       disponible: true },
    { id: 'v004', nombre: 'Audi RS e-tron GT',        disponible: true }
];

const HORARIOS = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];

let citaIdCounter = 1;
const listaCitas = [];

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
// RUTA 4: Obtener todas las citas (GET - admin)
// ==========================================
app.get('/api/citas', (req, res) => {
    return res.status(200).json({ ok: true, citas: listaCitas });
});

// ==========================================
// RUTA 5: Citas por usuario (GET)
// ==========================================
app.get('/api/citas/usuario/:idUsuario', (req, res) => {
    const citas = listaCitas.filter(c => String(c.idUsuario) === String(req.params.idUsuario));
    return res.status(200).json({ ok: true, citas });
});

// ==========================================
// RUTA 6: Horarios disponibles (GET)
// ==========================================
app.get('/api/horarios-disponibles', (req, res) => {
    const { idVehiculo, fecha } = req.query;
    if (!idVehiculo || !fecha) {
        return res.status(400).json({ ok: false, mensaje: 'idVehiculo y fecha son requeridos.' });
    }
    const ocupados = listaCitas
        .filter(c => c.idVehiculo === idVehiculo && c.fecha === fecha && c.estado !== 'cancelada')
        .map(c => c.horario);
    const disponibles = HORARIOS.filter(h => !ocupados.includes(h));
    return res.status(200).json({ ok: true, horarios: disponibles });
});

// ==========================================
// RUTA 7: Verificar disponibilidad de vehículo (GET)
// ==========================================
app.get('/api/vehiculos/:id', (req, res) => {
    const vehiculo = listaVehiculos.find(v => v.id === req.params.id);
    if (!vehiculo) return res.status(404).json({ ok: false, mensaje: 'Vehículo no encontrado.' });
    return res.status(200).json({ ok: true, vehiculo });
});

// ==========================================
// RUTA 8: Registrar nueva cita (POST)
// ==========================================
app.post('/api/citas', (req, res) => {
    const { idUsuario, idVehiculo, tipoCita, fecha, horario, cliente, auto, imagen } = req.body;

    // Paso 8: validar campos completos
    if (idUsuario == null || !idVehiculo || !tipoCita || !fecha || !horario) {
        return res.status(400).json({ ok: false, mensaje: 'Completa todos los campos para continuar.' });
    }

    // Validar que la fecha no sea pasada (fecha en formato M/D/YYYY)
    const [mes, dia, anio] = fecha.split('/').map(Number);
    const fechaCita = new Date(anio, mes - 1, dia);
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    if (fechaCita < hoy) {
        return res.status(400).json({ ok: false, mensaje: 'No puedes agendar una cita para una fecha pasada.' });
    }

    // Paso 3: verificar disponibilidad del vehículo
    const vehiculo = listaVehiculos.find(v => v.id === idVehiculo);
    if (!vehiculo || !vehiculo.disponible) {
        return res.status(400).json({ ok: false, mensaje: 'Este vehículo ya no está disponible.' });
    }

    // Paso 4: verificar cita duplicada activa para el mismo vehículo
    const citaDuplicada = listaCitas.find(c =>
        String(c.idUsuario) === String(idUsuario) &&
        c.idVehiculo === idVehiculo &&
        c.estado === 'activa'
    );
    if (citaDuplicada) {
        return res.status(400).json({ ok: false, mensaje: 'Ya tienes una cita activa para este vehículo.' });
    }

    // Verificar que el usuario no tenga ya otra cita a la misma hora ese día
    const citaMismaHora = listaCitas.find(c =>
        String(c.idUsuario) === String(idUsuario) &&
        c.fecha === fecha &&
        c.horario === horario &&
        c.estado !== 'cancelada'
    );
    if (citaMismaHora) {
        return res.status(400).json({ ok: false, mensaje: 'Ya tienes una cita agendada a esa hora ese día. Elige un horario diferente.' });
    }

    // Verificar que el horario siga disponible
    const horarioOcupado = listaCitas.find(c =>
        c.idVehiculo === idVehiculo &&
        c.fecha === fecha &&
        c.horario === horario &&
        c.estado !== 'cancelada'
    );
    if (horarioOcupado) {
        return res.status(400).json({ ok: false, mensaje: 'El horario seleccionado ya no está disponible. Por favor elige otro.' });
    }

    const nuevaCita = {
        id: String(citaIdCounter++),
        idUsuario: String(idUsuario),
        idVehiculo,
        tipoCita,
        fecha,
        horario,
        estado: 'activa',
        // Campos de visualización para el panel admin
        cliente: cliente || '',
        auto: auto || vehiculo.nombre,
        imagen: imagen || '',
        fechaCreacion: new Date().toISOString()
    };

    listaCitas.push(nuevaCita);
    console.log(`📅 [CITA]: Nueva cita registrada — ${nuevaCita.cliente} → ${nuevaCita.auto} el ${fecha} a las ${horario}`);

    return res.status(201).json({ ok: true, mensaje: 'Cita registrada exitosamente.', cita: nuevaCita });
});

// ==========================================
// RUTA 9: Actualizar estado de cita (PATCH)
// ==========================================
app.patch('/api/citas/:id', (req, res) => {
    const { estado } = req.body;
    const estadosValidos = ['activa', 'completada', 'cancelada'];

    if (!estado || !estadosValidos.includes(estado)) {
        return res.status(400).json({ ok: false, mensaje: 'Estado inválido.' });
    }

    const cita = listaCitas.find(c => String(c.id) === String(req.params.id));
    if (!cita) {
        return res.status(404).json({ ok: false, mensaje: 'Cita no encontrada.' });
    }

    cita.estado = estado;
    console.log(`📅 [CITA]: Cita #${req.params.id} de ${cita.cliente} → estado: ${estado}`);

    return res.status(200).json({ ok: true, mensaje: `Cita actualizada a "${estado}".` });
});

// ==========================================
// RUTA 10: Reprogramar cita (PATCH)
// ==========================================
app.patch('/api/citas/:id/reprogramar', (req, res) => {
    const { fecha, horario } = req.body;

    if (!fecha || !horario) {
        return res.status(400).json({ ok: false, mensaje: 'Fecha y horario son requeridos.' });
    }

    const cita = listaCitas.find(c => String(c.id) === String(req.params.id));
    if (!cita) {
        return res.status(404).json({ ok: false, mensaje: 'Cita no encontrada.' });
    }

    if (cita.estado !== 'activa') {
        return res.status(400).json({ ok: false, mensaje: 'Solo se pueden reprogramar citas activas.' });
    }

    // Validar que la nueva fecha no sea pasada (fecha en formato M/D/YYYY)
    const [mes, dia, anio] = fecha.split('/').map(Number);
    const fechaNueva = new Date(anio, mes - 1, dia);
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    if (fechaNueva < hoy) {
        return res.status(400).json({ ok: false, mensaje: 'No puedes reprogramar una cita para una fecha pasada.' });
    }

    // Verificar que el horario esté disponible para ese vehículo (excluyendo la propia cita)
    const horarioOcupado = listaCitas.find(c =>
        c.idVehiculo === cita.idVehiculo &&
        c.fecha === fecha &&
        c.horario === horario &&
        c.estado !== 'cancelada' &&
        String(c.id) !== String(req.params.id)
    );
    if (horarioOcupado) {
        return res.status(400).json({ ok: false, mensaje: 'El horario seleccionado ya no está disponible. Elige otro.' });
    }

    // Verificar que el usuario no tenga ya otra cita a la misma hora ese día (excluyendo la propia)
    const citaMismaHora = listaCitas.find(c =>
        String(c.idUsuario) === String(cita.idUsuario) &&
        c.fecha === fecha &&
        c.horario === horario &&
        c.estado !== 'cancelada' &&
        String(c.id) !== String(req.params.id)
    );
    if (citaMismaHora) {
        return res.status(400).json({ ok: false, mensaje: 'Ya tienes otra cita a esa hora ese día. Elige un horario diferente.' });
    }

    const fechaAnterior = cita.fecha;
    const horarioAnterior = cita.horario;
    cita.fecha = fecha;
    cita.horario = horario;

    console.log(`🔄 [REPROGRAMAR]: Cita #${req.params.id} de ${cita.cliente} → antes: ${fechaAnterior} ${horarioAnterior} → ahora: ${fecha} ${horario}`);

    return res.status(200).json({ ok: true, mensaje: 'Cita reprogramada exitosamente.', cita });
});

// ENCENDER EL SERVIDOR
app.listen(PORT, () => {
    console.log(`\n🚀 Servidor Backend de MotorStocks listo y escuchando en: http://localhost:${PORT}`);
    console.log(`👉 Ruta para registrar: POST http://localhost:${PORT}/api/registro`);
    console.log(`👉 Ruta para ver usuarios: GET http://localhost:${PORT}/api/usuarios\n`);
});