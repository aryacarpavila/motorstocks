const fs   = require('fs');
const path = require('path');

const _ruta = path.join(__dirname, '..', 'data', 'carros.json');

class Carro {
    // ─── Acceso a datos ──────────────────────────────────────────────────────
    static ruta = _ruta;

    static leer() {
        return JSON.parse(fs.readFileSync(Carro.ruta, 'utf8'));
    }

    static guardar(carros) {
        fs.writeFileSync(Carro.ruta, JSON.stringify(carros, null, 2), 'utf8');
    }

    // ─── Constructor ─────────────────────────────────────────────────────────
    constructor({ id, marca, modelo, precio, ano, kilometraje, imagen,
                  motor, transmision, blindaje, color, tipo, combustible,
                  vin, reservado = false, vendido = false }) {
        this.id          = id || Date.now().toString();
        this.marca       = marca;
        this.modelo      = modelo;
        this.precio      = precio;
        this.ano         = ano;
        this.kilometraje = kilometraje || '';
        this.imagen      = imagen      || '';
        this.motor       = motor       || '';
        this.transmision = transmision || '';
        this.blindaje    = blindaje    || '';
        this.color       = color       || '';
        this.tipo        = tipo        || '';
        this.combustible = combustible || '';
        this.vin         = vin         || '';
        this.reservado   = reservado;
        this.vendido     = vendido;
    }
}

module.exports = Carro;
