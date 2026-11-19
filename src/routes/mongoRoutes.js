const express = require('express');
const { body } = require('express-validator');
const { validarCampos } = require('../middlewares/errorMiddleware');
const MongoOperacionesService = require('../services/mongoOperacionesService');

const router = express.Router();

router.get('/resumen', async (req, res, next) => {
  try {
    const datos = await MongoOperacionesService.obtenerResumen();
    res.json({ ok: true, datos });
  } catch (error) {
    next(error);
  }
});

router.post(
  '/eliminar-aleatorio',
  [
    body('coleccion').isIn(MongoOperacionesService.coleccionesBorrables).withMessage('Colección no permitida para eliminación web'),
    validarCampos
  ],
  async (req, res, next) => {
    try {
      const datos = await MongoOperacionesService.eliminarAleatorio(req.body.coleccion);
      res.json({ ok: true, mensaje: 'Documento eliminado aleatoriamente', datos });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/indices', async (req, res, next) => {
  try {
    const datos = await MongoOperacionesService.crearIndices();
    res.json({ ok: true, mensaje: 'Índices creados y verificados', datos });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
