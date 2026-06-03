const Cita        = require('../clases/Cita');
const Carro       = require('../clases/Carro');
const Transaccion = require('../clases/Transaccion');

function getCitas(req, res) {
    return res.status(200).json({ ok: true, citas: Cita.lista });
}

function getCitasPorUsuario(req, res) {
    const citas = Cita.lista.filter(c => String(c.idUsuario) === String(req.params.idUsuario));
    return res.status(200).json({ ok: true, citas });
}

function getHorariosDisponibles(req, res) {
    const { idVehiculo, fecha } = req.query;
    if (!idVehiculo || !fecha) {
        return res.status(400).json({ ok: false, mensaje: 'idVehiculo y fecha son requeridos.' });
    }
    const ocupados    = Cita.lista
        .filter(c => c.idVehiculo === idVehiculo && c.fecha === fecha && c.estado !== 'cancelada')
        .map(c => c.horario);
    const disponibles = Cita.HORARIOS.filter(h => !ocupados.includes(h));
    return res.status(200).json({ ok: true, horarios: disponibles });
}

function crearCita(req, res) {
    const { idUsuario, idVehiculo, tipoCita, fecha, horario, cliente, auto, imagen } = req.body;

    if (idUsuario == null || !idVehiculo || !tipoCita || !fecha || !horario) {
        return res.status(400).json({ ok: false, mensaje: 'Completa todos los campos para continuar.' });
    }

    const [dia, mes, anio] = fecha.split('/').map(Number);
    const fechaCita = new Date(anio, mes - 1, dia);
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    if (fechaCita < hoy) {
        return res.status(400).json({ ok: false, mensaje: 'No puedes agendar una cita para una fecha pasada.' });
    }

    const carros = Carro.leer();
    const carro  = carros.find(c => String(c.id) === String(idVehiculo));
    if (!carro) return res.status(400).json({ ok: false, mensaje: 'Carro no encontrado.' });

    if (carro.reservado) {
        const tieneOrden = Transaccion.lista.some(o => {
            if (String(o.comprador.id) !== String(idUsuario)) return false;
            if (o.estado !== 'Reservado') return false;
            if (o.vehiculo.idVehiculo) return String(o.vehiculo.idVehiculo) === String(idVehiculo);
            return o.vehiculo.vin && o.vehiculo.vin === carro.vin;
        });
        if (!tieneOrden) return res.status(400).json({ ok: false, mensaje: 'Este carro ya no está disponible.' });
    }

    if (Cita.lista.find(c => String(c.idUsuario) === String(idUsuario) && c.idVehiculo === idVehiculo && c.estado === 'activa')) {
        return res.status(400).json({ ok: false, mensaje: 'Ya tienes una cita activa para este carro.' });
    }
    if (Cita.lista.find(c => String(c.idUsuario) === String(idUsuario) && c.fecha === fecha && c.horario === horario && c.estado !== 'cancelada')) {
        return res.status(400).json({ ok: false, mensaje: 'Ya tienes una cita agendada a esa hora ese día. Elige un horario diferente.' });
    }
    if (Cita.lista.find(c => c.idVehiculo === idVehiculo && c.fecha === fecha && c.horario === horario && c.estado !== 'cancelada')) {
        return res.status(400).json({ ok: false, mensaje: 'El horario seleccionado ya no está disponible. Por favor elige otro.' });
    }

    const nuevaCita = new Cita({
        id: Cita.siguienteId(),
        idUsuario, idVehiculo, tipoCita, fecha, horario,
        cliente, auto: auto || '', imagen
    });

    Cita.lista.push(nuevaCita);
    Cita.guardar();
    console.log(`📅 [CITA]: ${nuevaCita.cliente} → ${nuevaCita.auto} el ${fecha} a las ${horario}`);
    return res.status(201).json({ ok: true, mensaje: 'Cita registrada exitosamente.', cita: nuevaCita });
}

function actualizarEstadoCita(req, res) {
    const { estado } = req.body;
    if (!['activa', 'completada', 'cancelada'].includes(estado)) {
        return res.status(400).json({ ok: false, mensaje: 'Estado inválido.' });
    }
    const cita = Cita.lista.find(c => String(c.id) === String(req.params.id));
    if (!cita) return res.status(404).json({ ok: false, mensaje: 'Cita no encontrada.' });
    cita.estado = estado;
    Cita.guardar();
    console.log(`📅 [CITA]: #${req.params.id} → ${estado}`);
    return res.status(200).json({ ok: true, mensaje: `Cita actualizada a "${estado}".` });
}

function reprogramarCita(req, res) {
    const { fecha, horario } = req.body;
    if (!fecha || !horario) return res.status(400).json({ ok: false, mensaje: 'Fecha y horario son requeridos.' });

    const cita = Cita.lista.find(c => String(c.id) === String(req.params.id));
    if (!cita)                    return res.status(404).json({ ok: false, mensaje: 'Cita no encontrada.' });
    if (cita.estado !== 'activa') return res.status(400).json({ ok: false, mensaje: 'Solo se pueden reprogramar citas activas.' });

    const [dia, mes, anio] = fecha.split('/').map(Number);
    const fechaNueva = new Date(anio, mes - 1, dia);
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    if (fechaNueva < hoy) return res.status(400).json({ ok: false, mensaje: 'No puedes reprogramar una cita para una fecha pasada.' });

    if (Cita.lista.find(c => c.idVehiculo === cita.idVehiculo && c.fecha === fecha && c.horario === horario && c.estado !== 'cancelada' && String(c.id) !== String(req.params.id))) {
        return res.status(400).json({ ok: false, mensaje: 'El horario seleccionado ya no está disponible. Elige otro.' });
    }
    if (Cita.lista.find(c => String(c.idUsuario) === String(cita.idUsuario) && c.fecha === fecha && c.horario === horario && c.estado !== 'cancelada' && String(c.id) !== String(req.params.id))) {
        return res.status(400).json({ ok: false, mensaje: 'Ya tienes otra cita a esa hora ese día. Elige un horario diferente.' });
    }

    const ant = `${cita.fecha} ${cita.horario}`;
    cita.fecha = fecha; cita.horario = horario;
    Cita.guardar();
    console.log(`🔄 [REPROGRAMAR]: #${req.params.id} ${ant} → ${fecha} ${horario}`);
    return res.status(200).json({ ok: true, mensaje: 'Cita reprogramada exitosamente.', cita });
}

module.exports = { getCitas, getCitasPorUsuario, getHorariosDisponibles, crearCita, actualizarEstadoCita, reprogramarCita };
