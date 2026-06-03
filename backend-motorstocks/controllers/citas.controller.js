const { listaCitas, HORARIOS, carrosPath, ordenesPath, siguienteCitaId, guardarCitas, leerJSON } = require('../models/db.model');
const Cita = require('../clases/Cita');

function getCitas(req, res) {
    return res.status(200).json({ ok: true, citas: listaCitas });
}

function getCitasPorUsuario(req, res) {
    const citas = listaCitas.filter(c => String(c.idUsuario) === String(req.params.idUsuario));
    return res.status(200).json({ ok: true, citas });
}

function getHorariosDisponibles(req, res) {
    const { idVehiculo, fecha } = req.query;
    if (!idVehiculo || !fecha) {
        return res.status(400).json({ ok: false, mensaje: 'idVehiculo y fecha son requeridos.' });
    }
    const ocupados = listaCitas
        .filter(c => c.idVehiculo === idVehiculo && c.fecha === fecha && c.estado !== 'cancelada')
        .map(c => c.horario);
    const disponibles = HORARIOS.filter(h => !ocupados.includes(h));
    return res.status(200).json({ ok: true, horarios: disponibles });
}

function crearCita(req, res) {
    const { idUsuario, idVehiculo, tipoCita, fecha, horario, cliente, auto, imagen } = req.body;

    if (idUsuario == null || !idVehiculo || !tipoCita || !fecha || !horario) {
        return res.status(400).json({ ok: false, mensaje: 'Completa todos los campos para continuar.' });
    }

    // Validar que la fecha no sea pasada (formato DD/MM/YYYY)
    const [dia, mes, anio] = fecha.split('/').map(Number);
    const fechaCita = new Date(anio, mes - 1, dia);
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    if (fechaCita < hoy) {
        return res.status(400).json({ ok: false, mensaje: 'No puedes agendar una cita para una fecha pasada.' });
    }

    let carros, ordenes;
    try {
        carros  = leerJSON(carrosPath);
        ordenes = leerJSON(ordenesPath);
    } catch {
        return res.status(500).json({ ok: false, mensaje: 'Error al leer la base de datos.' });
    }

    const vehiculo = carros.find(v => String(v.id) === String(idVehiculo));
    if (!vehiculo) {
        return res.status(400).json({ ok: false, mensaje: 'Vehículo no encontrado.' });
    }

    if (vehiculo.reservado) {
        // Permitir cita si el solicitante es el comprador de este vehículo
        const tieneOrden = ordenes.some(o => {
            if (String(o.comprador.id) !== String(idUsuario)) return false;
            if (o.estado !== 'Reservado') return false;
            if (o.vehiculo.idVehiculo) return String(o.vehiculo.idVehiculo) === String(idVehiculo);
            return o.vehiculo.vin && o.vehiculo.vin === vehiculo.vin;
        });
        if (!tieneOrden) {
            return res.status(400).json({ ok: false, mensaje: 'Este vehículo ya no está disponible.' });
        }
    }

    // Verificar cita duplicada activa para el mismo vehículo
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

    // Verificar que el horario siga disponible para ese vehículo
    const horarioOcupado = listaCitas.find(c =>
        c.idVehiculo === idVehiculo &&
        c.fecha === fecha &&
        c.horario === horario &&
        c.estado !== 'cancelada'
    );
    if (horarioOcupado) {
        return res.status(400).json({ ok: false, mensaje: 'El horario seleccionado ya no está disponible. Por favor elige otro.' });
    }

    const nuevaCita = new Cita({
        id:         siguienteCitaId(),
        idUsuario,
        idVehiculo,
        tipoCita,
        fecha,
        horario,
        cliente,
        auto:       auto || vehiculo.nombre,
        imagen
    });

    listaCitas.push(nuevaCita);
    guardarCitas();
    console.log(`📅 [CITA]: Nueva cita — ${nuevaCita.cliente} → ${nuevaCita.auto} el ${fecha} a las ${horario}`);

    return res.status(201).json({ ok: true, mensaje: 'Cita registrada exitosamente.', cita: nuevaCita });
}

function actualizarEstadoCita(req, res) {
    const { estado } = req.body;
    const estadosValidos = ['activa', 'completada', 'cancelada'];

    if (!estado || !estadosValidos.includes(estado)) {
        return res.status(400).json({ ok: false, mensaje: 'Estado inválido.' });
    }

    const cita = listaCitas.find(c => String(c.id) === String(req.params.id));
    if (!cita) return res.status(404).json({ ok: false, mensaje: 'Cita no encontrada.' });

    cita.estado = estado;
    guardarCitas();
    console.log(`📅 [CITA]: Cita #${req.params.id} de ${cita.cliente} → estado: ${estado}`);

    return res.status(200).json({ ok: true, mensaje: `Cita actualizada a "${estado}".` });
}

function reprogramarCita(req, res) {
    const { fecha, horario } = req.body;

    if (!fecha || !horario) {
        return res.status(400).json({ ok: false, mensaje: 'Fecha y horario son requeridos.' });
    }

    const cita = listaCitas.find(c => String(c.id) === String(req.params.id));
    if (!cita) return res.status(404).json({ ok: false, mensaje: 'Cita no encontrada.' });
    if (cita.estado !== 'activa') {
        return res.status(400).json({ ok: false, mensaje: 'Solo se pueden reprogramar citas activas.' });
    }

    // Validar que la nueva fecha no sea pasada
    const [dia, mes, anio] = fecha.split('/').map(Number);
    const fechaNueva = new Date(anio, mes - 1, dia);
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    if (fechaNueva < hoy) {
        return res.status(400).json({ ok: false, mensaje: 'No puedes reprogramar una cita para una fecha pasada.' });
    }

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

    const fechaAnterior   = cita.fecha;
    const horarioAnterior = cita.horario;
    cita.fecha   = fecha;
    cita.horario = horario;
    guardarCitas();

    console.log(`🔄 [REPROGRAMAR]: Cita #${req.params.id} → ${fechaAnterior} ${horarioAnterior} → ${fecha} ${horario}`);

    return res.status(200).json({ ok: true, mensaje: 'Cita reprogramada exitosamente.', cita });
}

module.exports = { getCitas, getCitasPorUsuario, getHorariosDisponibles, crearCita, actualizarEstadoCita, reprogramarCita };
