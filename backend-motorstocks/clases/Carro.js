class Carro {
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
