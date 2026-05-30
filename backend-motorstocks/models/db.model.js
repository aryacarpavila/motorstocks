const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'db.json');

function leerDB() {
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function escribirDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
}

// Cargar datos desde db.json al arrancar (persisten entre reinicios)
const _db = leerDB();
const usuariosRegistrados = _db.usuarios || [];
const ordenesDeCompra = _db.ordenes || [];

// Reconstruir autosReservados desde las órdenes cargadas
const autosReservados = {};
ordenesDeCompra.forEach(orden => {
    if (orden.estado === 'Reservado') {
        const clave = `${orden.vehiculo.marca}-${orden.vehiculo.modelo}`;
        autosReservados[clave] = { idOrden: orden.idOrden, comprador: `${orden.comprador.nombre} ${orden.comprador.apellido}` };
    }
});
const listaCitas = [];
let citaIdCounter = 1;

const HORARIOS = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];

function generarIdOrden() {
    const anio = new Date().getFullYear();
    const numero = String(ordenesDeCompra.length + 1).padStart(5, '0');
    return `MS-${anio}-${numero}`;
}

function siguienteCitaId() {
    return String(citaIdCounter++);
}

// Guarda el array de usuarios actualizado en db.json
function guardarUsuarios() {
    const db = leerDB();
    db.usuarios = usuariosRegistrados;
    escribirDB(db);
}

module.exports = {
    usuariosRegistrados,
    ordenesDeCompra,
    autosReservados,
    listaCitas,
    HORARIOS,
    dbPath,
    leerDB,
    escribirDB,
    guardarUsuarios,
    generarIdOrden,
    siguienteCitaId
};
