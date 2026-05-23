const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000; // El backend correrá en el puerto 3000

// CONFIGURACIONES (Middlewares)
app.use(cors());          // Permite que tu app de Angular (puerto 4200) le haga peticiones al backend
app.use(express.json());  // Permite que el servidor entienda datos en formato JSON que envíe el cliente

// Base de datos simulada en memoria (Array)
const usuariosRegistrados = [];

// ==========================================
// RUTA 1: Recibir registros desde Angular (POST)
// ==========================================
app.post('/api/registro', (req, res) => {
    // Extraemos los datos que rellenó el usuario en el formulario de MotorStocks
    const { nombre, correo, password } = req.body;

    // Validación básica en el servidor
    if (!nombre || !correo || !password) {
        return res.status(400).json({ 
            ok: false, 
            mensaje: 'Faltan campos obligatorios en el formulario.' 
        });
    }

    // Creamos el nuevo usuario con un ID único simulado
    const nuevoUsuario = {
        id: usuariosRegistrados.length + 1,
        nombre,
        correo,
        password, // Nota: En producción, aquí se encriptaría la contraseña por seguridad
        fechaRegistro: new Date()
    };

    // Guardamos el usuario en nuestra "base de datos" temporal
    usuariosRegistrados.push(nuevoUsuario);

    // Mostramos en la terminal del servidor que todo salió bien
    console.log('====== ¡NUEVO USUARIO REGISTRADO EN EL BACKEND! ======');
    console.log(nuevoUsuario);
    console.log(`Total usuarios en el sistema: ${usuariosRegistrados.length}\n`);

    // Le respondemos a Angular con éxito
    return res.status(201).json({
        ok: true,
        mensaje: `¡Usuario ${nombre} creado con éxito en el servidor!`,
        usuarioId: nuevoUsuario.id
    });
});

// ==========================================
// RUTA 2: Consultar usuarios registrados (GET)
// ==========================================
app.get('/api/usuarios', (req, res) => {
    res.json({
        ok: true,
        total: usuariosRegistrados.length,
        usuarios: usuariosRegistrados
    });
});

// ENCENDER EL SERVIDOR
app.listen(PORT, () => {
    console.log(`\n🚀 Servidor Backend de MotorStocks listo y escuchando en: http://localhost:${PORT}`);
    console.log(`👉 Ruta para registrar: POST http://localhost:${PORT}/api/registro`);
    console.log(`👉 Ruta para ver usuarios: GET http://localhost:${PORT}/api/usuarios\n`);
});