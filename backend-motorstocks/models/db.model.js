const fs   = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');

const carrosPath   = path.join(dataDir, 'carros.json');
const usuariosPath = path.join(dataDir, 'usuarios.json');
const citasPath    = path.join(dataDir, 'citas.json');
const ordenesPath  = path.join(dataDir, 'ordenes.json');
const ventasPath   = path.join(dataDir, 'ventas.json');

// ─── Helpers genéricos ───────────────────────────────────────────────────────
function leerJSON(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}
function guardarJSON(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// ─── Usuarios ────────────────────────────────────────────────────────────────
const usuariosRegistrados = leerJSON(usuariosPath);
function guardarUsuarios() {
    guardarJSON(usuariosPath, usuariosRegistrados);
}

// ─── Órdenes ─────────────────────────────────────────────────────────────────
const ordenesDeCompra = leerJSON(ordenesPath);

// Reconstruir mapa de autos reservados desde las órdenes cargadas
const autosReservados = {};
ordenesDeCompra.forEach(orden => {
    if (orden.estado === 'Reservado') {
        const clave = `${orden.vehiculo.marca}-${orden.vehiculo.modelo}`;
        autosReservados[clave] = {
            idOrden:   orden.idOrden,
            comprador: `${orden.comprador.nombre} ${orden.comprador.apellido}`
        };
    }
});

// ─── Citas (persistentes) ────────────────────────────────────────────────────
const listaCitas = leerJSON(citasPath);
let citaIdCounter = listaCitas.length > 0
    ? Math.max(...listaCitas.map(c => parseInt(c.id) || 0)) + 1
    : 1;

function guardarCitas() {
    guardarJSON(citasPath, listaCitas);
}

// ─── Constantes ──────────────────────────────────────────────────────────────
const HORARIOS = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];

// ─── Generadores de ID ───────────────────────────────────────────────────────
function generarIdOrden() {
    const anio   = new Date().getFullYear();
    const numero = String(ordenesDeCompra.length + 1).padStart(5, '0');
    return `MS-${anio}-${numero}`;
}

function siguienteCitaId() {
    return String(citaIdCounter++);
}

module.exports = {
    // Paths
    carrosPath, usuariosPath, citasPath, ordenesPath, ventasPath,
    // Arrays en memoria
    usuariosRegistrados, ordenesDeCompra, autosReservados, listaCitas,
    // Constantes
    HORARIOS,
    // Helpers
    leerJSON, guardarJSON,
    guardarUsuarios, guardarCitas,
    generarIdOrden, siguienteCitaId
};
