const express = require('express');
const { body } = require('express-validator');
const InventarioService = require('../services/inventarioService');
const { validarCampos } = require('../middlewares/errorMiddleware');

const router = express.Router();

// Registrar entrada de lote
router.post(
  '/lotes',
  [
    body('corte_id').isInt({ min: 1 }).withMessage('ID de corte requerido'),
    body('sucursal_id').isInt({ min: 1 }).withMessage('ID de sucursal requerido'),
    body('proveedor_id').isInt({ min: 1 }).withMessage('ID de proveedor requerido'),
    body('kg_iniciales').isFloat({ min: 0.1 }).withMessage('Los kilos iniciales deben ser mayores a 0'),
    body('costo_kg').isFloat({ min: 0.01 }).withMessage('El costo por kg debe ser mayor a 0'),
    body('fecha_caducidad').isISO8601().withMessage('Fecha de caducidad inválida (formato YYYY-MM-DD)'),
    validarCampos
  ],
  async (req, res, next) => {
    try {
      const lote = await InventarioService.registrarLote(req.body);
      res.status(201).json({ ok: true, mensaje: 'Lote registrado con éxito', datos: lote });
    } catch (error) {
      next(error);
    }
  }
);

// Consultar stock agrupado por corte para una sucursal
router.get('/', async (req, res, next) => {
  try {
    const { sucursal_id } = req.query;
    if (!sucursal_id) {
      return res.status(400).json({ ok: false, mensaje: 'El parámetro sucursal_id es obligatorio' });
    }
    const inventario = await InventarioService.obtenerInventarioPorSucursal(sucursal_id);
    res.json({ ok: true, datos: inventario });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

