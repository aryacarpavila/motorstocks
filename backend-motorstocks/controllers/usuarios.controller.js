const { usuariosRegistrados } = require('../models/db.model');

function getUsuarios(req, res) {
    const usuariosSeguros = usuariosRegistrados.map(u => {
        const { password, ...resto } = u;
        return resto;
    });
    return res.status(200).json({ ok: true, usuarios: usuariosSeguros });
}

module.exports = { getUsuarios };
