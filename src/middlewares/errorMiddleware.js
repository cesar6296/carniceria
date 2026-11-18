const { validationResult } = require('express-validator');

// Middleware para verificar errores de express-validator
function validarCampos(req, res, next) {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({
      ok: false,
      mensaje: 'Error de validación en los datos enviados',
      errores: errores.array().map(e => ({ campo: e.path, mensaje: e.msg }))
    });
  }
  next();
}

// Middleware de manejo de errores centralizado
function manejadorErrores(err, req, res, next) {
  console.error('⚠️ Error capturado:', err.message);

  const status = err.statusCode || (err.name === 'ValidationError' ? 400 : 500);
  const respuesta = {
    ok: false,
    mensaje: err.message || 'Ocurrió un error interno en el servidor'
  };

  if (err.corte_faltante) {
    respuesta.corte_faltante = err.corte_faltante;
  }

  // Ocultar stack trace en producción
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    respuesta.pila = err.stack;
  }

  res.status(status).json(respuesta);
}

module.exports = {
  validarCampos,
  manejadorErrores
};

