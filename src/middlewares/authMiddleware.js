const jwt = require('jsonwebtoken');
const { obtenerJwtSecret } = require('../config/jwt');

function verificarToken(req, res, next) {
  const encabezado = req.headers.authorization;

  if (!encabezado || !encabezado.startsWith('Bearer ')) {
    return res.status(401).json({ ok: false, mensaje: 'No autorizado. Inicia sesión para continuar.' });
  }

  let secreto;
  try {
    secreto = obtenerJwtSecret();
  } catch (error) {
    return res.status(503).json({ ok: false, codigo: error.codigo, mensaje: error.message });
  }

  try {
    req.usuario = jwt.verify(encabezado.slice(7), secreto);
    return next();
  } catch (error) {
    return res.status(401).json({ ok: false, mensaje: 'Token inválido o expirado. Inicia sesión de nuevo.' });
  }
}

module.exports = { verificarToken };
