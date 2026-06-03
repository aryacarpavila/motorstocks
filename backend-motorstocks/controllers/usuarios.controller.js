const Cuenta = require('../clases/Cuenta');

function getUsuarios(req, res) {
    const usuariosSeguros = Cuenta.lista.map(({ password, ...resto }) => resto);
    return res.status(200).json({ ok: true, usuarios: usuariosSeguros });
}

module.exports = { getUsuarios };
