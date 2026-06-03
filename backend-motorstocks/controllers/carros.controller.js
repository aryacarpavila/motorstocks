const Carro       = require('../clases/Carro');
const Transaccion = require('../clases/Transaccion');

function getCarros(req, res) {
    try {
        const carros = Carro.leer();
        return res.status(200).json(carros.filter(c => !c.vendido));
    } catch {
        return res.status(500).json({ ok: false, mensaje: 'Error al leer la base de datos.' });
    }
}

function getCarrosAdmin(req, res) {
    try {
        return res.status(200).json(Carro.leer());
    } catch {
        return res.status(500).json({ ok: false, mensaje: 'Error al leer la base de datos.' });
    }
}

function getCarroPorId(req, res) {
    const idUsuario = req.query.idUsuario;
    try {
        const carros = Carro.leer();
        const carro  = carros.find(c => String(c.id) === String(req.params.id));
        if (!carro) return res.status(404).json({ ok: false, mensaje: 'Carro no encontrado.' });

        let disponible = !carro.reservado;

        if (!disponible && idUsuario) {
            const tieneOrden = Transaccion.lista.some(o => {
                if (String(o.comprador.id) !== String(idUsuario)) return false;
                if (o.estado !== 'Reservado') return false;
                if (o.vehiculo.idVehiculo) return String(o.vehiculo.idVehiculo) === String(req.params.id);
                return o.vehiculo.vin && o.vehiculo.vin === carro.vin;
            });
            if (tieneOrden) disponible = true;
        }

        return res.status(200).json({ ok: true, vehiculo: { ...carro, disponible } });
    } catch {
        return res.status(500).json({ ok: false, mensaje: 'Error al leer la base de datos.' });
    }
}

function registrarCarro(req, res) {
    const datos = req.body;
    try {
        const carros = Carro.leer();

        if (datos.vin) {
            const existeVin = carros.find(c => c.vin?.toString().toLowerCase() === datos.vin.toString().toLowerCase());
            if (existeVin) return res.status(400).json({ ok: false, mensaje: 'El número de VIN ya está registrado en otro vehículo.' });
        }

        const toTitleCase = str => str ? str.trim().charAt(0).toUpperCase() + str.trim().slice(1).toLowerCase() : str;
        datos.marca       = toTitleCase(datos.marca);
        datos.modelo      = toTitleCase(datos.modelo);
        datos.color       = toTitleCase(datos.color);
        datos.combustible = datos.combustible?.trim() ?? datos.combustible;
        datos.transmision = datos.transmision?.trim() ?? datos.transmision;
        datos.tipo        = datos.tipo?.trim() ?? datos.tipo;

        const nuevoCarro = new Carro(datos);
        carros.push(nuevoCarro);
        Carro.guardar(carros);
        return res.status(201).json(nuevoCarro);
    } catch {
        return res.status(500).json({ ok: false, mensaje: 'Error al guardar en la base de datos.' });
    }
}

function liberarCarro(req, res) {
    try {
        const carros = Carro.leer();
        const idx    = carros.findIndex(c => String(c.id) === String(req.params.id));
        if (idx === -1) return res.status(404).json({ ok: false, mensaje: 'Carro no encontrado.' });
        carros[idx].reservado = false;
        Carro.guardar(carros);
        return res.status(200).json({ ok: true, mensaje: 'Carro liberado correctamente.' });
    } catch {
        return res.status(500).json({ ok: false, mensaje: 'Error al liberar el carro.' });
    }
}

module.exports = { getCarros, getCarrosAdmin, getCarroPorId, registrarCarro, liberarCarro };
