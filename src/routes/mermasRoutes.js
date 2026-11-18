const express = require('express');
const { body } = require('express-validator');
const InventarioService = require('../services/inventarioService');
const { validarCampos } = require('../middlewares/errorMiddleware');

const router = express.Router();

// Registrar merma
router.post(
  '/',
  [
    body('lote_id').isMongoId().withMessage('ID de lote inválido'),
    body('kg').isFloat({ min: 0.01 }).withMessage('Los kilos mermados deben ser mayores a 0'),
    body('motivo').isIn(['caducidad', 'mal_corte', 'descongelado', 'contaminacion', 'otro']).withMessage('Motivo de merma inválido'),
    validarCampos
  ],
  async (req, res, next) => {
    try {
      const merma = await InventarioService.registrarMerma(req.body);
      res.status(201).json({ ok: true, mensaje: 'Merma registrada con éxito', datos: merma });
    } catch (error) {
      next(error);
    }
  }
);

// Listar mermas
router.get('/', async (req, res, next) => {
  try {
    const mermas = await InventarioService.listarMermas(req.query);
    res.json({ ok: true, datos: mermas });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

